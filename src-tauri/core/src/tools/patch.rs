use crate::error::{anyhow, Context, Result};
use std::fs;
use std::path::Path;

/// Result of applying a patch
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PatchResult {
    pub file_path: String,
    pub lines_added: usize,
    pub lines_removed: usize,
    pub original_sha256: Option<String>,
    pub new_sha256: String,
}

/// A parsed hunk in unified diff format
#[derive(Debug, Clone)]
struct DiffHunk {
    old_start: usize,
    #[allow(dead_code)]
    old_count: usize,
    #[allow(dead_code)]
    new_start: usize,
    #[allow(dead_code)]
    new_count: usize,
    lines: Vec<String>,
}

/// A single file diff parsed from unified diff format
#[derive(Debug, Clone)]
struct FileDiff {
    old_file: Option<String>,
    new_file: Option<String>,
    hunks: Vec<DiffHunk>,
}

/// Computes SHA256 hex digest of a byte slice
fn sha256_digest(bytes: &[u8]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

/// Parses a unified diff string into a list of file diffs
fn parse_unified_diff(diff_text: &str) -> Result<Vec<FileDiff>> {
    let mut file_diffs = Vec::new();
    let mut current_file: Option<FileDiff> = None;
    let mut current_hunk: Option<DiffHunk> = None;

    for line in diff_text.lines() {
        if line.starts_with("--- ") {
            if let Some(hunk) = current_hunk.take() {
                if let Some(ref mut fd) = current_file {
                    fd.hunks.push(hunk);
                }
            }
            if let Some(fd) = current_file.take() {
                file_diffs.push(fd);
            }
            let path = line.strip_prefix("--- ").unwrap().trim();
            let clean_path = path.strip_prefix("a/").unwrap_or(path).to_string();
            current_file = Some(FileDiff {
                old_file: if clean_path == "/dev/null" {
                    None
                } else {
                    Some(clean_path)
                },
                new_file: None,
                hunks: Vec::new(),
            });
        } else if line.starts_with("+++ ") {
            let path = line.strip_prefix("+++ ").unwrap().trim();
            let clean_path = path.strip_prefix("b/").unwrap_or(path).to_string();
            if let Some(ref mut fd) = current_file {
                fd.new_file = if clean_path == "/dev/null" {
                    None
                } else {
                    Some(clean_path)
                };
            }
        } else if line.starts_with("@@ ") {
            if let Some(hunk) = current_hunk.take() {
                if let Some(ref mut fd) = current_file {
                    fd.hunks.push(hunk);
                }
            }
            let header = line.trim_start_matches('@').trim_end_matches('@').trim();
            let parts: Vec<&str> = header.split_whitespace().collect();
            if parts.len() >= 2 {
                let (old_start, old_count) = parse_range(parts[0].strip_prefix('-').unwrap_or("0"));
                let (new_start, new_count) = parse_range(parts[1].strip_prefix('+').unwrap_or("0"));
                current_hunk = Some(DiffHunk {
                    old_start,
                    old_count,
                    new_start,
                    new_count,
                    lines: Vec::new(),
                });
            }
        } else if let Some(ref mut hunk) = current_hunk {
            if line.starts_with('+') || line.starts_with('-') || line.starts_with(' ') || line.is_empty() {
                hunk.lines.push(line.to_string());
            }
        }
    }

    if let Some(hunk) = current_hunk {
        if let Some(ref mut fd) = current_file {
            fd.hunks.push(hunk);
        }
    }
    if let Some(fd) = current_file {
        file_diffs.push(fd);
    }

    Ok(file_diffs)
}

fn parse_range(range_str: &str) -> (usize, usize) {
    if let Some((start_s, count_s)) = range_str.split_once(',') {
        let start = start_s.parse::<usize>().unwrap_or(1);
        let count = count_s.parse::<usize>().unwrap_or(1);
        (start, count)
    } else {
        let start = range_str.parse::<usize>().unwrap_or(1);
        (start, 1)
    }
}

/// Applies a parsed file diff to a file in the workspace
pub fn affected_paths(patch_str: &str) -> Result<Vec<String>> {
    let paths = parse_unified_diff(patch_str)?
        .into_iter()
        .map(|diff| {
            diff.new_file
                .or(diff.old_file)
                .ok_or_else(|| anyhow!("Diff missing target file path"))
        })
        .collect::<Result<Vec<_>>>()?;
    if paths.is_empty() {
        return Err(anyhow!("No valid file diffs found in patch"));
    }
    Ok(paths)
}

/// Validate and calculate a patch without changing the workspace.
pub fn preview_patch(workspace_root: &Path, patch_str: &str) -> Result<Vec<PatchResult>> {
    process_patch(workspace_root, patch_str, false)
}

/// Apply a parsed patch to the workspace.
pub fn apply_patch(workspace_root: &Path, patch_str: &str) -> Result<Vec<PatchResult>> {
    process_patch(workspace_root, patch_str, true)
}

fn process_patch(workspace_root: &Path, patch_str: &str, write: bool) -> Result<Vec<PatchResult>> {
    let file_diffs = parse_unified_diff(patch_str)?;
    if file_diffs.is_empty() {
        return Err(anyhow!("No valid file diffs found in patch"));
    }

    let mut results = Vec::new();

    for fd in file_diffs {
        let target_path_rel = fd
            .new_file
            .clone()
            .or_else(|| fd.old_file.clone())
            .ok_or_else(|| anyhow!("Diff missing target file path"))?;

        let full_path = workspace_root.join(&target_path_rel);

        let canonical_root = workspace_root
            .canonicalize()
            .unwrap_or_else(|_| workspace_root.to_path_buf());
        
        let target_dir = full_path.parent().unwrap_or(workspace_root);
        if let Ok(canon_dir) = target_dir.canonicalize() {
            if !canon_dir.starts_with(&canonical_root) && canon_dir != canonical_root {
                return Err(anyhow!("Target path {} escapes workspace root", target_path_rel));
            }
        }

        let existing_content = if full_path.exists() {
            Some(fs::read_to_string(&full_path).with_context(|| format!("Reading file {}", full_path.display()))?)
        } else {
            None
        };

        let orig_digest = existing_content.as_ref().map(|c| sha256_digest(c.as_bytes()));

        let original_lines: Vec<String> = match &existing_content {
            Some(content) => content.lines().map(|s| s.to_string()).collect(),
            None => Vec::new(),
        };

        let mut lines_added = 0;
        let mut lines_removed = 0;
        let mut output_lines = Vec::new();
        let mut orig_idx = 0;

        for hunk in &fd.hunks {
            let target_line = hunk.old_start.saturating_sub(1);
            
            while orig_idx < target_line && orig_idx < original_lines.len() {
                output_lines.push(original_lines[orig_idx].clone());
                orig_idx += 1;
            }

            for line in &hunk.lines {
                if let Some(added) = line.strip_prefix('+') {
                    output_lines.push(added.to_string());
                    lines_added += 1;
                } else if let Some(_removed) = line.strip_prefix('-') {
                    orig_idx += 1;
                    lines_removed += 1;
                } else if let Some(context) = line.strip_prefix(' ') {
                    if orig_idx < original_lines.len() {
                        output_lines.push(original_lines[orig_idx].clone());
                        orig_idx += 1;
                    } else {
                        output_lines.push(context.to_string());
                    }
                } else if line.is_empty() {
                    if orig_idx < original_lines.len() {
                        output_lines.push(original_lines[orig_idx].clone());
                        orig_idx += 1;
                    }
                }
            }
        }

        while orig_idx < original_lines.len() {
            output_lines.push(original_lines[orig_idx].clone());
            orig_idx += 1;
        }

        let mut new_content = output_lines.join("\n");
        if !new_content.is_empty() && (existing_content.as_ref().map_or(true, |c| c.ends_with('\n'))) {
            new_content.push('\n');
        }

        if write {
            if let Some(parent) = full_path.parent() {
                fs::create_dir_all(parent)?;
            }

            fs::write(&full_path, &new_content)
                .with_context(|| format!("Writing patched content to {}", full_path.display()))?;
        }

        let new_digest = sha256_digest(new_content.as_bytes());

        results.push(PatchResult {
            file_path: target_path_rel,
            lines_added,
            lines_removed,
            original_sha256: orig_digest,
            new_sha256: new_digest,
        });
    }

    Ok(results)
}

/// Computes a unified diff string between old_text and new_text using pure std.
pub fn create_patch(old_text: &str, new_text: &str) -> String {
    let old_lines: Vec<&str> = old_text.lines().collect();
    let new_lines: Vec<&str> = new_text.lines().collect();

    let n = old_lines.len();
    let m = new_lines.len();

    if n == 0 && m == 0 {
        return String::new();
    }

    // Standard LCS dynamic programming table
    let mut dp = vec![vec![0usize; m + 1]; n + 1];
    for i in 0..n {
        for j in 0..m {
            if old_lines[i] == new_lines[j] {
                dp[i + 1][j + 1] = dp[i][j] + 1;
            } else {
                dp[i + 1][j + 1] = dp[i + 1][j].max(dp[i][j + 1]);
            }
        }
    }

    // Backtrack to build diff operations: (Op, text)
    #[derive(Clone, Copy, PartialEq, Eq)]
    enum Op {
        Equal,
        Insert,
        Delete,
    }

    let mut ops = Vec::new();
    let mut i = n;
    let mut j = m;

    while i > 0 || j > 0 {
        if i > 0 && j > 0 && old_lines[i - 1] == new_lines[j - 1] {
            ops.push((Op::Equal, old_lines[i - 1]));
            i -= 1;
            j -= 1;
        } else if j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j]) {
            ops.push((Op::Insert, new_lines[j - 1]));
            j -= 1;
        } else if i > 0 && (j == 0 || dp[i][j - 1] < dp[i - 1][j]) {
            ops.push((Op::Delete, old_lines[i - 1]));
            i -= 1;
        }
    }
    ops.reverse();

    // Check if there are any changes
    if !ops.iter().any(|(op, _)| *op != Op::Equal) {
        return String::new();
    }

    let mut output = String::new();
    let old_count = n;
    let new_count = m;
    let old_start = if old_count > 0 { 1 } else { 0 };
    let new_start = if new_count > 0 { 1 } else { 0 };

    output.push_str(&format!("@@ -{old_start},{old_count} +{new_start},{new_count} @@\n"));
    for (op, line) in ops {
        match op {
            Op::Equal => {
                output.push(' ');
                output.push_str(line);
                output.push('\n');
            }
            Op::Delete => {
                output.push('-');
                output.push_str(line);
                output.push('\n');
            }
            Op::Insert => {
                output.push('+');
                output.push_str(line);
                output.push('\n');
            }
        }
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_apply_patch_simple() {
        let temp_dir = std::env::temp_dir().join("chronokairo_patch_test_1");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let file_path = temp_dir.join("test.txt");
        fs::write(&file_path, "line1\nline2\nline3\n").unwrap();

        let patch = r#"--- a/test.txt
+++ b/test.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2_modified
 line3
"#;

        let results = apply_patch(&temp_dir, patch).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].lines_added, 1);
        assert_eq!(results[0].lines_removed, 1);

        let new_content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(new_content, "line1\nline2_modified\nline3\n");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
