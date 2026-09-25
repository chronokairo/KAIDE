//! Dependency-free fuzzy file search for the Ctrl+P "Open File" overlay.
//!
//! Subsequence matching with scoring bonuses for consecutive characters,
//! path separators and word/camel boundaries — mirrors the UX of the Codex
//! TUI file-search popup without pulling in `codex-file-search`.

use std::path::Path;

/// A single fuzzy match against a workspace-relative path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileMatch {
    pub path: String,
    pub score: i64,
    /// Character offsets into `path` matched by the query (ascending).
    pub indices: Vec<usize>,
}

/// Directories never surfaced by the file walker.
const IGNORED_DIRS: &[&str] = &[
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "target",
    "dist",
    "build",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    "vendor",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    "memory_data",
];

/// Recursively collect workspace-relative paths (forward slashes, sorted).
pub fn walk_files(root: &Path) -> Vec<String> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            if is_dir {
                if IGNORED_DIRS.contains(&name.as_str()) {
                    continue;
                }
                stack.push(path);
            } else if let Ok(rel) = path.strip_prefix(root) {
                out.push(rel.to_string_lossy().replace('\\', "/"));
            }
        }
    }
    out.sort();
    out
}

/// Rank `paths` against `query` by fuzzy subsequence matching. Empty query
/// returns all paths (sorted), otherwise at most `limit` best matches.
pub fn search_files(paths: &[String], query: &str, limit: usize) -> Vec<FileMatch> {
    let mut matches: Vec<FileMatch> = if query.is_empty() {
        paths
            .iter()
            .map(|p| FileMatch {
                path: p.clone(),
                score: 0,
                indices: Vec::new(),
            })
            .collect()
    } else {
        paths
            .iter()
            .filter_map(|p| {
                fuzzy_match(query, p).map(|(score, indices)| FileMatch {
                    path: p.clone(),
                    score,
                    indices,
                })
            })
            .collect()
    };
    matches.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then_with(|| a.path.len().cmp(&b.path.len()))
            .then_with(|| a.path.cmp(&b.path))
    });
    matches.truncate(limit);
    matches
}

/// Return `(score, matched char indices)` when every char of `query` appears
/// in `haystack` in order (case-insensitive); otherwise `None`.
pub fn fuzzy_match(query: &str, haystack: &str) -> Option<(i64, Vec<usize>)> {
    if query.is_empty() {
        return Some((0, Vec::new()));
    }
    let q: Vec<char> = query.chars().map(|c| c.to_ascii_lowercase()).collect();
    let chars: Vec<char> = haystack.chars().collect();
    let lower: Vec<char> = chars.iter().map(|c| c.to_ascii_lowercase()).collect();

    let mut qi = 0;
    let mut score: i64 = 0;
    let mut indices = Vec::with_capacity(q.len());
    let mut prev_match: Option<usize> = None;

    for (hi, (&hc, &lc)) in chars.iter().zip(lower.iter()).enumerate() {
        if lc != q[qi] {
            continue;
        }
        let consecutive = prev_match == Some(hi.saturating_sub(1));
        let at_start = hi == 0;
        let after_sep = hi > 0 && matches!(chars[hi - 1], '/' | '-' | '_' | '.' | ' ');
        let camel = hc.is_uppercase() && hi > 0 && chars[hi - 1].is_lowercase();
        score += if consecutive {
            12
        } else if at_start {
            8
        } else if after_sep {
            6
        } else if camel {
            5
        } else {
            1
        };
        indices.push(hi);
        prev_match = Some(hi);
        qi += 1;
        if qi == q.len() {
            return Some((score, indices));
        }
    }
    None
}

/// Split `path` into `(byte_start, byte_end, matched)` segments for styling,
/// using the character offsets returned by `fuzzy_match`.
pub fn highlight_segments(path: &str, indices: &[usize]) -> Vec<(usize, usize, bool)> {
    let mut segments = Vec::new();
    if indices.is_empty() {
        if !path.is_empty() {
            segments.push((0, path.len(), false));
        }
        return segments;
    }
    let mut start = 0usize;
    let mut ci = 0usize;
    let mut in_match = indices.contains(&0);
    for (byte, _) in path.char_indices() {
        if byte == 0 {
            ci += 1;
            continue;
        }
        let matched = indices.contains(&ci);
        if matched != in_match {
            if byte > start {
                segments.push((start, byte, in_match));
            }
            start = byte;
            in_match = matched;
        }
        ci += 1;
    }
    if path.len() > start {
        segments.push((start, path.len(), in_match));
    }
    segments
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_query_matches_everything() {
        let paths = vec!["a.rs".to_string(), "src/b.rs".to_string()];
        let out = search_files(&paths, "", 10);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].path, "a.rs");
        assert_eq!(out[1].path, "src/b.rs");
    }

    #[test]
    fn subsequence_must_be_in_order() {
        assert!(fuzzy_match("bca", "abc").is_none());
        assert!(fuzzy_match("abc", "abc").is_some());
        assert!(fuzzy_match("ac", "abc").is_some());
    }

    #[test]
    fn case_insensitive_subsequence() {
        let (_, indices) = fuzzy_match("MAIN", "src/main.rs").unwrap();
        assert_eq!(indices, vec![4, 5, 6, 7]);
    }

    #[test]
    fn boundary_matches_score_higher() {
        let (score_infix, _) = fuzzy_match("ain", "src/main.rs").unwrap();
        let (score_sep, _) = fuzzy_match("main", "src/main.rs").unwrap();
        let (score_start, _) = fuzzy_match("main", "main.rs").unwrap();
        assert!(score_start > score_sep);
        assert!(score_sep > score_infix);
    }

    #[test]
    fn consecutive_matches_score_higher() {
        let (scattered, _) = fuzzy_match("mr", "src/main.rs").unwrap();
        let (consec, _) = fuzzy_match("ma", "src/main.rs").unwrap();
        assert!(consec > scattered);
    }

    #[test]
    fn search_ranks_best_first() {
        let paths = vec![
            "src/main.rs".to_string(),
            "tests/main_test.rs".to_string(),
            "docs/README.md".to_string(),
        ];
        let out = search_files(&paths, "main", 10);
        assert_eq!(out[0].path, "src/main.rs");
        assert_eq!(out[1].path, "tests/main_test.rs");
    }

    #[test]
    fn search_respects_limit() {
        let paths = (0..20).map(|i| format!("file{i}.rs")).collect::<Vec<_>>();
        let out = search_files(&paths, "file", 5);
        assert_eq!(out.len(), 5);
    }

    #[test]
    fn highlight_segments_split_match_runs() {
        let segs = highlight_segments("src/main.rs", &[4, 5, 6, 7]);
        assert_eq!(
            segs,
            vec![(0, 4, false), (4, 8, true), (8, 11, false)]
        );
    }

    #[test]
    fn highlight_segments_no_indices_marks_all_unmatched() {
        assert_eq!(highlight_segments("a/b.rs", &[]), vec![(0, 6, false)]);
    }

    #[test]
    fn walk_files_collects_relative_paths_and_skips_git() {
        let root = std::env::temp_dir().join(format!("anamnesic-walk-{}", std::process::id()));
        let sub = root.join("src");
        std::fs::create_dir_all(sub.join(".git")).unwrap();
        std::fs::create_dir_all(root.join(".git")).unwrap();
        std::fs::create_dir_all(root.join("target")).unwrap();
        std::fs::write(sub.join("main.rs"), "fn main() {}").unwrap();
        std::fs::write(root.join(".git/config"), "x").unwrap();
        std::fs::write(root.join("target/app.exe"), "x").unwrap();
        std::fs::write(root.join("README.md"), "hi").unwrap();

        let files = walk_files(&root);
        assert_eq!(files, vec!["README.md".to_string(), "src/main.rs".to_string()]);

        let _ = std::fs::remove_dir_all(&root);
    }
}
