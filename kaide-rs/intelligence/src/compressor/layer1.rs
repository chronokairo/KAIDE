pub struct CompressResult {
    pub output: String,
    pub original_lines: usize,
    pub compressed_lines: usize,
    pub applied_rules: Vec<String>,
}

pub fn compress(input: &str) -> CompressResult {
    let original_lines = input.lines().count();

    let mut rules: Vec<String> = Vec::new();
    let mut text = input.to_string();

    let before = text.len();

    text = strip_ansi(&text);
    if text.len() != before { rules.push("ansi_strip".into()); }

    let before_lin = text.lines().count();
    text = remove_progress_bars(&text);
    if text.lines().count() != before_lin { rules.push("progress_bars".into()); }

    let before_lin = text.lines().count();
    text = collapse_blank_lines(&text);
    if text.lines().count() != before_lin { rules.push("collapse_blank_lines".into()); }

    let before_lin = text.lines().count();
    text = template_dedup(&text);
    if text.lines().count() != before_lin { rules.push("template_dedup".into()); }

    let before_lin = text.lines().count();
    text = filter_stack_frames(&text);
    if text.lines().count() != before_lin { rules.push("stack_collapse".into()); }

    let before_lin = text.lines().count();
    text = filter_test_pass(&text);
    if text.lines().count() != before_lin { rules.push("test_filter".into()); }

    let before_lin = text.lines().count();
    text = factor_common_prefix(&text);
    if text.lines().count() != before_lin { rules.push("prefix_factor".into()); }

    text = shorten_paths(&text);
    rules.push("path_shrink".into());

    text = normalize_tokens(&text);
    rules.push("token_norm".into());

    let compressed_lines = text.lines().count();

    CompressResult {
        output: text.trim().to_string(),
        original_lines,
        compressed_lines,
        applied_rules: rules,
    }
}

fn strip_ansi(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\x1b' && chars.peek() == Some(&'[') {
            chars.next();
            while let Some(&n) = chars.peek() {
                if n == 'm' || n == 'H' || ('@'..='~').contains(&n) {
                    chars.next();
                    break;
                }
                chars.next();
            }
        } else {
            out.push(c);
        }
    }
    out
}

fn remove_progress_bars(input: &str) -> String {
    let spinner_chars: &[char] = &['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    input.lines()
        .filter(|line| {
            if line.trim().is_empty() { return true; }
            let trimmed = line.trim();
            if trimmed.starts_with("Compiling ") || trimmed.starts_with("Checking ") {
                return false;
            }
            if trimmed.starts_with("Downloading ") || trimmed.starts_with("  Downloaded ") {
                return false;
            }
            if trimmed.starts_with("   Compiling") || trimmed.starts_with("    Checking") {
                return false;
            }
            if let Some(ch) = trimmed.chars().next() {
                if spinner_chars.contains(&ch) {
                    return false;
                }
            }
            true
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn collapse_blank_lines(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut prev_blank = false;
    for line in input.lines() {
        if line.trim().is_empty() {
            if prev_blank { continue; }
            prev_blank = true;
        } else {
            prev_blank = false;
        }
        out.push_str(line);
        out.push('\n');
    }
    out
}

fn template_dedup(input: &str) -> String {
    let mut groups: Vec<(String, usize)> = Vec::new();
    for line in input.lines() {
        let norm = normalize_template(line);
        if let Some((ref last, count)) = groups.last_mut() {
            if *last == norm {
                *count += 1;
                continue;
            }
        }
        groups.push((norm, 1));
    }
    groups.iter()
        .map(|(norm, count)| {
            if *count > 1 {
                format!("[×{}] {}", count, norm)
            } else {
                norm.clone()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn normalize_template(line: &str) -> String {
    let mut s = line.to_string();
    s = regex_replace(&s, r"\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", "<TS>");
    s = regex_replace(&s, r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", "<UUID>");
    s = regex_replace(&s, r"\b0x[0-9a-fA-F]{6,}\b", "<HEX>");
    s = regex_replace(&s, r"\b\d{3,}\b", "<N>");
    s
}

fn regex_replace(s: &str, pattern: &str, replacement: &str) -> String {
    if let Ok(re) = regex::Regex::new(pattern) {
        re.replace_all(s, replacement).to_string()
    } else {
        s.to_string()
    }
}

fn filter_stack_frames(input: &str) -> String {
    let mut out = String::new();
    let mut frame_run = 0;
    let mut skipped = false;
    let frame_patterns = [
        "site-packages/", "node_modules/", ".cargo/registry/",
        "go/pkg/", "lib/python", "vendor/", "packages/",
    ];

    for line in input.lines() {
        let trimmed = line.trim();
        let is_framework = frame_patterns.iter().any(|p| trimmed.contains(p));

        if is_framework {
            frame_run += 1;
            skipped = true;
        } else {
            if frame_run >= 3 {
                out.push_str(&format!("  ... {} framework frames omitted\n", frame_run));
            } else if skipped {
                out.push('\n');
            }
            frame_run = 0;
            skipped = false;
            out.push_str(line);
            out.push('\n');
        }
    }
    if frame_run >= 3 {
        out.push_str(&format!("  ... {} framework frames omitted\n", frame_run));
    }
    out
}

fn filter_test_pass(input: &str) -> String {
    input.lines()
        .filter(|line| {
            let t = line.trim();
            if t.starts_with("test ") && t.ends_with(" ok") { return false; }
            if t == "ok" || t.starts_with("test result: ") { return true; }
            true
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn factor_common_prefix(input: &str) -> String {
    let lines: Vec<&str> = input.lines().collect();
    if lines.len() < 3 {
        return input.to_string();
    }
    let non_empty: Vec<&str> = lines.iter().filter(|l| !l.trim().is_empty()).copied().collect();
    if non_empty.len() < 3 { return input.to_string(); }

    let first = non_empty[0];
    let mut prefix_len = 0;
    for (i, (a, b)) in first.chars().zip(non_empty[1].chars()).enumerate() {
        if a == b { prefix_len = i + 1; } else { break; }
    }

    let prefix: String = first.chars().take(prefix_len).collect();
    if prefix.trim().is_empty() || prefix_len < 12 { return input.to_string(); }

    let count = non_empty.iter().filter(|l| l.starts_with(&prefix)).count();
    if count < 3 { return input.to_string(); }

    let mut out = String::new();
    out.push_str(&format!("[common prefix: {}] ({} lines)\n", prefix.trim(), count));
    for line in lines {
        if !line.trim().is_empty() && line.starts_with(&prefix) {
            out.push_str(line[prefix_len..].trim());
            out.push('\n');
        } else {
            out.push_str(line);
            out.push('\n');
        }
    }
    out
}

fn shorten_paths(input: &str) -> String {
    let re = regex::Regex::new(r#""([^"]{40,})"#).ok();
    input.lines()
        .map(|line| {
            if let Some(ref re) = re {
                let replaced = re.replace_all(line, |caps: &regex::Captures| {
                    let path = &caps[1];
                    let segments: Vec<&str> = path.split('/').collect();
                    if segments.len() > 3 {
                        format!("\"{}", segments[segments.len()-3..].join("/"))
                    } else {
                        format!("\"{}", path)
                    }
                });
                replaced.to_string()
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn normalize_tokens(input: &str) -> String {
    let mut s = input.to_string();
    s = regex_replace(&s, r"\b[0-9a-fA-F]{64}\b", "<SHA256>");
    s = regex_replace(&s, r"\be?[0-9a-fA-F]{32,}\b", "<HASH>");
    s = regex_replace(&s, r"\beyJ[A-Za-z0-9_-]{10,}\.(?:[A-Za-z0-9_-]{10,}\.)[A-Za-z0-9_-]{10,}\b", "<JWT>");
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_ansi_sequences() {
        assert_eq!(strip_ansi("\x1b[31mred\x1b[0m"), "red");
        assert_eq!(strip_ansi("plain"), "plain");
        assert_eq!(strip_ansi("a\x1b[1m b"), "a b");
    }

    #[test]
    fn removes_progress_and_build_lines() {
        let input = "Compiling foo v0.1\n⠹ checking\nreal output here\n";
        let out = remove_progress_bars(input);
        assert!(!out.contains("Compiling foo"));
        assert!(!out.contains("⠹"));
        assert!(out.contains("real output here"));
    }

    #[test]
    fn collapses_runs_of_blank_lines() {
        let out = collapse_blank_lines("a\n\n\n\nb\n\nc");
        assert_eq!(out, "a\n\nb\n\nc\n");
    }

    #[test]
    fn dedups_repeated_templates_by_timestamp() {
        let input = "2024-01-01T10:00:00 error boom\n2024-02-02T10:00:00 error boom";
        let out = template_dedup(input);
        assert!(out.contains("[×2]"), "got: {out}");
        assert!(out.contains("<TS> error boom"), "got: {out}");
    }

    #[test]
    fn collapses_framework_stack_frames() {
        let input = "line1\n  at /usr/lib/python3/site-packages/a.py\n  at /usr/lib/python3/site-packages/b.py\n  at /usr/lib/python3/site-packages/c.py\nfinal";
        let out = filter_stack_frames(input);
        assert!(out.contains("3 framework frames omitted"), "got: {out}");
        assert!(out.contains("line1"));
        assert!(out.contains("final"));
    }

    #[test]
    fn filters_passing_test_lines() {
        let input = "test a ok\ntest result: ok. 2 passed\n";
        let out = filter_test_pass(input);
        assert!(!out.contains("test a ok"));
        assert!(out.contains("test result: ok"));
    }

    #[test]
    fn factors_common_prefix() {
        let input = "error in module alpha worker\nerror in module beta worker\nerror in module gamma worker\n";
        let out = factor_common_prefix(input);
        assert!(out.contains("[common prefix:"), "got: {out}");
    }

    #[test]
    fn shortens_long_quoted_paths() {
        let input = "\"this/is/a/very/long/segment/path/to/file.txt\"";
        let out = shorten_paths(input);
        assert!(!out.contains("/very/long/"), "got: {out}");
        assert!(out.ends_with("path/to/file.txt\""), "got: {out}");
    }

    #[test]
    fn masks_hashes_and_tokens() {
        let out = normalize_tokens("hash abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789 done");
        assert!(out.contains("<SHA256>"), "got: {out}");
        assert!(!out.contains("abcdef0123456789"));
    }

    #[test]
    fn compress_applies_rules_end_to_end() {
        let input = "\x1b[32mCompiling app\x1b[0m\n\n\nreal output\n";
        let result = compress(input);
        assert!(result.output.contains("real output"));
        assert!(result.applied_rules.contains(&"ansi_strip".to_string()));
        assert!(result.applied_rules.contains(&"progress_bars".to_string()));
        assert!(result.compressed_lines <= result.original_lines);
    }
}
