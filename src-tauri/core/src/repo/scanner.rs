use std::path::Path;

#[derive(Debug, Clone)]
pub struct SymbolEntry {
    pub file_path: String,
    pub symbol_type: &'static str,
    pub name: String,
    pub line_number: usize,
}

/// Queryable symbol index built from the workspace.
pub struct SymbolIndex {
    entries: Vec<SymbolEntry>,
}

impl SymbolIndex {
    pub fn build(workspace: &Path) -> Self {
        let mut symbols = Vec::new();
        RepoMapGenerator::scan_directory(workspace, workspace, &mut symbols, 0, 4);
        Self { entries: symbols }
    }

    pub fn search(&self, query: &str, limit: usize) -> Vec<&SymbolEntry> {
        let q = query.to_lowercase();
        let mut results: Vec<&SymbolEntry> = self
            .entries
            .iter()
            .filter(|s| s.name.to_lowercase().contains(&q))
            .collect();
        results.sort_by(|a, b| {
            let a_exact = a.name.to_lowercase() == q;
            let b_exact = b.name.to_lowercase() == q;
            b_exact.cmp(&a_exact)
        });
        results.truncate(limit);
        results
    }

    pub fn search_type(&self, symbol_type: &str, limit: usize) -> Vec<&SymbolEntry> {
        let mut results: Vec<&SymbolEntry> = self
            .entries
            .iter()
            .filter(|s| s.symbol_type == symbol_type)
            .collect();
        results.truncate(limit);
        results
    }

    pub fn all(&self) -> &[SymbolEntry] {
        &self.entries
    }
}

pub struct RepoMapGenerator;

impl RepoMapGenerator {
    /// Generate a compact repo map summary string (max max_bytes to preserve context).
    pub fn generate_map(workspace: &Path, max_bytes: usize) -> String {
        let mut symbols = Vec::new();
        Self::scan_directory(workspace, workspace, &mut symbols, 0, 4);

        if symbols.is_empty() {
            return "No symbols found in workspace.".to_string();
        }

        let mut lines = Vec::new();
        lines.push("### Repository Symbol Map".to_string());

        let mut current_file = String::new();
        for sym in symbols {
            if sym.file_path != current_file {
                current_file = sym.file_path.clone();
                lines.push(format!("\nFile `{}`:", current_file));
            }
            lines.push(format!(
                "  L{:<4} {} {}",
                sym.line_number, sym.symbol_type, sym.name
            ));
        }

        let full = lines.join("\n");
        if full.len() > max_bytes {
            let truncated: String = full.chars().take(max_bytes).collect();
            format!(
                "{}\n...[repo map truncated at {} bytes]",
                truncated, max_bytes
            )
        } else {
            full
        }
    }

    fn scan_directory(
        root: &Path,
        dir: &Path,
        symbols: &mut Vec<SymbolEntry>,
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
                Self::scan_directory(root, &path, symbols, depth + 1, max_depth);
            } else if path.is_file() {
                if let Ok(rel) = path.strip_prefix(root) {
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    Self::extract_symbols_from_file(&path, &rel_str, symbols);
                }
            }
        }
    }

    fn extract_symbols_from_file(_path: &Path, rel_path: &str, symbols: &mut Vec<SymbolEntry>) {
        let Ok(content) = std::fs::read_to_string(_path) else {
            return;
        };

        for (line_idx, line) in content.lines().enumerate() {
            let line_num = line_idx + 1;
            let trimmed = line.trim_start();
            if rel_path.ends_with(".rs") {
                // Parse fn definitions
                let mut rest = trimmed;
                if rest.starts_with("pub ") {
                    rest = rest["pub ".len()..].trim_start();
                } else if rest.starts_with("pub(crate) ") {
                    rest = rest["pub(crate) ".len()..].trim_start();
                }
                if rest.starts_with("async ") {
                    rest = rest["async ".len()..].trim_start();
                }
                if rest.starts_with("fn ") {
                    let fn_name_part = rest["fn ".len()..].trim_start();
                    let fn_name: String = fn_name_part
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    if !fn_name.is_empty() {
                        symbols.push(SymbolEntry {
                            file_path: rel_path.to_string(),
                            symbol_type: "fn",
                            name: fn_name,
                            line_number: line_num,
                        });
                        continue;
                    }
                }
                // Parse struct, enum, trait, type, union
                for kw in &["struct", "enum", "trait", "type", "union"] {
                    let prefix = format!("{} ", kw);
                    if rest.starts_with(&prefix) {
                        let type_name_part = rest[prefix.len()..].trim_start();
                        let type_name: String = type_name_part
                            .chars()
                            .take_while(|c| c.is_alphanumeric() || *c == '_')
                            .collect();
                        if !type_name.is_empty() {
                            symbols.push(SymbolEntry {
                                file_path: rel_path.to_string(),
                                symbol_type: "type",
                                name: format!("{} {}", kw, type_name),
                                line_number: line_num,
                            });
                            break;
                        }
                    }
                }
            } else if rel_path.ends_with(".py") {
                let mut rest = trimmed;
                if rest.starts_with("async ") {
                    rest = rest["async ".len()..].trim_start();
                }
                if rest.starts_with("def ") {
                    let def_part = rest["def ".len()..].trim_start();
                    let def_name: String = def_part
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    if !def_name.is_empty() {
                        symbols.push(SymbolEntry {
                            file_path: rel_path.to_string(),
                            symbol_type: "def",
                            name: def_name,
                            line_number: line_num,
                        });
                    }
                } else if rest.starts_with("class ") {
                    let cls_part = rest["class ".len()..].trim_start();
                    let cls_name: String = cls_part
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    if !cls_name.is_empty() {
                        symbols.push(SymbolEntry {
                            file_path: rel_path.to_string(),
                            symbol_type: "class",
                            name: cls_name,
                            line_number: line_num,
                        });
                    }
                }
            } else if rel_path.ends_with(".js")
                || rel_path.ends_with(".ts")
                || rel_path.ends_with(".tsx")
                || rel_path.ends_with(".jsx")
            {
                let mut rest = trimmed;
                if rest.starts_with("export ") {
                    rest = rest["export ".len()..].trim_start();
                }
                if rest.starts_with("default ") {
                    rest = rest["default ".len()..].trim_start();
                }
                if rest.starts_with("async ") {
                    rest = rest["async ".len()..].trim_start();
                }
                if rest.starts_with("function ") {
                    let fn_part = rest["function ".len()..].trim_start();
                    let fn_name: String = fn_part
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    if !fn_name.is_empty() {
                        symbols.push(SymbolEntry {
                            file_path: rel_path.to_string(),
                            symbol_type: "function",
                            name: fn_name,
                            line_number: line_num,
                        });
                    }
                } else if rest.starts_with("class ") {
                    let cls_part = rest["class ".len()..].trim_start();
                    let cls_name: String = cls_part
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    if !cls_name.is_empty() {
                        symbols.push(SymbolEntry {
                            file_path: rel_path.to_string(),
                            symbol_type: "class",
                            name: cls_name,
                            line_number: line_num,
                        });
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_repo_map_for_rust_project() {
        let temp = std::env::temp_dir().join(format!("test_repomap_{}", std::process::id()));
        std::fs::create_dir_all(temp.join("src")).unwrap();
        std::fs::write(
            temp.join("src/lib.rs"),
            "pub fn parse_input() {}\npub struct Data {}\n",
        )
        .unwrap();

        let map = RepoMapGenerator::generate_map(&temp, 1000);
        assert!(map.contains("File `src/lib.rs`:"));
        assert!(map.contains("fn parse_input"));
        assert!(map.contains("type struct Data"));

        std::fs::remove_dir_all(&temp).ok();
    }

    #[test]
    fn symbol_index_searches_by_name_and_type() {
        let temp = std::env::temp_dir().join(format!("test_symbolidx_{}", std::process::id()));
        std::fs::create_dir_all(temp.join("src")).unwrap();
        std::fs::write(
            temp.join("src/lib.rs"),
            "pub fn parse_input() {}\npub struct Data {}\npub fn process_data() {}\n",
        )
        .unwrap();

        let index = SymbolIndex::build(&temp);
        let hits = index.search("parse", 10);
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].name, "parse_input");
        assert_eq!(hits[0].symbol_type, "fn");

        let hits = index.search("data", 10);
        assert_eq!(hits.len(), 2); // parse_input, process_data, Data
        let fn_hits = index.search_type("fn", 10);
        assert_eq!(fn_hits.len(), 2);
        let type_hits = index.search_type("type", 10);
        assert_eq!(type_hits.len(), 1);
        assert_eq!(type_hits[0].name, "struct Data");

        std::fs::remove_dir_all(&temp).ok();
    }
}
