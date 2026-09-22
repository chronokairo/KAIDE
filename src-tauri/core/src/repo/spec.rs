//! Specification-Locked Execution (v0.9.5).
//!
//! The original task specification is compiled **once per turn** into an
//! immutable [`TaskSpec`] that planner, coder, repair and verifier all obey.
//! The spec carries:
//!
//! * the raw task text (never re-derived from the mutable session context);
//! * the deterministic [`TaskContract`] (required API signatures + type
//!   invariants + behavioral requirement notes);
//! * a baseline snapshot of every method signature that already exists in the
//!   repository at turn start (used to reject silent API drift);
//! * the locked acceptance-oracle test file generated before implementation.
//!
//! The harness judges; the model synthesizes. Signature and baseline checks
//! are purely deterministic structure comparisons — no LLM judging.

use crate::repo::contract::{ParamSpec, RequiredMethod, TaskContract};
use crate::repo::RepoMap;
use std::collections::BTreeMap;

/// Normalized receiver kind of a function or method signature.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SelfKind {
    ByRef,
    ByMutRef,
    Owned,
    OwnedMut,
}

impl SelfKind {
    pub fn parse(token: &str) -> Option<Self> {
        match token.trim() {
            "&self" => Some(SelfKind::ByRef),
            "&mut self" => Some(SelfKind::ByMutRef),
            "self" => Some(SelfKind::Owned),
            "mut self" => Some(SelfKind::OwnedMut),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            SelfKind::ByRef => "&self",
            SelfKind::ByMutRef => "&mut self",
            SelfKind::Owned => "self",
            SelfKind::OwnedMut => "mut self",
        }
    }
}

/// A fully parsed function/method signature.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FnSignature {
    pub name: String,
    pub self_kind: Option<SelfKind>,
    /// Non-self parameters, order-sensitive.
    pub params: Vec<ParamSpec>,
    /// Pretty return type (`None` when no `->` clause).
    pub return_type: Option<String>,
}

impl FnSignature {
    /// Canonical rendering used in violation messages.
    pub fn render(&self) -> String {
        let mut out = String::new();
        out.push_str(&self.name);
        out.push('(');
        if let Some(s) = &self.self_kind {
            out.push_str(s.as_str());
        }
        for p in &self.params {
            if !out.ends_with('(') {
                out.push_str(", ");
            }
            out.push_str(&p.name);
            out.push_str(": ");
            out.push_str(&p.type_name);
        }
        out.push(')');
        if let Some(ret) = &self.return_type {
            out.push_str(" -> ");
            out.push_str(ret);
        }
        out
    }

    /// Structural equality against another signature (whitespace-insensitive
    /// on types; `_` parameter names act as wildcards).
    ///
    /// An UNSPECIFIED return type in the requirement is a wildcard: the task
    /// not naming a return does not forbid the idiomatic `-> Self`/`-> &T`.
    /// A SPECIFIED return must match exactly.
    pub fn matches_required(&self, other: &FnSignature) -> bool {
        self.self_kind == other.self_kind
            && self.params.len() == other.params.len()
            && self.params.iter().zip(other.params.iter()).all(|(a, b)| {
                (a.name == b.name || a.name == "_" || b.name == "_")
                    && norm_type(&a.type_name) == norm_type(&b.type_name)
            })
            && match (&self.return_type, &other.return_type) {
                // SYMMETRIC wildcard: an UNSPECIFIED return on either side
                // (requirement or implementation) imposes no constraint.
                // Specified-vs-specified must match exactly.
                (Some(a), Some(b)) => norm_type(a) == norm_type(b),
                _ => true,
            }
    }
}

fn norm_type(t: &str) -> String {
    t.chars().filter(|c| !c.is_whitespace()).collect()
}

/// A parsed signature together with its owning type (`Some("UserService")`
/// when declared inside `impl UserService { ... }`, `None` for free fns).
#[derive(Debug, Clone)]
pub struct ScopedSig {
    pub owner: Option<String>,
    pub sig: FnSignature,
    /// Original raw text of the signature (for messages).
    pub raw: String,
}

impl ScopedSig {
    /// Baseline-style key: `"Struct::method"` or `"method"` for free fns.
    pub fn key(&self) -> String {
        match &self.owner {
            Some(o) => format!("{o}::{}", self.sig.name),
            None => self.sig.name.clone(),
        }
    }
}

/// Snapshot of a pre-existing repository signature.
#[derive(Debug, Clone)]
pub struct BaselineEntry {
    pub sig: FnSignature,
    pub raw: String,
}

/// Locked acceptance-oracle test file produced before implementation starts.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AcceptanceOracle {
    /// Workspace-relative path, e.g. `tests/chronokairo_oracle_1730000000.rs`.
    pub path: String,
    pub content: String,
}

/// Immutable per-turn task specification. Born once from the raw user task;
/// never re-extracted from session context; shared everywhere via `Arc`.
#[derive(Debug, Clone)]
pub struct TaskSpec {
    pub raw_task: String,
    pub contract: TaskContract,
    /// Pre-existing signatures at turn start keyed by `Struct::method` / `method`.
    pub baseline: BTreeMap<String, BaselineEntry>,
    pub oracle: Option<AcceptanceOracle>,
    /// Package name from Cargo.toml (integration-test import path root).
    pub crate_name: Option<String>,
    /// Verbatim `src/lib.rs` (or `src/main.rs`) so the oracle references the
    /// REAL module tree instead of inventing `mod` paths.
    pub lib_rs: Option<String>,
}

impl TaskSpec {
    /// Spec-only constructor (no repo baseline, no oracle). Used by tests and
    /// as fallback when no workspace scan is available.
    pub fn from_task(task: &str) -> Self {
        Self {
            raw_task: task.to_string(),
            contract: TaskContract::extract(task),
            baseline: BTreeMap::new(),
            oracle: None,
            crate_name: None,
            lib_rs: None,
        }
    }

    /// Deterministic pre-write gate for a proposed patch of `file`.
    ///
    /// Rule 1 — Required API exactness: every occurrence of a required method
    /// name must match the required signature exactly (params, placement,
    /// types, receiver kind, return type).
    ///
    /// Rule 2 — Baseline preservation: any pre-existing method whose signature
    /// the patch changes is rejected unless the task contract explicitly
    /// redefines it with exactly the proposed shape.
    pub fn check_patch(&self, code: &str, file: &str) -> Result<(), String> {
        let proposed = parse_scoped_signatures(code);
        let mut violations: Vec<String> = Vec::new();

        // ---- Rule 1: required API exactness -------------------------------
        for m in &self.contract.methods {
            if let Some(target) = &m.file {
                if !file_matches(file, target) {
                    continue;
                }
            }
            let required = required_signature(m);
            for p in proposed.iter().filter(|p| p.sig.name == m.fn_name) {
                // When the required entry has no file scope, exempt clearly
                // unrelated pre-existing methods (baseline disagrees with the
                // requirement); those stay protected by Rule 2 instead.
                if m.file.is_none() {
                    if let Some(base) = self.baseline.get(&p.key()) {
                        if !base.sig.matches_required(&required) {
                            continue;
                        }
                    }
                }
                if !p.sig.matches_required(&required) {
                    violations.push(format!(
                        "CONTRACT VIOLATION in `{file}`\nRequired : {}\nProposed : {}\nDifferences:\n{}",
                        required.render(),
                        p.sig.render(),
                        describe_diff(&required, &p.sig)
                    ));
                }
            }
        }

        // ---- Rule 2: baseline preservation --------------------------------
        for p in &proposed {
            if let Some(base) = self.baseline.get(&p.key()) {
                if base.raw.trim() == p.raw.trim() || base.sig.matches_required(&p.sig) {
                    continue;
                }
                let explicitly_redefined = self.contract.methods.iter().any(|m| {
                    m.fn_name == p.sig.name
                        && m.file
                            .as_deref()
                            .map(|f| file_matches(file, f))
                            .unwrap_or(true)
                        && required_signature(m).matches_required(&p.sig)
                });
                if !explicitly_redefined {
                    let placement_hint = self
                        .contract
                        .methods
                        .iter()
                        .find(|m| m.fn_name == p.sig.name)
                        .map(|m| {
                            let qualified = match &m.owner {
                                Some(o) => format!("{o}::{}", m.raw_signature),
                                None => m.raw_signature.clone(),
                            };
                            let loc = m
                                .file
                                .as_deref()
                                .map(|f| format!(" (in `{f}`)"))
                                .unwrap_or_default();
                            format!("\nRequired placement per contract: `{qualified}`{loc}")
                        })
                        .unwrap_or_default();
                    violations.push(format!(
                        "API DRIFT in `{file}`\nExisting : {}\nProposed : {}\nThe patch silently changes an existing public API.\nPreserve existing signatures unless the task explicitly redefines this exact one.{placement_hint}",
                        base.raw.trim(),
                        p.raw.trim()
                    ));
                }
            }
        }

        if violations.is_empty() {
            return Ok(());
        }
        let mut err =
            String::from("Specification-Locked gate rejected this patch before any filesystem write:\n");
        for v in &violations {
            err.push_str(&format!("\n• {v}\n"));
        }
        err.push_str(
            "\nRule: implement EXACTLY the required API from the task specification.\n\
             Do not reinterpret, simplify or relocate required signatures.\n\
             Return the COMPLETE corrected file content inside a single code block.",
        );
        Err(err)
    }

    /// Prompt block describing the full locked spec for planner/coder/repair.
    pub fn to_prompt_string(&self) -> String {
        let mut out = String::new();
        out.push_str("### Specification Lock (immutable for this turn)\n");
        out.push_str("This specification was compiled once from the ORIGINAL task and cannot change during the turn.\n");
        let contract_block = self.contract.to_prompt_string();
        if !contract_block.is_empty() {
            out.push('\n');
            out.push_str(&contract_block);
        } else {
            out.push_str(
                "\nNo explicit signatures were extracted; follow the task text literally.\n",
            );
        }
        if let Some(oracle) = &self.oracle {
            out.push('\n');
            out.push_str(&format!(
                "Acceptance Oracle: `{}` was written before implementation and is LOCKED.\n\
                 You MUST NOT edit, delete, move or weaken this file.\n\
                 If its tests fail, change your implementation to satisfy them.\n",
                oracle.path
            ));
        }
        out
    }

    /// Extra directive appended to repair prompts while an oracle is active.
    pub fn oracle_repair_directive(&self) -> String {
        match &self.oracle {
            None => String::new(),
            Some(oracle) => format!(
                "\nACCEPTANCE ORACLE ACTIVE: `{}` is locked and immutable.\n\
                 Diagnostics pointing into that file mean your implementation's API does not match the required specification — fix the source files, never the oracle.",
                oracle.path
            ),
        }
    }

    /// True when `path` refers to the locked oracle file of this turn.
    pub fn locks_path(&self, path: &str) -> bool {
        self.oracle
            .as_ref()
            .map(|o| file_matches(path, &o.path))
            .unwrap_or(false)
    }
}

fn file_matches(file: &str, target: &str) -> bool {
    let norm = |s: &str| s.replace('\\', "/");
    let (f, t) = (norm(file), norm(target));
    f.ends_with(&t) || t.ends_with(&f)
}

pub(crate) fn required_signature(m: &RequiredMethod) -> FnSignature {
    FnSignature {
        name: m.fn_name.clone(),
        self_kind: m.self_kind.as_deref().and_then(SelfKind::parse),
        params: m.params.clone(),
        return_type: m.return_type.clone(),
    }
}

fn describe_diff(req: &FnSignature, prop: &FnSignature) -> String {
    let mut out = Vec::new();
    if req.self_kind != prop.self_kind {
        out.push(format!(
            "- receiver: expected `{}`, found `{}`",
            req.self_kind.as_ref().map(SelfKind::as_str).unwrap_or("(none)"),
            prop.self_kind.as_ref().map(SelfKind::as_str).unwrap_or("(none)")
        ));
    }
    if req.params.len() != prop.params.len() {
        let fmt = |ps: &[ParamSpec]| {
            ps.iter()
                .map(|p| format!("{}: {}", p.name, p.type_name))
                .collect::<Vec<_>>()
                .join(", ")
        };
        out.push(format!(
            "- parameters: expected [{}], found [{}]",
            fmt(&req.params),
            fmt(&prop.params)
        ));
    }
    if req.params.len() == prop.params.len()
        && !req.params.is_empty()
        && same_multiset(&req.params, &prop.params)
        && req
            .params
            .iter()
            .zip(prop.params.iter())
            .any(|(a, b)| a.name != b.name)
    {
        out.push("- parameter placement/order changed".to_string());
    }
    for (i, (a, b)) in req.params.iter().zip(prop.params.iter()).enumerate() {
        if norm_type(&a.type_name) != norm_type(&b.type_name) {
            out.push(format!(
                "- parameter {} (`{}`): expected type `{}`, found `{}`",
                i + 1,
                a.name,
                a.type_name,
                b.type_name
            ));
        } else if a.name != b.name && a.name != "_" && b.name != "_" {
            out.push(format!(
                "- parameter {}: expected name `{}`, found `{}`",
                i + 1,
                a.name,
                b.name
            ));
        }
    }
    match (&req.return_type, &prop.return_type) {
        (Some(r), Some(p)) if norm_type(r) != norm_type(p) => {
            out.push(format!("- return type: expected `{r}`, found `{p}`"));
        }
        (Some(r), None) => out.push(format!("- return type: expected `{r}`, found none")),
        (None, Some(p)) => out.push(format!("- return type: expected none, found `{p}`")),
        _ => {}
    }
    if out.is_empty() {
        out.push("- signature shape differs".to_string());
    }
    out.join("\n")
}

fn same_multiset(a: &[ParamSpec], b: &[ParamSpec]) -> bool {
    let mut x: Vec<String> = a.iter().map(|p| norm_type(&p.type_name)).collect();
    let mut y: Vec<String> = b.iter().map(|p| norm_type(&p.type_name)).collect();
    x.sort_unstable();
    y.sort_unstable();
    x == y
}

// ---------------------------------------------------------------------------
// Signature parsing
// ---------------------------------------------------------------------------

struct Scanner<'a> {
    src: &'a [u8],
    pos: usize,
}

impl<'a> Scanner<'a> {
    fn new(src: &'a str) -> Self {
        Self {
            src: src.as_bytes(),
            pos: 0,
        }
    }

    fn skip_trivia(&mut self) {
        loop {
            while self.pos < self.src.len() && (self.src[self.pos] as char).is_whitespace() {
                self.pos += 1;
            }
            if self.pos + 1 < self.src.len()
                && self.src[self.pos] == b'/'
                && self.src[self.pos + 1] == b'/'
            {
                while self.pos < self.src.len() && self.src[self.pos] != b'\n' {
                    self.pos += 1;
                }
                continue;
            }
            if self.pos + 1 < self.src.len()
                && self.src[self.pos] == b'/'
                && self.src[self.pos + 1] == b'*'
            {
                self.pos += 2;
                while self.pos + 1 < self.src.len()
                    && !(self.src[self.pos] == b'*' && self.src[self.pos + 1] == b'/')
                {
                    self.pos += 1;
                }
                self.pos = (self.pos + 2).min(self.src.len());
                continue;
            }
            break;
        }
    }

    fn eat_word(&mut self, word: &str) -> bool {
        self.skip_trivia();
        let w = word.as_bytes();
        if self.pos + w.len() > self.src.len() || &self.src[self.pos..self.pos + w.len()] != w {
            return false;
        }
        let after_ok = self
            .src
            .get(self.pos + w.len())
            .map(|c| {
                let c = *c;
                !(c as char).is_alphanumeric() && c != b'_'
            })
            .unwrap_or(true);
        if after_ok {
            self.pos += w.len();
            true
        } else {
            false
        }
    }

    fn peek_byte(&self) -> Option<u8> {
        self.src.get(self.pos).copied()
    }

    fn read_ident(&mut self) -> Option<String> {
        self.skip_trivia();
        let start = self.pos;
        while self.pos < self.src.len() {
            let c = self.src[self.pos] as char;
            if c.is_alphanumeric() || c == '_' {
                self.pos += 1;
            } else {
                break;
            }
        }
        if self.pos == start {
            None
        } else {
            Some(String::from_utf8_lossy(&self.src[start..self.pos]).to_string())
        }
    }

    fn skip_string(&mut self) {
        // assumes current byte is '"'
        self.pos += 1;
        while self.pos < self.src.len() {
            match self.src[self.pos] {
                b'\\' => self.pos += 2,
                b'"' => {
                    self.pos += 1;
                    return;
                }
                _ => self.pos += 1,
            }
        }
    }

    /// Skips a char literal; when no closing quote appears nearby this was a
    /// lifetime (`'a`) and only the quote is consumed.
    fn try_skip_char_literal(&mut self) {
        let save = self.pos;
        self.pos += 1;
        let mut steps = 0;
        while self.pos < self.src.len() && steps < 6 {
            match self.src[self.pos] {
                b'\\' => self.pos += 2,
                b'\'' => {
                    self.pos += 1;
                    return;
                }
                b'\n' => break,
                _ => self.pos += 1,
            }
            steps += 1;
        }
        self.pos = save + 1; // lifetime like 'a
    }

    /// Reads a balanced `(...)` region (starting at the open paren),
    /// tolerating nested parens, generics, brackets, strings and comments.
    /// Returns the full text including delimiters.
    fn read_parens(&mut self) -> Option<String> {
        self.skip_trivia();
        if self.peek_byte() != Some(b'(') {
            return None;
        }
        let start = self.pos;
        let mut paren: i32 = 0;
        let mut angle: i32 = 0;
        while self.pos < self.src.len() {
            let c = self.src[self.pos];
            match c {
                b'"' => self.skip_string(),
                b'\'' => {
                    self.try_skip_char_literal();
                    continue;
                }
                b'/' if self.src.get(self.pos + 1) == Some(&b'/') => {
                    while self.pos < self.src.len() && self.src[self.pos] != b'\n' {
                        self.pos += 1;
                    }
                    continue;
                }
                b'(' => paren += 1,
                b')' => {
                    paren -= 1;
                    if paren == 0 {
                        self.pos += 1;
                        return Some(
                            String::from_utf8_lossy(&self.src[start..self.pos]).to_string(),
                        );
                    }
                }
                b'<' => angle += 1,
                b'>' if angle > 0 => angle -= 1,
                b'{' | b';' if paren <= 0 => return None,
                _ => {}
            }
            self.pos += 1;
        }
        None
    }

    /// Reads the return type following `->`, stopping at top-level `{`/`;`.
    fn read_return_type(&mut self) -> Option<String> {
        self.skip_trivia();
        if !(self.pos + 2 <= self.src.len()
            && &self.src[self.pos..self.pos + 2] == b"->")
        {
            return None;
        }
        self.pos += 2;
        let start = self.pos;
        let mut angle: i32 = 0;
        while self.pos < self.src.len() {
            let c = self.src[self.pos];
            match c {
                b'"' => self.skip_string(),
                b'/' if self.src.get(self.pos + 1) == Some(&b'/') => break,
                b'<' => angle += 1,
                b'>' if angle > 0 => angle -= 1,
                b'{' | b';' if angle <= 0 => break,
                _ => {}
            }
            self.pos += 1;
        }
        let text = String::from_utf8_lossy(&self.src[start..self.pos])
            .trim()
            .to_string();
        (!text.is_empty()).then_some(text)
    }
}

/// Parses every `fn` signature in `code`, attributing each to its owning
/// `impl Type` block (brace-depth heuristic adequate for generated files).
pub fn parse_scoped_signatures(code: &str) -> Vec<ScopedSig> {
    let mut out: Vec<ScopedSig> = Vec::new();
    let mut stack: Vec<Option<String>> = Vec::new();
    let mut current_owner: Option<String> = None;
    let mut pending_impl: Option<String> = None;
    let bytes = code.as_bytes();
    let mut sc = Scanner::new(code);

    while sc.pos < bytes.len() {
        let c = bytes[sc.pos];
        match c {
            b'"' => sc.skip_string(),
            b'\'' => {
                sc.try_skip_char_literal();
                continue;
            }
            b'/' if bytes.get(sc.pos + 1) == Some(&b'/') => {
                while sc.pos < bytes.len() && bytes[sc.pos] != b'\n' {
                    sc.pos += 1;
                }
            }
            b'/' if bytes.get(sc.pos + 1) == Some(&b'*') => {
                sc.skip_trivia();
                continue;
            }
            b'{' => {
                // Entering a block: preserve the enclosing owner on the stack,
                // then adopt a pending `impl Type` owner when opening its body.
                stack.push(current_owner.take());
                if let Some(owner) = pending_impl.take() {
                    current_owner = Some(owner);
                }
                sc.pos += 1;
                continue;
            }
            b'}' => {
                current_owner = stack.pop().flatten();
                sc.pos += 1;
                continue;
            }
            _ => {}
        }

        // `impl ... {` header?
        if looks_like_keyword(bytes, sc.pos, "impl") {
            if let Some(owner) = parse_impl_owner(code, sc.pos) {
                pending_impl = Some(owner);
            }
        }

        if looks_like_keyword(bytes, sc.pos, "fn") {
            let kw_start = sc.pos;
            sc.pos += 2;
            if let Some(sig) = parse_fn_after_name(&mut sc) {
                let raw_end = sc.pos;
                let raw = sanitize_sig_text(&code[kw_start..raw_end.min(code.len())]);
                out.push(ScopedSig {
                    owner: current_owner.clone(),
                    sig,
                    raw,
                });
                continue;
            }
            sc.pos = kw_start;
        }
        sc.pos += 1;
    }
    out
}

fn sanitize_sig_text(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn looks_like_keyword(bytes: &[u8], pos: usize, kw: &str) -> bool {
    let kb = kw.as_bytes();
    if pos + kb.len() > bytes.len() || &bytes[pos..pos + kb.len()] != kb {
        return false;
    }
    if pos > 0 {
        let prev = bytes[pos - 1] as char;
        if prev.is_alphanumeric() || prev == '_' {
            return false;
        }
    }
    bytes
        .get(pos + kb.len())
        .map(|c| {
            let c = *c;
            !(c as char).is_alphanumeric() && c != b'_'
        })
        .unwrap_or(false)
}

/// Extracts the implementing type name from an `impl` header starting at
/// `kw_pos`. Does not advance any scanner; leaves `{` for depth tracking.
fn parse_impl_owner(code: &str, kw_pos: usize) -> Option<String> {
    let rest = &code[kw_pos + 4..];
    let end = rest.find('{')?;
    let cleaned = strip_generics(&rest[..end]);
    let mut last_ident: Option<String> = None;
    for tok in cleaned.split_whitespace() {
        if tok == "for" {
            // The type implementing the trait follows `for`.
            last_ident = None;
            continue;
        }
        if tok.chars().next().map(|c| c.is_alphabetic() || c == '_').unwrap_or(false) {
            let candidate = tok.split("::").last().unwrap_or(tok).to_string();
            last_ident = Some(candidate);
        }
    }
    last_ident.filter(|n| !n.is_empty())
}

/// Removes `<...>` generic segments so header tokens are plain idents.
fn strip_generics(header: &str) -> String {
    let mut out = String::with_capacity(header.len());
    let mut angle: i32 = 0;
    for c in header.chars() {
        match c {
            '<' => angle += 1,
            '>' => angle -= 1,
            _ if angle > 0 => {}
            _ => out.push(c),
        }
    }
    out
}

fn parse_fn_after_name(sc: &mut Scanner) -> Option<FnSignature> {
    let name = sc.read_ident()?;
    let paren = sc.read_parens()?;
    let inner = &paren[1..paren.len().saturating_sub(1)];

    let mut self_kind: Option<SelfKind> = None;
    let mut params: Vec<ParamSpec> = Vec::new();
    for part in split_top_level_commas(inner) {
        let p = part.trim();
        if p.is_empty() {
            continue;
        }
        if let Some(sk) = SelfKind::parse(p) {
            self_kind = Some(sk);
            continue;
        }
        let p = p.strip_prefix("mut ").unwrap_or(p).trim();
        if let Some((pname, ptype)) = p.split_once(':') {
            let pname = pname.trim();
            if pname.is_empty() {
                continue;
            }
            params.push(ParamSpec {
                name: pname.to_string(),
                type_name: ptype.trim().to_string(),
            });
        } else if p == "_" {
            params.push(ParamSpec {
                name: "_".into(),
                type_name: "()".into(),
            });
        }
    }

    let return_type = sc.read_return_type();

    Some(FnSignature {
        name,
        self_kind,
        params,
        return_type,
    })
}

/// Splits on commas not nested inside `()`, `<>` or `[]`.
fn split_top_level_commas(src: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let bytes = src.as_bytes();
    let mut paren: i32 = 0;
    let mut angle: i32 = 0;
    let mut bracket: i32 = 0;
    let mut last = 0usize;
    let mut i = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'"' => {
                i += 1;
                while i < bytes.len() && bytes[i] != b'"' {
                    if bytes[i] == b'\\' {
                        i += 1;
                    }
                    i += 1;
                }
            }
            b'\'' => {
                // skip char literal or lifetime
                i += 1;
                while i < bytes.len() && bytes[i] != b'\'' {
                    if bytes[i] == b'\\' {
                        i += 1;
                    }
                    i += 1;
                }
            }
            b'(' => paren += 1,
            b')' => paren -= 1,
            b'[' => bracket += 1,
            b']' => bracket -= 1,
            b'<' => angle += 1,
            b'>' if angle > 0 => angle -= 1,
            b',' if paren == 0 && bracket == 0 && angle == 0 => {
                parts.push(&src[last..i]);
                last = i + 1;
            }
            _ => {}
        }
        i += 1;
    }
    parts.push(&src[last..]);
    parts
}

// ---------------------------------------------------------------------------
// Turn-start compilation
// ---------------------------------------------------------------------------

/// Compiles the immutable per-turn [`TaskSpec`]: contract extraction, repo
/// baseline snapshot, and (optionally) generation of the locked acceptance
/// oracle. Oracle failures degrade gracefully (turn proceeds without it).
pub async fn compile_task_spec(
    client: &crate::llm::router::LlmRouter,
    state: &mut crate::agent::state::AgentState,
    task: &str,
    hooks: &crate::agent::agent_loop::AgentHooks,
) -> TaskSpec {
    let mut spec = TaskSpec::from_task(task);

    // Crate identity + real module tree, so the oracle can import types via
    // the actual public path instead of hallucinating `mod` declarations.
    if let Some(cargo_toml) = state.files.read_file("Cargo.toml") {
        for line in cargo_toml.lines() {
            let line = line.trim();
            if let Some(rest) = line.strip_prefix("name") {
                let rest = rest.trim_start();
                if let Some(rest) = rest.strip_prefix('=') {
                    let name = rest.trim().trim_matches('"').trim_matches('\'').to_string();
                    if !name.is_empty() {
                        spec.crate_name = Some(name);
                        break;
                    }
                }
            }
        }
    }
    for candidate in ["src/lib.rs", "src/main.rs"] {
        if let Some(lib) = state.files.read_file(candidate) {
            spec.lib_rs = Some(lib);
            break;
        }
    }

    // Baseline snapshot of every existing signature in the repository.
    let repo_map = RepoMap::build(&state.config.workspace_dir);
    for f in &repo_map.files {
        for sym in &f.symbols {
            let mut owner: Option<String> = None;
            let sig_src: String = if let Some((struct_name, method_sig)) = sym.name.split_once("::")
            {
                owner = Some(struct_name.trim().to_string());
                method_sig.trim_start_matches("pub ").to_string()
            } else {
                sym.signature.clone().unwrap_or_default()
            };
            if sig_src.is_empty() {
                continue;
            }
            let mut sc = Scanner::new(&sig_src);
            if !sc.eat_word("fn") {
                continue;
            }
            if let Some(parsed) = parse_fn_after_name(&mut sc) {
                let key = match &owner {
                    Some(o) => format!("{o}::{}", parsed.name),
                    None => parsed.name.clone(),
                };
                spec.baseline.insert(
                    key,
                    BaselineEntry {
                        raw: sym
                            .signature
                            .clone()
                            .unwrap_or_else(|| parsed.render()),
                        sig: parsed,
                    },
                );
            }
        }
    }

    // Acceptance oracle: synthesized once, before any implementation exists.
    if state.config.spec_oracle && !spec.contract.methods.is_empty() {
        match lock_acceptance_oracle(client, state, &spec, hooks).await {
            Some(oracle) => {
                spec.oracle = Some(oracle);
            }
            None => {
                hooks.note(
                    "  [spec] oracle generation unavailable; proceeding without locked tests",
                );
            }
        }
    }

    spec
}

/// Generates, compile-validates and locks the acceptance oracle.
///
/// The oracle is written into the turn transaction immediately. It is then
/// checked with `cargo check --tests`: pre-implementation failures are
/// EXPECTED (the required API does not exist yet — that is the whole point),
/// so only oracle-authoring bugs (broken imports/mods: E0432/E0433/E0583/
/// circular mods) trigger ONE regeneration round with the rustc diagnostics
/// as feedback. A second failure drops the oracle entirely — a broken locked
/// test would poison every verification for the rest of the turn.
fn lock_acceptance_oracle<'a>(
    client: &'a crate::llm::router::LlmRouter,
    state: &'a mut crate::agent::state::AgentState,
    spec: &'a TaskSpec,
    hooks: &'a crate::agent::agent_loop::AgentHooks,
) -> std::pin::Pin<
    Box<dyn std::future::Future<Output = Option<AcceptanceOracle>> + Send + 'a>,
> {
    Box::pin(async move {
        let crate_name = spec.crate_name.clone();
        let lib_rs = spec.lib_rs.clone();
        let import_hints = build_import_hints(state, spec);
        let path = format!(
            "tests/chronokairo_oracle_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0)
        );
        let path = format!("{path}.rs");
        let mut feedback: Option<String> = None;
        for attempt in 0..2 {
            let Some(content) = generate_acceptance_oracle(
                client,
                &state.config.planner_model,
                spec,
                crate_name.as_deref(),
                lib_rs.as_deref(),
                &import_hints,
                feedback.as_deref(),
            )
            .await
            else {
                return None;
            };
            if state.files.write_file(&path, &content).is_err() {
                hooks.warn("  [spec] oracle write failed");
                return None;
            }
            match oracle_authoring_bugs(state, &path) {
                None => {
                    state.mark_changed(&path);
                    hooks.note(&format!("  [spec] acceptance oracle locked: {path}"));
                    return Some(AcceptanceOracle { path, content });
                }
                Some(bugs) if attempt == 0 => {
                    hooks.warn(&format!(
                        "  [spec] oracle has authoring errors; regenerating once..."
                    ));
                    let _ = std::fs::remove_file(
                        std::path::Path::new(&state.config.workspace_dir).join(&path),
                    );
                    feedback = Some(bugs);
                }
                Some(bugs) => {
                    hooks.warn(&format!(
                        "  [spec] oracle still broken after retry; dropping locked tests\n{bugs}"
                    ));
                    let _ = std::fs::remove_file(
                        std::path::Path::new(&state.config.workspace_dir).join(&path),
                    );
                    return None;
                }
            }
        }
        None
    })
}

/// Deterministic import table `Type -> fully qualified path` derived from the
/// repo map, so the oracle never guesses module paths again.
fn build_import_hints(
    state: &crate::agent::state::AgentState,
    spec: &TaskSpec,
) -> Vec<(String, String)> {
    let _ = spec;
    let repo_map = RepoMap::build(&state.config.workspace_dir);
    let crate_name = match &repo_map.crate_name {
        Some(c) => c.clone(),
        None => return Vec::new(),
    };
    let mut out = Vec::new();
    for f in &repo_map.files {
        let rel = f.rel_path.replace('\\', "/");
        let rel = match rel.strip_prefix("src/") {
            Some(r) => r,
            None => continue,
        };
        let stem = rel.trim_end_matches(".rs");
        let chain = if stem == "lib" || stem == "main" {
            String::new()
        } else if let Some(base) = stem.strip_suffix("/mod") {
            base.replace('/', "::")
        } else {
            stem.replace('/', "::")
        };
        let prefix = if chain.is_empty() {
            crate_name.clone()
        } else {
            format!("{crate_name}::{chain}")
        };
        for sym in &f.symbols {
            let is_type = matches!(
                sym.kind,
                crate::repo::context::SymbolKind::Struct | crate::repo::context::SymbolKind::Enum
            ) && !sym.name.contains("::");
            if is_type {
                let full = format!("{prefix}::{}", sym.name);
                if !out.iter().any(|(t, _)| t == &sym.name) {
                    out.push((sym.name.clone(), full));
                }
            }
        }
    }
    out.sort();
    out
}

const ORACLE_EXPECTED_ERROR_CODES: [&str; 4] = ["E0061", "E0425", "E0599", "E0609"];

/// Runs `cargo check --tests` in the workspace and returns a report of
/// oracle-AUTHORING bugs only. Pre-implementation API-missing errors are the
/// desired red state and never reported here. `None` means the oracle is
/// structurally sound.
fn oracle_authoring_bugs(
    state: &crate::agent::state::AgentState,
    _oracle_rel_path: &str,
) -> Option<String> {
    let output = std::process::Command::new("cargo")
        .args(["check", "--tests", "--message-format=short", "--quiet"])
        .current_dir(&state.config.workspace_dir)
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&output.stderr);
    let mut bugs = String::new();
    for line in text.lines() {
        let is_diag = line.contains("error")
            && (line.contains("E0") || line.contains("error:") || line.contains("error["));
        if !is_diag {
            continue;
        }
        let hits_oracle = line.contains("chronokairo_oracle") || {
            // short format: `path:line:col: error...` — check path part only
            line.split_once(": error")
                .map(|(loc, _)| loc.contains("chronokairo_oracle"))
                .unwrap_or(false)
        };
        if !hits_oracle {
            continue;
        }
        let expected = ORACLE_EXPECTED_ERROR_CODES
            .iter()
            .any(|code| line.contains(code));
        if expected {
            continue; // missing-API red state — fine by design
        }
        bugs.push_str(line.trim());
        bugs.push('\n');
    }
    (!bugs.is_empty()).then_some(bugs)
}

/// One-shot synthesis prompt: produce a complete Rust integration-test file
/// that exercises ONLY the required API. Returns `None` on LLM failure or
/// when the reply contains no usable Rust block with tests.
async fn generate_acceptance_oracle(
    client: &crate::llm::router::LlmRouter,
    model: &str,
    spec: &TaskSpec,
    crate_name: Option<&str>,
    lib_rs: Option<&str>,
    import_hints: &[(String, String)],
    authoring_feedback: Option<&str>,
) -> Option<String> {
    let existing: Vec<String> = spec
        .baseline
        .keys()
        .take(60)
        .cloned()
        .collect();
    let layout = match (crate_name, lib_rs) {
        (Some(name), Some(lib)) => format!(
            "Crate name: `{name}`\nCrate root (src/lib.rs), VERBATIM:\n```rust\n{}```",
            lib.trim()
        ),
        _ => "No lib target detected; if sources must be included use \
              #[path = \"../src/<exact file name>.rs\"] with the REAL file names."
              .to_string(),
    };
    let imports_block = if import_hints.is_empty() {
        String::new()
    } else {
        let mut s = String::from("\nAuthoritative type locations — copy these `use` paths EXACTLY:\n");
        for (ty, full) in import_hints {
            s.push_str(&format!("use {full};  // `{ty}`\n"));
        }
        s
    };
    let feedback_block = match authoring_feedback {
        Some(f) => format!(
            "\n\nYOUR PREVIOUS ATTEMPT FAILED TO COMPILE with these errors. Fix EXACTLY \
             these problems (wrong imports / mod paths) and output the corrected full file:\n{f}\n"
        ),
        None => String::new(),
    };
    let prompt = format!(
        "You are an acceptance-test compiler. Write ONE complete Rust integration test file that will be saved as `tests/chronokairo_oracle.rs`.\n\
         Rules:\n\
         1. Test EXACTLY the API specified below — exact function names, parameter types, parameter placement and return types.\n\
         2. Encode every behavioral requirement as a test (preconditions, valid/invalid state transitions, postconditions).\n\
         3. Tests must FAIL TO COMPILE or FAIL ASSERTIONS against any implementation that deviates from the required API.\n\
         4. Do NOT mock or re-declare the modules under test. Reference them exactly as shown below.\n\
         5. Required API members are methods/functions on their owner types. Import the TYPES and call the methods on instances (e.g. `use crate_name::module::Type;` then `obj.method()`). Never import method names as free items.\n\
         6. Construct values only with constructors/fields that ALREADY exist in the repository symbols shown below — never invent constructors.\n\
         7. Output ONLY the complete file content inside a single ```rust code block. No explanations.\n\n\
         Repository layout (authoritative — imports/mod paths MUST follow it):\n{}{}\n\n\
         Existing repository symbols (names only):\n{}\n\n{}\n\nOriginal task:\n{}\n{}",
        layout,
        imports_block,
        existing.join("\n"),
        spec.contract.to_prompt_string(),
        spec.raw_task,
        feedback_block,
    );
    let reply = client
        .generate_with_retry_with_fallback(model, &prompt, None, None)
        .await
        .ok()?;
    let content = extract_rust_block(&reply)?;
    (content.contains("#[test]") || content.contains("#[tokio::test]")).then_some(content)
}

fn extract_rust_block(reply: &str) -> Option<String> {
    let trimmed = reply.trim();
    let start = trimmed.find("```")?;
    let after = &trimmed[start + 3..];
    // Drop an optional language tag on the fence line.
    let after = match after.find('\n') {
        Some(nl) if after[..nl].trim().chars().all(|c| c.is_ascii_alphanumeric()) => {
            &after[nl + 1..]
        }
        _ => after,
    };
    let end = after.find("```")?;
    let body = after[..end].trim();
    (!body.is_empty()).then(|| body.to_string())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_single_line_signatures() {
        let code = r#"
impl Pool {
    pub fn checkout(&mut self) -> Result<Buffer, String> { Ok(todo!()) }
}
"#;
        let sigs = parse_scoped_signatures(code);
        assert_eq!(sigs.len(), 1);
        assert_eq!(sigs[0].owner.as_deref(), Some("Pool"));
        assert_eq!(sigs[0].sig.name, "checkout");
        assert_eq!(sigs[0].sig.self_kind, Some(SelfKind::ByMutRef));
        assert_eq!(
            sigs[0].sig.return_type.as_deref(),
            Some("Result<Buffer, String>")
        );
    }

    #[test]
    fn splits_generic_types_with_commas() {
        let code =
            "fn index(&self, map: HashMap<u64, Vec<f64>>, limit: usize) -> Option<f64> { None }";
        let sigs = parse_scoped_signatures(code);
        assert_eq!(sigs.len(), 1);
        let p = &sigs[0].sig.params;
        assert_eq!(p.len(), 2);
        assert_eq!(p[0].type_name, "HashMap<u64, Vec<f64>>");
        assert_eq!(p[1].type_name, "usize");
        assert_eq!(sigs[0].sig.self_kind, Some(SelfKind::ByRef));
    }

    #[test]
    fn multiline_signature_parsed_with_owner_and_raw() {
        let code = r#"
impl Big {
    pub fn transfer(
        &mut self,
        from_id: u64,
        to_id: u64,
        amount: f64,
    ) -> Result<(), String> {
        Ok(())
    }
}
"#;
        let sigs = parse_scoped_signatures(code);
        assert_eq!(sigs.len(), 1);
        assert_eq!(sigs[0].owner.as_deref(), Some("Big"));
        assert_eq!(sigs[0].sig.params.len(), 3);
        assert_eq!(sigs[0].sig.params[2].type_name, "f64");
        assert!(sigs[0].raw.contains("transfer"));
    }

    #[test]
    fn h3_return_and_param_drift_rejected() {
        let spec = TaskSpec::from_task(
            "Em pool.rs adicione metodo checkout(&mut self) -> Result<Buffer, String> que retorna erro quando vazio.",
        );
        let patch = r#"
impl BufferPool {
    pub fn checkout(&mut self, index: usize) -> &Buffer { todo!() }
}
"#;
        let err = spec.check_patch(patch, "src/pool.rs").unwrap_err();
        assert!(err.contains("CONTRACT VIOLATION"), "{err}");
        assert!(err.contains("return type"), "{err}");
        assert!(err.contains("- parameters: expected ["), "{err}");
    }

    #[test]
    fn h3_exact_match_passes() {
        let spec = TaskSpec::from_task(
            "Em pool.rs adicione metodo checkout(&mut self) -> Result<Buffer, String> que retorna erro quando vazio.",
        );
        let patch = r#"
impl BufferPool {
    pub fn checkout(&mut self) -> Result<Buffer, String> { Ok(todo!()) }
}
"#;
        assert!(spec.check_patch(patch, "src/pool.rs").is_ok());
    }

    #[test]
    fn h1_return_type_simplification_rejected() {
        let spec = TaskSpec::from_task(
            "Em order_manager.rs adicione metodo cancel_order(&mut self, id: u64) -> Result<(), String>. Somente pedidos Pending podem ser cancelados e o pedido deve permanecer presente.",
        );
        let patch = r#"
impl OrderManager {
    pub fn cancel_order(&mut self, id: u64) -> Option<Order> { self.orders.remove(&id) }
}
"#;
        let err = spec.check_patch(patch, "src/order_manager.rs").unwrap_err();
        assert!(err.contains("return type"), "{err}");
    }

    #[test]
    fn h2_parameter_placement_and_baseline_drift_rejected() {
        let task = r#"
Em src/user.rs atualize o construtor: User::new(name: String, age: u32) -> User.
Em src/service.rs UserService mantem new(); adicione register(&mut self, user: User) -> Result<(), String>.
"#;
        let mut spec = TaskSpec::from_task(task);
        spec.baseline.insert(
            "UserService::new".to_string(),
            BaselineEntry {
                sig: FnSignature {
                    name: "new".into(),
                    self_kind: None,
                    params: vec![],
                    return_type: Some("Self".into()),
                },
                raw: "pub fn new() -> Self".into(),
            },
        );
        let patch = r#"
impl UserService {
    pub fn new(age: u8) -> Self { todo!() }
}
"#;
        let err = spec.check_patch(patch, "src/service.rs").unwrap_err();
        assert!(err.contains("API DRIFT"), "{err}");
        // The drift message must show both the wrong type AND where the
        // contract actually places `age`.
        assert!(err.contains("age: u8"), "{err}");
        assert!(err.contains("age: u32"), "{err}");
        assert!(err.contains("User::new(name: String, age: u32)"), "{err}");
    }

    #[test]
    fn untouched_unrelated_same_name_is_exempt_from_rule_one() {
        let mut spec =
            TaskSpec::from_task("adicione metodo new(name: String) -> User em src/user.rs");
        spec.baseline.insert(
            "Legacy::new".to_string(),
            BaselineEntry {
                sig: FnSignature {
                    name: "new".into(),
                    self_kind: None,
                    params: vec![],
                    return_type: Some("Legacy".into()),
                },
                raw: "pub fn new() -> Legacy".into(),
            },
        );
        let patch = r#"
impl Legacy {
    pub fn new() -> Legacy { Legacy {} }
}

impl User {
    pub fn new(name: String) -> User { User { name } }
}
"#;
        assert!(spec.check_patch(patch, "src/user.rs").is_ok());
    }

    #[test]
    fn baseline_change_requires_explicit_redefinition() {
        let mut spec = TaskSpec::from_task("melhore o registro de usuarios");
        spec.baseline.insert(
            "Service::register".to_string(),
            BaselineEntry {
                sig: FnSignature {
                    name: "register".into(),
                    self_kind: Some(SelfKind::ByMutRef),
                    params: vec![ParamSpec {
                        name: "id".into(),
                        type_name: "u64".into(),
                    }],
                    return_type: None,
                },
                raw: "pub fn register(&mut self, id: u64)".into(),
            },
        );
        let patch = "impl Service { pub fn register(&mut self, uid: u64) { } }";
        let err = spec.check_patch(patch, "src/service.rs").unwrap_err();
        assert!(err.contains("API DRIFT"), "{err}");
    }

    #[test]
    fn behavior_notes_rendered_in_prompt() {
        let spec = TaskSpec::from_task(
            "metodo cancel_order(&mut self, id: u64) -> Result<(), String>. Somente Pending pode ser cancelado. O pedido nunca deve ser removido.",
        );
        assert!(
            !spec.contract.behavior_notes.is_empty(),
            "behavioral lines should be captured"
        );
        let prompt = spec.to_prompt_string();
        assert!(prompt.contains("Somente Pending pode ser cancelado"));
    }

    #[test]
    fn oracle_directive_mentions_lock() {
        let mut spec = TaskSpec::from_task("tarefa");
        spec.oracle = Some(AcceptanceOracle {
            path: "tests/chronokairo_oracle_1.rs".into(),
            content: "#[test] fn t() {}".into(),
        });
        assert!(spec.locks_path("tests\\chronokairo_oracle_1.rs"));
        assert!(!spec.locks_path("src/lib.rs"));
        let d = spec.oracle_repair_directive();
        assert!(d.contains("tests/chronokairo_oracle_1.rs"));
        assert!(d.to_lowercase().contains("locked"));
    }

    #[test]
    fn rust_block_extraction() {
        let reply = "Sure!\n```rust\n#[test]\nfn a() {}\n```\ndone";
        assert_eq!(
            extract_rust_block(reply).unwrap(),
            "#[test]\nfn a() {}"
        );
        assert!(extract_rust_block("no block here").is_none());
    }
}
