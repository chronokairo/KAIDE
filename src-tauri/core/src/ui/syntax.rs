//! Syntax highlighting std-only for the editor surface.
//!
//! This is intentionally a small, deterministic lexer rather than a regex
//! dependency. It follows the useful part of microsoft/edit's LSH contract:
//! choose a language from the filename and emit styled spans quickly.

use crate::ui::engine::vt::{Color, Modifier, Span, Style};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Kind { Plain, Comment, String, Number, Keyword, Type, Punctuation }

pub fn highlight_line(path: &str, line: &str) -> Vec<Span<'static>> {
    let lang = language(path);
    if lang == "plain" { return vec![Span::styled(line.to_string(), Style::default())]; }
    let bytes = line.as_bytes();
    let mut out = Vec::new();
    let mut start = 0;
    let mut i = 0;
    while i < bytes.len() {
        let ch = bytes[i] as char;
        if (lang == "rust" || lang == "c" || lang == "cpp" || lang == "java" || lang == "go" || lang == "js")
            && i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'/' {
            push_plain(&mut out, &line[start..i]);
            out.push(styled(&line[i..], Kind::Comment));
            return out;
        }
        if (lang == "python" || lang == "shell") && ch == '#' {
            push_plain(&mut out, &line[start..i]);
            out.push(styled(&line[i..], Kind::Comment));
            return out;
        }
        if ch == '"' || ch == '\'' || ch == '`' {
            let quote = ch;
            let mut end = i + 1;
            while end < bytes.len() {
                if bytes[end] == b'\\' { end += 2; continue; }
                if bytes[end] as char == quote { end += 1; break; }
                end += 1;
            }
            push_plain(&mut out, &line[start..i]);
            out.push(styled(&line[i..end.min(line.len())], Kind::String));
            i = end;
            start = i;
            continue;
        }
        if ch.is_ascii_digit() && (i == 0 || !is_ident(bytes[i - 1] as char)) {
            let mut end = i + 1;
            while end < bytes.len() && (bytes[end].is_ascii_alphanumeric() || bytes[end] == b'.' || bytes[end] == b'_') { end += 1; }
            push_plain(&mut out, &line[start..i]);
            out.push(styled(&line[i..end], Kind::Number));
            i = end;
            start = i;
            continue;
        }
        if is_ident(ch) {
            let mut end = i + 1;
            while end < bytes.len() && is_ident(bytes[end] as char) { end += 1; }
            let word = &line[i..end];
            let kind = if keyword(lang, word) { Kind::Keyword }
                else if type_name(lang, word) { Kind::Type } else { Kind::Plain };
            if kind != Kind::Plain {
                push_plain(&mut out, &line[start..i]);
                out.push(styled(word, kind));
                start = end;
            }
            i = end;
            continue;
        }
        i += 1;
    }
    push_plain(&mut out, &line[start..]);
    if out.is_empty() { out.push(Span::styled(String::new(), Style::default())); }
    out
}

fn push_plain(out: &mut Vec<Span<'static>>, text: &str) { if !text.is_empty() { out.push(styled(text, Kind::Plain)); } }
fn is_ident(ch: char) -> bool { ch == '_' || ch.is_ascii_alphanumeric() }

fn styled(text: &str, kind: Kind) -> Span<'static> {
    let mut style = Style::default();
    style.fg = Some(match kind {
        Kind::Comment => Color::DarkGray,
        Kind::String => Color::Green,
        Kind::Number => Color::Yellow,
        Kind::Keyword => Color::Magenta,
        Kind::Type => Color::Cyan,
        Kind::Punctuation | Kind::Plain => Color::White,
    });
    if kind == Kind::Keyword { style = style.add_modifier(Modifier::BOLD); }
    Span::styled(text.to_string(), style)
}

fn language(path: &str) -> &'static str {
    let lower = path.to_ascii_lowercase();
    if lower.ends_with(".rs") { "rust" }
    else if lower.ends_with(".py") { "python" }
    else if lower.ends_with(".js") || lower.ends_with(".ts") || lower.ends_with(".jsx") || lower.ends_with(".tsx") { "js" }
    else if lower.ends_with(".c") || lower.ends_with(".h") { "c" }
    else if lower.ends_with(".cc") || lower.ends_with(".cpp") || lower.ends_with(".hpp") { "cpp" }
    else if lower.ends_with(".go") { "go" }
    else if lower.ends_with(".java") { "java" }
    else if lower.ends_with(".sh") || lower.ends_with(".bash") { "shell" }
    else if lower.ends_with(".json") || lower.ends_with(".toml") || lower.ends_with(".yaml") || lower.ends_with(".yml") { "data" }
    else { "plain" }
}

fn keyword(lang: &str, word: &str) -> bool {
    const COMMON: &[&str] = &["if", "else", "for", "while", "loop", "match", "return", "break", "continue", "fn", "func", "class", "struct", "enum", "impl", "trait", "pub", "use", "mod", "let", "const", "static", "import", "from", "new", "try", "catch", "throw", "async", "await", "yield", "package", "var", "switch", "case"];
    COMMON.contains(&word) || (lang == "python" && ["def", "in", "is", "None", "True", "False"].contains(&word))
}
fn type_name(_lang: &str, word: &str) -> bool {
    ["String", "str", "bool", "boolean", "i32", "i64", "u32", "u64", "usize", "int", "float", "f32", "f64", "void", "char", "Self", "Option", "Result", "Vec"].contains(&word)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn highlights_rust_tokens_without_dependencies() {
        let spans = highlight_line("src/main.rs", "let n: i32 = 42; // ok");
        assert!(spans.iter().any(|s| s.content == "let"));
        assert!(spans.iter().any(|s| s.content == "42"));
        assert!(spans.iter().any(|s| s.content.starts_with("//")));
    }
    #[test] fn preserves_strings_with_escaped_quotes() {
        let spans = highlight_line("x.py", "print(\"a\\\"b\")");
        assert!(spans.iter().any(|s| s.content.contains("a\\\"b")));
    }
}
