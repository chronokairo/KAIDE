//! LSH — Lightweight Syntax Highlighter inspirado em `microsoft/edit` `crates/lsh`.
//! DSL mínima + VM runtime em `std` (sem tree-sitter). Mapeia extensões para regras.
//! Uso: `highlight(&text, "rs") -> Vec<Span>`.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenKind { Keyword, String, Comment, Number, Type, Function, Operator, Plain }

#[derive(Debug, Clone)]
pub struct Span { pub start: usize, pub end: usize, pub kind: TokenKind }

#[derive(Debug, Clone)]
struct Rule { pattern: Pattern, kind: TokenKind }

#[derive(Debug, Clone)]
enum Pattern { Keyword(&'static str), Prefix(&'static str), Char(char), Number, Any }

fn rules_for(lang: &str) -> Vec<Rule> {
    match lang {
        "rs" | "rust" => vec![
            Rule { pattern: Pattern::Keyword("fn"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("let"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("mut"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("pub"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("struct"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("enum"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("impl"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("return"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("if"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("else"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("for"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("while"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("match"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Prefix("//"), kind: TokenKind::Comment },
            Rule { pattern: Pattern::Char('"'), kind: TokenKind::String },
            Rule { pattern: Pattern::Number, kind: TokenKind::Number },
        ],
        "py" | "python" => vec![
            Rule { pattern: Pattern::Keyword("def"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("class"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("import"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("return"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Prefix("#"), kind: TokenKind::Comment },
            Rule { pattern: Pattern::Char('"'), kind: TokenKind::String },
            Rule { pattern: Pattern::Char('\''), kind: TokenKind::String },
        ],
        "js" | "ts" | "javascript" | "typescript" => vec![
            Rule { pattern: Pattern::Keyword("function"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("const"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("let"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Keyword("return"), kind: TokenKind::Keyword },
            Rule { pattern: Pattern::Prefix("//"), kind: TokenKind::Comment },
            Rule { pattern: Pattern::Char('"'), kind: TokenKind::String },
        ],
        _ => vec![
            Rule { pattern: Pattern::Prefix("//"), kind: TokenKind::Comment },
            Rule { pattern: Pattern::Prefix("#"), kind: TokenKind::Comment },
            Rule { pattern: Pattern::Char('"'), kind: TokenKind::String },
        ],
    }
}

pub fn highlight(text: &str, lang: &str) -> Vec<Span> {
    let rules = rules_for(lang);
    let bytes = text.as_bytes();
    let mut spans = Vec::new();
    let mut i = 0usize;
    while i < bytes.len() {
        let mut matched = false;
        // Try string/comment prefixes first
        for rule in &rules {
            match &rule.pattern {
                Pattern::Prefix(p) => {
                    if text[i..].starts_with(p) {
                        let end = if *p == "//" || *p == "#" {
                            text[i..].find('\n').map(|j| i + j).unwrap_or(text.len())
                        } else { i + p.len() };
                        // extend string to closing quote
                        if rule.kind == TokenKind::String {
                            let quote = p.chars().next().unwrap();
                            if let Some(j) = text[i+1..].find(quote) { spans.push(Span { start: i, end: i+1+j+1, kind: rule.kind }); i = i+1+j+1; } else { spans.push(Span { start: i, end: text.len(), kind: rule.kind }); i = text.len(); }
                        } else {
                            spans.push(Span { start: i, end, kind: rule.kind });
                            i = end;
                        }
                        matched = true; break;
                    }
                }
                Pattern::Char(q) => {
                    if bytes[i] == *q as u8 {
                        if let Some(j) = text[i+1..].find(*q) {
                            spans.push(Span { start: i, end: i+1+j+1, kind: rule.kind });
                            i = i+1+j+1;
                        } else { spans.push(Span { start: i, end: text.len(), kind: rule.kind }); i = text.len(); }
                        matched = true; break;
                    }
                }
                Pattern::Keyword(kw) => {
                    if text[i..].starts_with(kw) {
                        let after = i + kw.len();
                        let boundary = text[after..].chars().next().map(|c| !c.is_alphanumeric() && c != '_').unwrap_or(true);
                        let before_ok = i == 0 || !text[..i].chars().next_back().map(|c| c.is_alphanumeric() || c == '_').unwrap_or(false);
                        if boundary && before_ok {
                            spans.push(Span { start: i, end: after, kind: rule.kind });
                            i = after; matched = true; break;
                        }
                    }
                }
                Pattern::Number => {
                    if bytes[i].is_ascii_digit() {
                        let mut j = i;
                        while j < bytes.len() && (bytes[j].is_ascii_digit() || bytes[j] == b'.') { j += 1; }
                        spans.push(Span { start: i, end: j, kind: rule.kind });
                        i = j; matched = true; break;
                    }
                }
                Pattern::Any => {}
            }
        }
        if !matched { i += 1; }
    }
    spans
}

pub fn ansi_highlight(text: &str, lang: &str) -> String {
    let spans = highlight(text, lang);
    if spans.is_empty() { return text.to_string(); }
    let mut out = String::new();
    let mut last = 0usize;
    for s in spans {
        if s.start > last { out.push_str(&text[last..s.start]); }
        let color = match s.kind {
            TokenKind::Keyword => "\x1b[35m",
            TokenKind::String => "\x1b[32m",
            TokenKind::Comment => "\x1b[90m",
            TokenKind::Number => "\x1b[33m",
            _ => "\x1b[0m",
        };
        out.push_str(color);
        out.push_str(&text[s.start..s.end]);
        out.push_str("\x1b[0m");
        last = s.end;
    }
    if last < text.len() { out.push_str(&text[last..]); }
    out
}

pub fn detect_lang(path: &str) -> &str {
    match path.rsplit('.').next().unwrap_or("") {
        "rs" => "rs",
        "py" => "py",
        "js" => "js",
        "ts" => "ts",
        "json" => "json",
        "toml" => "toml",
        "md" => "md",
        _ => "txt",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn highlights_keywords() {
        let spans = highlight("fn foo() { let x = 1; // hi", "rs");
        assert!(spans.iter().any(|s| s.kind == TokenKind::Keyword));
        assert!(spans.iter().any(|s| s.kind == TokenKind::Comment));
    }
    #[test]
    fn ansi_roundtrip() {
        let out = ansi_highlight("fn main() {}", "rs");
        assert!(out.contains("fn"));
    }
}
