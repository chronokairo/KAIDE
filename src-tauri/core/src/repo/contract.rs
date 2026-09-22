use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParamSpec {
    pub name: String,
    pub type_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequiredMethod {
    pub file: Option<String>,
    /// Owning type when the requirement names one explicitly (`User::new`).
    pub owner: Option<String>,
    pub fn_name: String,
    pub raw_signature: String,
    /// Receiver when the requirement is a method (`&self`, `&mut self`, ...).
    pub self_kind: Option<String>,
    pub params: Vec<ParamSpec>,
    pub return_type: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct TaskContract {
    pub methods: Vec<RequiredMethod>,
    pub type_constraints: Vec<String>,
    /// Verbatim behavioral requirements extracted from the task (preconditions,
    /// valid/invalid state transitions, postconditions). Rendered into every
    /// prompt and used to synthesize the locked acceptance oracle.
    pub behavior_notes: Vec<String>,
}

impl TaskContract {
    /// Extracts explicit method signatures and type constraints from task descriptions.
    ///
    /// A single unified scanner walks the ENTIRE text looking for
    /// signature-shaped paren groups. This intentionally supports multiple
    /// signatures per line/sentence (`... User::new(a: A, b: B) ... e
    /// register(&mut self, ...) ...`) and is robust to prose around them:
    /// parameter parsing requires `name: Type` shape and the return type is a
    /// balanced token (so `-> u64 deve repassar o valor` yields just `u64`).
    pub fn extract(task: &str) -> Self {
        let mut methods = Vec::new();
        let mut type_constraints = Vec::new();
        let mut behavior_notes = Vec::new();

        // Behavioral requirements (unchanged segmentation pass).
        for line in task.lines() {
            let trimmed = line.trim();
            for seg in trimmed.split([';', '.', '!', '?']) {
                let seg = seg.trim();
                if is_behavior_note(seg) && behavior_notes.len() < 16 {
                    behavior_notes.push(seg.to_string());
                }
            }
        }

        // Unified signature scanner over the whole text.
        let chars: Vec<char> = task.chars().collect();
        let mut seen: std::collections::HashSet<(Option<String>, String)> =
            std::collections::HashSet::new();
        let mut i = 0;
        while i < chars.len() {
            if chars[i] == '(' {
                if let Some((end, sig)) = try_parse_signature_at(&chars, i) {
                    if seen.insert((sig.owner.clone(), sig.fn_name.clone())) {
                        methods.push(sig);
                    }
                    i = end;
                    continue;
                }
            }
            i += 1;
        }

        // Add explicit type constraints based on extracted parameters
        let mut seen_params = HashMap::new();
        for m in &methods {
            for p in &m.params {
                seen_params.entry(p.name.clone()).or_insert_with(Vec::new).push(p.type_name.clone());
            }
        }

        for (pname, types) in seen_params {
            // Only emit an invariant when the requirement is consistent.
            let all_same = types.iter().all(|t| t == &types[0]);
            if !all_same {
                continue; // conflicting requirement; do not invent an invariant
            }
            if let Some(first_type) = types.first() {
                type_constraints.push(format!("`{pname}` must be type `{first_type}` (never change to another numeric/primitive type)."));
            }
        }

        Self {
            methods,
            type_constraints,
            behavior_notes,
        }
    }

    /// Formats the task contract for prompt injection.
    pub fn to_prompt_string(&self) -> String {
        if self.methods.is_empty() && self.type_constraints.is_empty() && self.behavior_notes.is_empty() {
            return String::new();
        }

        let mut out = String::new();
        out.push_str("### Exact Task & Type Contract (Enforced by Harness)\n");
        if !self.methods.is_empty() {
            out.push_str("Required Signatures:\n");
            for m in &self.methods {
                let loc = m.file.as_deref().unwrap_or("target file");
                out.push_str(&format!("• In `{loc}`: `fn {}`\n", m.raw_signature));
            }
        }

        if !self.behavior_notes.is_empty() {
            out.push_str("\nBehavioral Requirements (locked):\n");
            for b in &self.behavior_notes {
                out.push_str(&format!("• {b}\n"));
            }
        }

        if !self.type_constraints.is_empty() {
            out.push_str("\nStrict Type Invariants:\n");
            for c in &self.type_constraints {
                out.push_str(&format!("• {c}\n"));
            }
        }

        out.push_str("• Operational Rule: Do NOT drift from these parameter names, placements, types, or return signatures.\n\n");
        out
    }
}

/// A sentence segment qualifies as a behavioral note when it carries a
/// requirement cue and is not a signature fragment.
fn is_behavior_note(seg: &str) -> bool {
    if seg.len() < 10 || seg.len() > 240 || !seg.contains(' ') || seg.contains('(') {
        return false;
    }
    const CUES: &[&str] = &[
        "somente", "apenas", "only", "must", "deve", "devem", "precisa",
        "não pode", "nao pode", "não deve", "nao deve", "cannot", "nunca",
        "never", "inválid", "invalid", "quando", "when ", "postcond", "precond",
    ];
    let lower = seg.to_lowercase();
    CUES.iter().any(|c| lower.contains(c))
}

/// Detects a workspace-relative `.rs` target mentioned in a task line.
fn detect_target_file(line: &str) -> Option<String> {
    let mut fallback: Option<String> = None;
    for tok in line.split_whitespace() {
        let clean = tok.trim_matches(|c: char| !c.is_alphanumeric() && c != '.' && c != '/' && c != '_' && c != '-' && c != '\\');
        if clean.ends_with(".rs") {
            let candidate = clean.replace('\\', "/");
            if candidate.starts_with("src/") {
                return Some(candidate);
            }
            if fallback.is_none() {
                fallback = Some(candidate);
            }
        }
    }
    fallback
}

/// Attempts to parse a signature whose `(` sits at `open_idx`.
///
/// Returns `(index_after_return_type, parsed_method)` on success. The shape
/// contract is strict enough to reject prose parenthesised asides: parameters
/// must be `name: Type` (or a receiver), and the return type must be a single
/// balanced type token directly after `->`.
fn try_parse_signature_at(
    chars: &[char],
    open_idx: usize,
) -> Option<(usize, RequiredMethod)> {
    // ---- 1. Qualified name immediately before the '(' ----------------------
    let mut j = open_idx;
    while j > 0 && chars[j - 1].is_whitespace() {
        j -= 1;
    }
    if j == 0 || !(chars[j - 1].is_alphanumeric() || chars[j - 1] == '_') {
        return None;
    }
    let name_end = j;
    while j > 0 {
        let c = chars[j - 1];
        if c.is_alphanumeric() || c == '_' {
            j -= 1;
        } else if c == ':' && j >= 2 && chars[j - 2] == ':' {
            j -= 2;
        } else {
            break;
        }
    }
    let full_name: String = chars[j..name_end].iter().collect();
    let (owner, fn_name) = match full_name.rsplit_once("::") {
        Some((o, n)) => (Some(o.to_string()), n.to_string()),
        None => (None, full_name.clone()),
    };
    const KEYWORDS: [&str; 9] = [
        "if", "for", "while", "match", "loop", "in", "fn", "metodo", "r",
    ];
    if fn_name.is_empty()
        || KEYWORDS.contains(&fn_name.as_str())
        || fn_name.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(true)
    {
        return None;
    }

    // ---- 2. Balanced parameter list ---------------------------------------
    let mut depth = 0i32;
    let mut k = open_idx;
    while k < chars.len() {
        match chars[k] {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth == 0 {
                    break;
                }
            }
            _ => {}
        }
        k += 1;
    }
    if k >= chars.len() || depth != 0 {
        return None; // unbalanced — prose or code fragment
    }
    let inside: String = chars[open_idx + 1..k].iter().collect();
    let after_close = k + 1;

    // ---- 3. Receiver + typed parameters ------------------------------------
    let mut self_kind: Option<String> = None;
    let mut params = Vec::new();
    let mut shaped = true;
    for part in split_top_level_commas(&inside) {
        let p = part.trim();
        if p.is_empty() {
            continue;
        }
        if let Some(sk) = crate::repo::spec::SelfKind::parse(p) {
            self_kind = Some(sk.as_str().to_string());
            continue;
        }
        match p.split_once(':') {
            Some((n, t)) => {
                let n = n.trim();
                let t = t.trim();
                if is_ident(n) && !t.is_empty() {
                    params.push(ParamSpec {
                        name: n.trim_start_matches("mut ").trim().to_string(),
                        type_name: t.to_string(),
                    });
                } else {
                    shaped = false;
                    break;
                }
            }
            None => {
                shaped = false;
                break;
            }
        }
    }
    if !shaped || (self_kind.is_none() && params.is_empty()) {
        return None; // prose like "(LIFO)" or "()"
    }

    // ---- 4. Return type: ONE balanced token after '->' ---------------------
    let mut m = after_close;
    while m < chars.len() && chars[m].is_whitespace() {
        m += 1;
    }
    let mut return_type = None;
    let mut end = after_close;
    if m + 1 < chars.len() && chars[m] == '-' && chars[m + 1] == '>' {
        let mut n = m + 2;
        while n < chars.len() && chars[n].is_whitespace() {
            n += 1;
        }
        let (tok, tok_end) = read_type_token(chars, n);
        if !tok.is_empty() {
            return_type = Some(tok);
            end = tok_end;
        }
    }

    // ---- 5. Render raw signature + target-file context ---------------------
    let mut arg_list: Vec<String> = Vec::new();
    if let Some(sk) = &self_kind {
        arg_list.push(sk.clone());
    }
    for p in &params {
        arg_list.push(format!("{}: {}", p.name, p.type_name));
    }
    let mut raw_signature = format!("{fn_name}({})", arg_list.join(", "));
    if let Some(r) = &return_type {
        raw_signature.push_str(&format!(" -> {r}"));
    }
    // Target file: nearest `.rs` token in the ~80 chars before the signature.
    let ctx_start = j.saturating_sub(80);
    let ctx: String = chars[ctx_start..j].iter().collect();

    Some((
        end,
        RequiredMethod {
            file: detect_target_file(&ctx),
            owner,
            fn_name,
            raw_signature,
            self_kind,
            params,
            return_type,
        },
    ))
}

/// Reads one balanced Rust type token starting at `start` (`u64`,
/// `Result<Buffer, String>`, `&'a [u8; 4]`, `Vec<HashMap<K, V>>`, ...).
/// Returns the token and the index of the first char NOT part of it.
fn read_type_token(chars: &[char], start: usize) -> (String, usize) {
    let mut out = String::new();
    let mut angle = 0i32;
    let mut s = start;
    while s < chars.len() {
        let c = chars[s];
        match c {
            '<' => {
                angle += 1;
                out.push(c);
            }
            '>' => {
                if angle == 0 {
                    break;
                }
                angle -= 1;
                out.push(c);
            }
            ',' | ';' | '.' | ')' | ']' if angle == 0 => break,
            c if c.is_whitespace() && angle == 0 => break,
            other => out.push(other),
        }
        s += 1;
    }
    (out.trim().to_string(), s)
}

/// Splits on commas that are not nested inside `<...>` or `(...)`.
fn split_top_level_commas(s: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut cur = String::new();
    let mut angle = 0i32;
    let mut paren = 0i32;
    for c in s.chars() {
        match c {
            '<' => {
                angle += 1;
                cur.push(c);
            }
            '>' => {
                if angle > 0 {
                    angle -= 1;
                }
                cur.push(c);
            }
            '(' => {
                paren += 1;
                cur.push(c);
            }
            ')' => {
                if paren > 0 {
                    paren -= 1;
                }
                cur.push(c);
            }
            ',' if angle == 0 && paren == 0 => {
                parts.push(std::mem::take(&mut cur));
            }
            _ => cur.push(c),
        }
    }
    if !cur.trim().is_empty() {
        parts.push(cur);
    }
    parts
}

fn is_ident(s: &str) -> bool {
    !s.is_empty()
        && s.chars().next().map(|c| c.is_alphabetic() || c == '_').unwrap_or(false)
        && s.chars().all(|c| c.is_alphanumeric() || c == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_task_contract_correctly() {
        let task = r#"
1) Em src/storage.rs adicione metodo transfer(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String> que valida existencia.
2) Em src/service.rs adicione transfer_funds(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String> validando amount > 0.0.
"#;
        let contract = TaskContract::extract(task);
        assert_eq!(contract.methods.len(), 2);
        assert_eq!(contract.methods[0].fn_name, "transfer");
        assert_eq!(contract.methods[0].file.as_deref(), Some("src/storage.rs"));
        assert_eq!(contract.methods[0].self_kind.as_deref(), Some("&mut self"));
        assert_eq!(contract.methods[0].params.len(), 3);
        assert_eq!(contract.methods[0].params[2].name, "amount");
        assert_eq!(contract.methods[0].params[2].type_name, "f64");

        let prompt_str = contract.to_prompt_string();
        assert!(prompt_str.contains("fn transfer(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String>"));
        assert!(prompt_str.contains("`amount` must be type `f64`"));
    }

    #[test]
    fn extracts_associated_functions() {
        let task = "Em src/user.rs atualize o construtor: User::new(name: String, age: u32) -> User.";
        let contract = TaskContract::extract(task);
        assert_eq!(contract.methods.len(), 1);
        let m = &contract.methods[0];
        assert_eq!(m.fn_name, "new");
        assert_eq!(m.self_kind, None);
        assert_eq!(m.params.len(), 2);
        assert_eq!(m.params[1].type_name, "u32");
        assert_eq!(m.return_type.as_deref(), Some("User"));
    }

    #[test]
    fn probe_h2_task_text_extraction() {
        let task = "Em user.rs adicione o campo age: u32 ao struct User e atualize o construtor para User::new(name: String, age: u32), nesta ordem. Em service.rs propague: register(&mut self, name: String, age: u32) -> u64 deve repassar o valor ao User criado via User::new.";
        let contract = TaskContract::extract(task);
        for m in &contract.methods {
            eprintln!(
                "METHOD owner={:?} name={} raw={} params={:?} ret={:?} file={:?}",
                m.owner, m.fn_name, m.raw_signature,
                m.params.iter().map(|p| (p.name.clone(), p.type_name.clone())).collect::<Vec<_>>(),
                m.return_type, m.file
            );
        }
        assert_eq!(contract.methods.len(), 2);
        let new_m = contract.methods.iter().find(|m| m.fn_name == "new").expect("User::new must be extracted");
        assert_eq!(new_m.params.len(), 2);
        assert_eq!(new_m.return_type.as_deref(), None);
        let reg = contract.methods.iter().find(|m| m.fn_name == "register").expect("register must be extracted");
        assert_eq!(reg.params.len(), 2);
        assert_eq!(reg.return_type.as_deref(), Some("u64"), "return tail must stop at first token after '->'");
    }

    #[test]
    fn captures_behavior_notes_from_sentences() {
        let task = "metodo cancel_order(&mut self, id: u64) -> Result<(), String>; Somente pedidos Pending podem ser cancelados. O pedido nunca deve ser removido do mapa.";
        let contract = TaskContract::extract(task);
        assert!(
            contract.behavior_notes.iter().any(|b| b.starts_with("Somente")),
            "{:?}",
            contract.behavior_notes
        );
        assert!(
            contract.behavior_notes.iter().any(|b| b.contains("nunca")),
            "{:?}",
            contract.behavior_notes
        );
        // Signature fragments never leak into behavior notes.
        assert!(!contract.behavior_notes.iter().any(|b| b.contains('(')));
    }

    #[test]
    fn detects_signature_drift_via_spec_gate() {
        let task = "Em src/storage.rs adicione metodo transfer(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String>";
        let spec = crate::repo::spec::TaskSpec::from_task(task);

        let invalid_code = r#"
impl AccountStore {
    pub fn transfer(&mut self, from_id: u64, to_id: u64, amount: u64) -> Result<(), String> {
        Ok(())
    }
}
"#;
        let err = spec.check_patch(invalid_code, "src/storage.rs").unwrap_err();
        assert!(
            err.contains("parameter 3 (`amount`): expected type `f64`, found `u64`"),
            "{err}"
        );

        let valid_code = r#"
impl AccountStore {
    pub fn transfer(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String> {
        Ok(())
    }
}
"#;
        assert!(spec.check_patch(valid_code, "src/storage.rs").is_ok());
    }
}
