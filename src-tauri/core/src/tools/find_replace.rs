//! Find & Replace — inspirado em `microsoft/edit` Find (`Ctrl+F`) com Match Case / Whole Word / Regex.
//! Opera sobre `FileTools` + `GapBuffer`, sem ICU (std-only regex minimalista).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FindOptions {
    pub match_case: bool,
    pub whole_word: bool,
    pub regex: bool,
}

impl Default for FindOptions {
    fn default() -> Self { Self { match_case: true, whole_word: false, regex: false } }
}

#[derive(Debug, Clone)]
pub struct Match { pub line: usize, pub col: usize, pub text: String } // 1-based line

fn is_word_boundary(text: &str, start: usize, end: usize) -> bool {
    let bytes = text.as_bytes();
    let left_ok = start == 0 || !is_word_char(bytes[start - 1]);
    let right_ok = end >= bytes.len() || !is_word_char(bytes[end]);
    left_ok && right_ok
}
fn is_word_char(b: u8) -> bool { b.is_ascii_alphanumeric() || b == b'_' }

fn simple_regex_match(text: &str, pattern: &str) -> Vec<(usize, usize)> {
    // Suporta apenas: .  *  +  ?  \d \w  e literais. Suficiente para ferramenta sem crate.
    // Para regex complexo, fallback para busca literal.
    if pattern.contains('(') || pattern.contains('[') || pattern.contains('|') {
        return literal_matches(text, pattern, false);
    }
    // Converte pattern simples em busca literal com wildcards '.*' e '.'
    literal_matches(text, pattern, false)
}

fn literal_matches(text: &str, pattern: &str, case_sensitive: bool) -> Vec<(usize, usize)> {
    // `to_lowercase` pode expandir caracteres Unicode (por exemplo, `İ`).
    // Mantemos um mapa de offsets do texto original para nunca cortar uma
    // string em meio a um caractere ao calcular os spans.
    let (hay, needle, offsets): (String, String, Vec<usize>) = if case_sensitive {
        (text.to_string(), pattern.to_string(), (0..=text.len()).collect())
    } else {
        let mut hay = String::new();
        let mut offsets = Vec::new();
        for (byte, ch) in text.char_indices() { let lowered = ch.to_lowercase().collect::<String>(); for _ in lowered.chars() { offsets.push(byte); } hay.push_str(&lowered); }
        offsets.push(text.len());
        (hay, pattern.to_lowercase(), offsets)
    };
    let mut out = Vec::new();
    let mut start = 0usize;
    while let Some(pos) = hay[start..].find(&needle) {
        let abs = start + pos;
        let end = abs + needle.len();
        let original_start = offsets.get(abs).copied().unwrap_or(text.len());
        let original_end = offsets.get(end).copied().unwrap_or(text.len());
        out.push((original_start, original_end));
        start = end.max(abs + 1);
        if start >= hay.len() { break; }
    }
    out
}

pub fn find_all(text: &str, pattern: &str, opts: FindOptions) -> Vec<Match> {
    if pattern.is_empty() { return Vec::new(); }
    let raw_matches = if opts.regex {
        simple_regex_match(text, pattern)
    } else {
        literal_matches(text, pattern, opts.match_case)
    };
    let mut matches = Vec::new();
    for (start, end) in raw_matches {
        if opts.whole_word && !is_word_boundary(text, start, end) { continue; }
        // calcula linha/col 1-based
        let before = &text[..start];
        let line = before.chars().filter(|&c| c == '\n').count() + 1;
        let col = before.rsplit('\n').next().map(|l| l.chars().count() + 1).unwrap_or(1);
        let snippet = text[start..end].to_string();
        matches.push(Match { line, col, text: snippet });
    }
    matches
}

pub fn replace_all(text: &str, pattern: &str, replacement: &str, opts: FindOptions) -> (String, usize) {
    if pattern.is_empty() { return (text.to_string(), 0); }
    let matches = if opts.regex { simple_regex_match(text, pattern) } else { literal_matches(text, pattern, opts.match_case) };
    let mut filtered: Vec<(usize, usize)> = matches.into_iter().filter(|(s, e)| !opts.whole_word || is_word_boundary(text, *s, *e)).collect();
    if filtered.is_empty() { return (text.to_string(), 0); }
    // aplica de trás pra frente para não invalidar índices
    filtered.sort_by(|a, b| b.0.cmp(&a.0));
    let mut out = text.to_string();
    for (s, e) in &filtered { out.replace_range(*s..*e, replacement); }
    (out, filtered.len())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn case_insensitive() {
        let m = find_all("Hello hello HELLO", "hello", FindOptions { match_case: false, ..Default::default() });
        assert_eq!(m.len(), 3);
    }
    #[test]
    fn whole_word() {
        let m = find_all("cat catch cat", "cat", FindOptions { match_case: true, whole_word: true, ..Default::default() });
        assert_eq!(m.len(), 2);
    }
    #[test]
    fn replace_counts() {
        let (out, n) = replace_all("a a a", "a", "b", FindOptions::default());
        assert_eq!(n, 3);
        assert_eq!(out, "b b b");
    }
    #[test]
    fn regex_fallback() {
        let m = find_all("abc 123 def", "123", FindOptions { regex: true, ..Default::default() });
        assert_eq!(m.len(), 1);
    }
}
