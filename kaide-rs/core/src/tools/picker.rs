//! File picker `Ctrl+P` — inspirado em `microsoft/edit` multi-file + `Ctrl+P`.
//! Busca fuzzy sobre workspace com autocompletion (prefix + substring rank).

#[derive(Debug, Clone)]
pub struct PickerMatch { pub path: String, pub score: i32 }

fn fuzzy_score(query: &str, candidate: &str) -> Option<i32> {
    if query.is_empty() { return Some(0); }
    let q = query.to_lowercase();
    let c = candidate.to_lowercase();
    // prefix bonus
    if c.starts_with(&q) { return Some(1000 - candidate.len() as i32); }
    if c.contains(&q) { return Some(500 - candidate.len() as i32); }
    // fuzzy subsequence
    let mut ci = 0usize;
    let mut score = 0i32;
    let c_chars: Vec<char> = c.chars().collect();
    for qc in q.chars() {
        let mut found = false;
        while ci < c_chars.len() {
            if c_chars[ci] == qc { score += 10; found = true; ci += 1; break; }
            score -= 1;
            ci += 1;
        }
        if !found { return None; }
    }
    Some(score)
}

pub fn pick(query: &str, files: &[String], limit: usize) -> Vec<PickerMatch> {
    let mut scored: Vec<PickerMatch> = files.iter().filter_map(|f| {
        fuzzy_score(query, f).map(|score| PickerMatch { path: f.clone(), score })
    }).collect();
    scored.sort_by(|a, b| b.score.cmp(&a.score).then(a.path.cmp(&b.path)));
    scored.truncate(limit);
    scored
}

/// Autocompletion para diálogos Open/Save — como `edit#185` filename completion.
pub fn autocomplete_prefix(prefix: &str, files: &[String]) -> Vec<String> {
    let mut matches: Vec<String> = files.iter().filter(|f| f.starts_with(prefix)).cloned().collect();
    matches.sort();
    matches.truncate(20);
    matches
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn prefix_first() {
        let files = vec!["src/main.rs".into(), "src/lib.rs".into(), "README.md".into()];
        let m = pick("src/m", &files, 10);
        assert_eq!(m[0].path, "src/main.rs");
    }
    #[test]
    fn autocomplete() {
        let files = vec!["a.txt".into(), "a/b.txt".into(), "b.txt".into()];
        let ac = autocomplete_prefix("a", &files);
        assert_eq!(ac.len(), 2);
    }
}
