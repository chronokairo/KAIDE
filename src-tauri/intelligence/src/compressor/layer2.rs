#![allow(dead_code)]
use std::collections::HashMap;

pub struct CompressLayer2 {
    tokenizer: TokenizerKind,
    pub original_tokens: usize,
    pub compressed_tokens: usize,
    pub applied_rules: Vec<String>,
}

enum TokenizerKind {
    Cl100kBase,
}

impl CompressLayer2 {
    pub fn new() -> Self {
        CompressLayer2 {
            tokenizer: TokenizerKind::Cl100kBase,
            original_tokens: 0,
            compressed_tokens: 0,
            applied_rules: Vec::new(),
        }
    }

    pub fn process(&mut self, input: &str) -> String {
        let mut rules = Vec::new();
        let original = input.to_string();

        self.original_tokens = estimate_tokens(&original);

        let mut text = normalize_opaque_tokens(&original);
        if text != original { rules.push("opaque_norm".into()); }

        let path_shrunk = shorten_paths_l2(&text);
        if path_shrunk != text { rules.push("path_shrink".into()); }
        text = path_shrunk;

        text = collapse_whitespace(&text);
        rules.push("ws_collapse".into());

        text = consolidate_prefixes(&text);
        rules.push("prefix_consolidate".into());

        self.compressed_tokens = estimate_tokens(&text);
        self.applied_rules = rules;
        text
    }
}

fn estimate_tokens(input: &str) -> usize {
    (input.len() as f64 * 0.25).ceil() as usize
}

fn normalize_opaque_tokens(input: &str) -> String {
    let mut s = input.to_string();
    if let Ok(re) = regex::Regex::new(r"\beyJ[A-Za-z0-9_-]{10,}\.(?:[A-Za-z0-9_-]{10,}\.)[A-Za-z0-9_-]{10,}\b") {
        s = re.replace_all(&s, "<JWT>").to_string();
    }
    if let Ok(re) = regex::Regex::new(r"\b[0-9a-fA-F]{40,}\b") {
        s = re.replace_all(&s, "<HASH>").to_string();
    }
    if let Ok(re) = regex::Regex::new(r"(?i)(https?://)[^\s]+") {
        s = re.replace_all(&s, "$1<URL>").to_string();
    }
    s
}

fn shorten_paths_l2(input: &str) -> String {
    if let Ok(re) = regex::Regex::new(r#""([^"]{30,})"#) {
        re.replace_all(input, |caps: &regex::Captures| {
            let path = &caps[1];
            let segments: Vec<&str> = path.split('/').collect();
            if segments.len() > 3 {
                format!("\"{}", segments[segments.len()-3..].join("/"))
            } else {
                format!("\"{}", path)
            }
        }).to_string()
    } else {
        input.to_string()
    }
}

fn collapse_whitespace(input: &str) -> String {
    input.lines()
        .map(|line| {
            let indent = line.len() - line.trim_start().len();
            if indent > 4 {
                format!("{}{}", " ".repeat(4), line.trim())
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn consolidate_prefixes(input: &str) -> String {
    let lines: Vec<&str> = input.lines().collect();
    let non_empty: Vec<&str> = lines.iter().filter(|l| !l.trim().is_empty()).copied().collect();
    if non_empty.len() < 3 {
        return input.to_string();
    }

    let prefix_counts: HashMap<&str, usize> = {
        let mut m: HashMap<&str, usize> = HashMap::new();
        for line in &non_empty {
            let prefix = get_prefix(line, 20);
            if prefix.len() >= 8 {
                *m.entry(prefix).or_insert(0) += 1;
            }
        }
        m
    };

    let best = prefix_counts.iter()
        .filter(|(_, &c)| c >= 3)
        .max_by_key(|(_, &c)| c);

    let (common_prefix, count) = match best {
        Some((p, c)) => (*p, *c),
        None => return input.to_string(),
    };

    let ratio = count as f64 / non_empty.len() as f64;
    if ratio < 0.5 { return input.to_string(); }

    let mut out = String::new();
    out.push_str(&format!("[common: {}] ×{} lines\n", common_prefix.trim(), count));
    for line in lines {
        let trimmed = line.trim();
        if trimmed.starts_with(common_prefix.trim()) {
            let suffix = trimmed[common_prefix.trim().len()..].trim();
            if !suffix.is_empty() {
                out.push_str(suffix);
                out.push('\n');
            }
        } else {
            out.push_str(line);
            out.push('\n');
        }
    }
    out
}

fn get_prefix(line: &str, max_len: usize) -> &str {
    let end = line.len().min(max_len);
    &line[..end]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn estimates_tokens_from_byte_length() {
        assert!(estimate_tokens("") == 0);
        assert!(estimate_tokens("hello world") > 0);
        assert!(estimate_tokens("a very long line of text that keeps going") > 0);
    }

    #[test]
    fn normalizes_opaque_tokens() {
        let jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        let out = normalize_opaque_tokens(format!("token={jwt}").as_str());
        assert!(out.contains("<JWT>"), "got: {out}");

        let url = normalize_opaque_tokens("see https://example.com/a/b?q=1");
        assert!(url.contains("https://<URL>"), "got: {url}");

        let hash = normalize_opaque_tokens("key 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef end");
        assert!(hash.contains("<HASH>"), "got: {hash}");
    }

    #[test]
    fn shortens_paths_keeping_last_segments() {
        let out = shorten_paths_l2("\"very/long/segments/path/to/file.txt\"");
        assert_eq!(out, "\"path/to/file.txt\"");
    }

    #[test]
    fn leaves_short_paths_untouched() {
        let out = shorten_paths_l2("\"one/two/three.txt\"");
        assert_eq!(out, "\"one/two/three.txt\"");
    }

    #[test]
    fn collapses_deep_indentation() {
        let out = collapse_whitespace("        deeply indented");
        assert_eq!(out, "    deeply indented");
        let out = collapse_whitespace("  normal");
        assert_eq!(out, "  normal");
    }

    #[test]
    fn consolidates_repeated_prefixes() {
        let input = [
            "module/project/src/common/path.rs alpha one",
            "module/project/src/common/path.rs beta two",
            "module/project/src/common/path.rs gamma three",
            "module/project/src/common/path.rs delta four",
        ].join("\n");
        let out = consolidate_prefixes(&input);
        assert!(out.contains("[common:"), "got: {out}");
        assert!(out.contains("×4 lines"), "got: {out}");
    }

    #[test]
    fn leaves_short_inputs_untouched_by_consolidation() {
        let out = consolidate_prefixes("a\nb\n");
        assert_eq!(out, "a\nb\n");
    }

    #[test]
    fn process_reports_rule_application() {
        let mut l2 = CompressLayer2::new();
        let input = "2024-01-01T10:00:00 https://example.com/a/very/long/path error\n2024-01-02T10:00:00 https://example.com/a/very/long/path error";
        let out = l2.process(input);
        assert!(out.contains("<URL>"), "got: {out}");
        assert!(!l2.applied_rules.is_empty());
    }
}
