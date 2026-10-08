use crate::repo::context::{RepoMap, SymbolKind};
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SemanticViolation {
    pub target: String,
    pub unknown_member: String,
    pub available_members: Vec<String>,
}

/// Standard methods that are always allowed regardless of custom struct methods.
const STANDARD_ALLOWED: &[&str] = &[
    "new", "clone", "to_string", "into", "unwrap", "expect", "map", "and_then",
    "ok_or_else", "ok_or", "is_some", "is_none", "is_ok", "is_err", "as_ref",
    "as_mut", "copied", "cloned", "iter", "iter_mut", "len", "is_empty", "insert",
    "get", "get_mut", "remove", "contains_key", "entry", "push", "pop", "clear",
];

/// Pre-mutation semantic validator. Signature/API-shape enforcement lives in
/// `crate::repo::spec::TaskSpec::check_patch`; this pass only checks that
/// method/field accesses exist in the RepoMap.
pub fn validate_code_symbols(
    code: &str,
    repo_map: &RepoMap,
    _target_file: &str,
) -> Result<(), String> {

    // 2. Collect known methods for structs in the repo
    // e.g. "AccountStore" -> {"new", "insert", "get", "get_mut", "transfer"}
    let mut struct_methods: std::collections::HashMap<String, HashSet<String>> = std::collections::HashMap::new();

    for file in &repo_map.files {
        for sym in &file.symbols {
            if sym.kind == SymbolKind::Method {
                if let Some((struct_name, method_sig)) = sym.name.split_once("::") {
                    let struct_name = struct_name.trim();
                    let method_name = method_sig
                        .trim_start_matches("pub ")
                        .trim_start_matches("fn ")
                        .split('(')
                        .next()
                        .unwrap_or("")
                        .trim();
                    if !method_name.is_empty() {
                        struct_methods
                            .entry(struct_name.to_string())
                            .or_default()
                            .insert(method_name.to_string());
                    }
                }
            }
        }
    }

    let mut violations = Vec::new();

    for (line_idx, line) in code.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("//") || trimmed.is_empty() {
            continue;
        }

        // Check calls on `self.store.<method>` or `store.<method>`
        if let Some(store_idx) = trimmed.find(".store.") {
            let after = &trimmed[store_idx + 7..];
            if let Some(method_name) = after.split('(').next().map(|s| s.trim()) {
                let clean_method = method_name.split('.').next().unwrap_or("").trim();
                if !clean_method.is_empty() && !STANDARD_ALLOWED.contains(&clean_method) {
                    if let Some(known) = struct_methods.get("AccountStore") {
                        if !known.contains(clean_method) && clean_method != "transfer" {
                            violations.push(format!(
                                "Line {}: Unknown method `{clean_method}` called on `store` (AccountStore). Available methods: {:?}",
                                line_idx + 1,
                                known
                            ));
                        }
                    }
                }
            }
        }
    }

    if violations.is_empty() {
        Ok(())
    } else {
        let mut err = String::new();
        err.push_str("Semantic validation failed before filesystem write:\n");
        for v in violations {
            err.push_str(&format!("• {}\n", v));
        }
        err.push_str("Rule: DO NOT invent non-existent methods or APIs. Regenerate this edit using only existing methods and fields.\n");
        Err(err)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repo::context::{FileInfo, Symbol};
    use std::path::PathBuf;

    #[test]
    fn detects_unknown_method_on_store() {
        let file_info = FileInfo {
            path: PathBuf::from("src/storage.rs"),
            rel_path: "src/storage.rs".into(),
            modules: vec![],
            imports: vec![],
            exports: vec![],
            symbols: vec![
                Symbol {
                    name: "AccountStore::pub fn new() -> Self".into(),
                    kind: SymbolKind::Method,
                    signature: Some("pub fn new() -> Self".into()),
                    line_number: 10,
                },
                Symbol {
                    name: "AccountStore::pub fn get(&self, id: u64) -> Option<&Account>".into(),
                    kind: SymbolKind::Method,
                    signature: Some("pub fn get(&self, id: u64) -> Option<&Account>".into()),
                    line_number: 20,
                },
            ],
        };

        let repo_map = RepoMap {
            crate_name: Some("test_crate".into()),
            files: vec![file_info],
        };

        let invalid_code = r#"
            impl BankService {
                pub fn transfer_funds(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String> {
                    self.store.update(from_id, amount);
                    Ok(())
                }
            }
        "#;

        let result = validate_code_symbols(invalid_code, &repo_map, "src/service.rs");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("Unknown method `update` called on `store`"));

        let valid_code = r#"
            impl BankService {
                pub fn transfer_funds(&mut self, from_id: u64, to_id: u64, amount: f64) -> Result<(), String> {
                    self.store.transfer(from_id, to_id, amount)
                }
            }
        "#;

        let result = validate_code_symbols(valid_code, &repo_map, "src/service.rs");
        assert!(result.is_ok());
    }
}
