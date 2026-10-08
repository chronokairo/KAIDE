use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SymbolKind {
    Module,
    Struct,
    Field,
    Enum,
    Trait,
    Function,
    Method,
    ReExport,
    Import,
    Test,
}

#[derive(Debug, Clone)]
pub struct Symbol {
    pub name: String,
    pub kind: SymbolKind,
    pub signature: Option<String>,
    pub line_number: usize,
}

#[derive(Debug, Clone)]
pub struct FileInfo {
    pub path: PathBuf,
    pub rel_path: String,
    pub modules: Vec<String>,
    pub imports: Vec<String>,
    pub exports: Vec<String>,
    pub symbols: Vec<Symbol>,
}

#[derive(Debug, Clone, Default)]
pub struct RepoMap {
    pub crate_name: Option<String>,
    pub files: Vec<FileInfo>,
}

impl RepoMap {
    /// Build a deterministic repository structural map from a workspace directory.
    pub fn build(workspace: &Path) -> Self {
        let crate_name = Self::find_crate_name(workspace);
        let mut files = Vec::new();
        Self::scan_directory(workspace, workspace, &mut files, 0, 5);
        files.sort_by(|a, b| a.rel_path.cmp(&b.rel_path));
        Self { crate_name, files }
    }

    fn find_crate_name(workspace: &Path) -> Option<String> {
        let cargo_toml = workspace.join("Cargo.toml");
        if let Ok(content) = std::fs::read_to_string(&cargo_toml) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("name") && trimmed.contains('=') {
                    let parts: Vec<&str> = trimmed.split('=').collect();
                    if parts.len() >= 2 {
                        let raw = parts[1].trim().trim_matches('"').trim_matches('\'').trim();
                        if !raw.is_empty() {
                            return Some(raw.to_string());
                        }
                    }
                }
            }
        }
        None
    }

    fn scan_directory(
        root: &Path,
        dir: &Path,
        files: &mut Vec<FileInfo>,
        depth: usize,
        max_depth: usize,
    ) {
        if depth > max_depth {
            return;
        }
        let Ok(entries) = std::fs::read_dir(dir) else {
            return;
        };

        const SKIPPED: &[&str] = &[
            ".git",
            "target",
            "node_modules",
            "vendor",
            "dist",
            "build",
            ".idea",
            ".vscode",
            "brain",
            ".system_generated",
        ];

        let mut sorted_entries = Vec::new();
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if SKIPPED.iter().any(|s| name_str == *s) {
                continue;
            }
            sorted_entries.push(entry);
        }
        sorted_entries.sort_by_key(|e| e.file_name());

        for entry in sorted_entries {
            let path = entry.path();
            if path.is_dir() {
                Self::scan_directory(root, &path, files, depth + 1, max_depth);
            } else if path.is_file() {
                if let Ok(rel) = path.strip_prefix(root) {
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    if rel_str.ends_with(".rs") {
                        if let Some(info) = Self::parse_rust_file(&path, &rel_str) {
                            files.push(info);
                        }
                    }
                }
            }
        }
    }

    fn parse_rust_file(path: &Path, rel_path: &str) -> Option<FileInfo> {
        let content = std::fs::read_to_string(path).ok()?;
        let mut modules = Vec::new();
        let mut imports = Vec::new();
        let mut exports = Vec::new();
        let mut symbols = Vec::new();

        let mut current_impl: Option<String> = None;
        let mut impl_brace_depth = 0;
        let mut next_is_test = false;

        for (line_idx, line) in content.lines().enumerate() {
            let line_num = line_idx + 1;
            let trimmed = line.trim();

            if trimmed.is_empty() || trimmed.starts_with("//") {
                continue;
            }

            if trimmed.contains("#[test]") || trimmed.contains("#[tokio::test]") {
                next_is_test = true;
                continue;
            }

            if (trimmed.starts_with("pub mod ") || trimmed.starts_with("mod ")) && trimmed.ends_with(';') {
                let name = trimmed.trim_end_matches(';').trim();
                modules.push(name.to_string());
                symbols.push(Symbol {
                    name: name.to_string(),
                    kind: SymbolKind::Module,
                    signature: None,
                    line_number: line_num,
                });
                continue;
            }

            if trimmed.starts_with("pub use ") && trimmed.ends_with(';') {
                let exp = trimmed.trim_end_matches(';').trim();
                exports.push(exp.to_string());
                symbols.push(Symbol {
                    name: exp.to_string(),
                    kind: SymbolKind::ReExport,
                    signature: None,
                    line_number: line_num,
                });
                continue;
            }

            if trimmed.starts_with("use ") && trimmed.ends_with(';') {
                let imp = trimmed.trim_end_matches(';').trim();
                imports.push(imp.to_string());
                symbols.push(Symbol {
                    name: imp.to_string(),
                    kind: SymbolKind::Import,
                    signature: None,
                    line_number: line_num,
                });
                continue;
            }

            let is_new_impl = trimmed.starts_with("impl ") && (trimmed.ends_with('{') || trimmed.contains(" {"));
            if is_new_impl {
                let target = trimmed
                    .trim_start_matches("impl ")
                    .split('{')
                    .next()
                    .unwrap_or("")
                    .trim();
                current_impl = Some(target.to_string());
                impl_brace_depth = 0;
            }

            if trimmed.starts_with("pub struct ")
                || trimmed.starts_with("struct ")
                || trimmed.starts_with("pub enum ")
                || trimmed.starts_with("enum ")
                || trimmed.starts_with("pub trait ")
                || trimmed.starts_with("trait ")
            {
                let kind = if trimmed.contains("struct ") {
                    SymbolKind::Struct
                } else if trimmed.contains("enum ") {
                    SymbolKind::Enum
                } else {
                    SymbolKind::Trait
                };

                let name = trimmed
                    .split('{')
                    .next()
                    .unwrap_or(trimmed)
                    .trim_end_matches(';')
                    .trim()
                    .to_string();

                // If single-line struct with fields, capture signature
                let signature = if trimmed.contains('{') && trimmed.contains('}') {
                    Some(trimmed.to_string())
                } else {
                    None
                };

                symbols.push(Symbol {
                    name,
                    kind,
                    signature,
                    line_number: line_num,
                });
            }

            // Capture struct field if inside a multi-line struct
            if trimmed.contains(':') && !trimmed.starts_with("//") && !trimmed.starts_with("use ") && !trimmed.starts_with("impl ") && !trimmed.contains("fn ") && current_impl.is_none() {
                let clean_field = trimmed.trim_end_matches(',').trim();
                if (clean_field.starts_with("pub ") || clean_field.chars().next().map(|c| c.is_alphabetic()).unwrap_or(false)) && !clean_field.contains('{') && !clean_field.contains('}') {
                    symbols.push(Symbol {
                        name: clean_field.to_string(),
                        kind: SymbolKind::Field,
                        signature: Some(clean_field.to_string()),
                        line_number: line_num,
                    });
                }
            }

            if trimmed.contains("fn ") && (trimmed.ends_with('{') || trimmed.ends_with(';') || trimmed.contains(" {")) {
                let sig_part = trimmed.split('{').next().unwrap_or(trimmed).trim_end_matches(';').trim();
                let is_pub = sig_part.starts_with("pub ");

                if next_is_test {
                    symbols.push(Symbol {
                        name: sig_part.to_string(),
                        kind: SymbolKind::Test,
                        signature: Some(sig_part.to_string()),
                        line_number: line_num,
                    });
                    next_is_test = false;
                } else if let Some(impl_target) = &current_impl {
                    symbols.push(Symbol {
                        name: format!("{}::{}", impl_target, sig_part),
                        kind: SymbolKind::Method,
                        signature: Some(sig_part.to_string()),
                        line_number: line_num,
                    });
                } else if is_pub || sig_part.starts_with("fn ") {
                    symbols.push(Symbol {
                        name: sig_part.to_string(),
                        kind: SymbolKind::Function,
                        signature: Some(sig_part.to_string()),
                        line_number: line_num,
                    });
                }
            }

            if current_impl.is_some() {
                let opens = trimmed.chars().filter(|&c| c == '{').count();
                let closes = trimmed.chars().filter(|&c| c == '}').count();
                impl_brace_depth += opens as i32;
                impl_brace_depth -= closes as i32;
                if impl_brace_depth <= 0 && closes > 0 {
                    current_impl = None;
                    impl_brace_depth = 0;
                }
            }
        }

        Some(FileInfo {
            path: path.to_path_buf(),
            rel_path: rel_path.to_string(),
            modules,
            imports,
            exports,
            symbols,
        })
    }

    pub fn to_prompt_string(&self) -> String {
        if self.files.is_empty() {
            return String::new();
        }

        let mut out = String::new();
        out.push_str("### Repository Structural Architecture & Symbol Grounding Map\n");
        if let Some(name) = &self.crate_name {
            out.push_str(&format!("Crate Name: `{name}`\n\n"));
        }

        out.push_str("Existing workspace files, modules, structs & exact method signatures:\n");
        for file in &self.files {
            out.push_str(&format!("• File `{}`:\n", file.rel_path));
            if !file.modules.is_empty() {
                out.push_str(&format!("    declared modules: {}\n", file.modules.join(", ")));
            }
            if !file.exports.is_empty() {
                out.push_str(&format!("    re-exports: {}\n", file.exports.join(", ")));
            }
            if !file.imports.is_empty() {
                out.push_str(&format!("    imports: {}\n", file.imports.join(", ")));
            }

            let decls: Vec<_> = file
                .symbols
                .iter()
                .filter(|s| !matches!(s.kind, SymbolKind::Import | SymbolKind::ReExport | SymbolKind::Module))
                .collect();

            if !decls.is_empty() {
                out.push_str("    symbols, fields & methods:\n");
                for sym in decls {
                    match sym.kind {
                        SymbolKind::Struct | SymbolKind::Enum | SymbolKind::Trait => {
                            out.push_str(&format!("      - {} (line {})\n", sym.name, sym.line_number));
                        }
                        SymbolKind::Field => {
                            out.push_str(&format!("        * field: {}\n", sym.name));
                        }
                        SymbolKind::Method | SymbolKind::Function => {
                            out.push_str(&format!("      - {} (line {})\n", sym.name, sym.line_number));
                        }
                        SymbolKind::Test => {
                            out.push_str(&format!("      - [test] {} (line {})\n", sym.name, sym.line_number));
                        }
                        _ => {}
                    }
                }
            }
            out.push('\n');
        }

        out.push_str("Strict Grounding Constraints & Invariants:\n");
        out.push_str("1. ONLY import from existing modules and crates listed in the map above.\n");
        out.push_str("2. DO NOT invent non-existent root modules (e.g. do NOT invent `crate::accounts` or `crate::errors`).\n");
        out.push_str("3. DO NOT invent non-existent struct methods (e.g. `AccountStore` only has `new`, `insert`, `get`, `get_mut`; it has NO `update` method).\n");
        out.push_str("4. Adhere strictly to existing field types (e.g. `Account.balance` is `f64`, not `i64`).\n");
        out.push_str("5. Use `edit_file` to modify existing files. NEVER use `create_file` on existing files.\n");

        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_multi_module_rust_repo() {
        let temp = std::env::temp_dir().join(format!("test_repomap_struct_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp);
        std::fs::create_dir_all(temp.join("src")).unwrap();

        std::fs::write(
            temp.join("Cargo.toml"),
            "[package]\nname = \"bank_demo\"\nversion = \"0.1.0\"\n",
        )
        .unwrap();

        std::fs::write(
            temp.join("src/lib.rs"),
            "pub mod storage;\npub mod service;\npub use storage::AccountStore;\n",
        )
        .unwrap();

        std::fs::write(
            temp.join("src/storage.rs"),
            "use std::collections::HashMap;\n\npub struct AccountStore {\n    pub accounts: HashMap<u64, f64>,\n}\n\nimpl AccountStore {\n    pub fn new() -> Self {\n        Self { accounts: HashMap::new() }\n    }\n    pub fn get(&self, id: u64) -> Option<f64> {\n        self.accounts.get(&id).copied()\n    }\n}\n",
        )
        .unwrap();

        let repo_map = RepoMap::build(&temp);
        assert_eq!(repo_map.crate_name.as_deref(), Some("bank_demo"));
        assert_eq!(repo_map.files.len(), 2);

        let map_str = repo_map.to_prompt_string();
        assert!(map_str.contains("Crate Name: `bank_demo`"));
        assert!(map_str.contains("src/lib.rs"));
        assert!(map_str.contains("pub mod storage"));
        assert!(map_str.contains("pub use storage::AccountStore"));
        assert!(map_str.contains("src/storage.rs"));
        assert!(map_str.contains("pub struct AccountStore"));
        assert!(map_str.contains("field: pub accounts: HashMap<u64, f64>"));
        assert!(map_str.contains("AccountStore::pub fn new() -> Self"));
        assert!(map_str.contains("AccountStore::pub fn get(&self, id: u64) -> Option<f64>"));
        assert!(map_str.contains("Strict Grounding Constraints & Invariants"));

        let _ = std::fs::remove_dir_all(&temp);
    }
}
