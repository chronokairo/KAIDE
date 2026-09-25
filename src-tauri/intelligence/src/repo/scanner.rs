use std::path::Path;
use regex::Regex;

pub struct SymbolEntry {
    pub file_path: String,
    pub symbol_type: &'static str,
    pub name: String,
    pub line_number: usize,
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
            lines.push(format!("  L{:<4} {} {}", sym.line_number, sym.symbol_type, sym.name));
        }

        let full = lines.join("\n");
        if full.len() > max_bytes {
            let truncated: String = full.chars().take(max_bytes).collect();
            format!("{}\n...[repo map truncated at {} bytes]", truncated, max_bytes)
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
            ".git", "target", "node_modules", "vendor", "dist", "build", ".idea", ".vscode", "brain",
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

    fn extract_symbols_from_file(path: &Path, rel_path: &str, symbols: &mut Vec<SymbolEntry>) {
        let Ok(content) = std::fs::read_to_string(path) else {
            return;
        };

        let fn_re = Regex::new(r"^\s*(pub\s+|async\s+)*fn\s+([a-zA-Z0-9_]+)").unwrap();
        let struct_re = Regex::new(r"^\s*(pub\s+)*(struct|enum|trait|type|union)\s+([a-zA-Z0-9_]+)").unwrap();
        let py_fn_re = Regex::new(r"^\s*(async\s+)?def\s+([a-zA-Z0-9_]+)").unwrap();
        let py_class_re = Regex::new(r"^\s*class\s+([a-zA-Z0-9_]+)").unwrap();
        let js_fn_re = Regex::new(r"^\s*(export\s+)?(async\s+)?function\s+([a-zA-Z0-9_]+)").unwrap();
        let js_class_re = Regex::new(r"^\s*(export\s+)?class\s+([a-zA-Z0-9_]+)").unwrap();

        for (line_idx, line) in content.lines().enumerate() {
            let line_num = line_idx + 1;
            if rel_path.ends_with(".rs") {
                if let Some(caps) = fn_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "fn",
                        name: caps[2].to_string(),
                        line_number: line_num,
                    });
                } else if let Some(caps) = struct_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "type",
                        name: format!("{} {}", &caps[2], &caps[3]),
                        line_number: line_num,
                    });
                }
            } else if rel_path.ends_with(".py") {
                if let Some(caps) = py_fn_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "def",
                        name: caps[2].to_string(),
                        line_number: line_num,
                    });
                } else if let Some(caps) = py_class_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "class",
                        name: caps[1].to_string(),
                        line_number: line_num,
                    });
                }
            } else if rel_path.ends_with(".js") || rel_path.ends_with(".ts") || rel_path.ends_with(".tsx") || rel_path.ends_with(".jsx") {
                if let Some(caps) = js_fn_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "function",
                        name: caps[3].to_string(),
                        line_number: line_num,
                    });
                } else if let Some(caps) = js_class_re.captures(line) {
                    symbols.push(SymbolEntry {
                        file_path: rel_path.to_string(),
                        symbol_type: "class",
                        name: caps[2].to_string(),
                        line_number: line_num,
                    });
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
        std::fs::write(temp.join("src/lib.rs"), "pub fn parse_input() {}\npub struct Data {}\n").unwrap();

        let map = RepoMapGenerator::generate_map(&temp, 1000);
        assert!(map.contains("File `src/lib.rs`:"));
        assert!(map.contains("fn parse_input"));
        assert!(map.contains("type struct Data"));

        std::fs::remove_dir_all(&temp).ok();
    }
}
