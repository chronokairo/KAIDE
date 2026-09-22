//! JSONC parser — port de `microsoft/edit` `crates/edit/src/json.rs`
//! Suporta comentários C-style (// e /* */) e trailing commas.
//! Zero-lib: std only, sem serde.

#[derive(Debug, Clone, PartialEq)]
pub enum JsoncValue {
    Null,
    Bool(bool),
    Number(String),
    String(String),
    Array(Vec<JsoncValue>),
    Object(Vec<(String, JsoncValue)>),
}

#[derive(Debug)]
pub struct ParseError(pub String);

fn skip_ws_and_comments(s: &str, mut i: usize) -> usize {
    let bytes = s.as_bytes();
    while i < bytes.len() {
        if bytes[i].is_ascii_whitespace() { i += 1; }
        else if s[i..].starts_with("//") {
            i += 2;
            while i < bytes.len() && bytes[i] != b'\n' { i += 1; }
        }
        else if s[i..].starts_with("/*") {
            i += 2;
            while i < bytes.len() && !s[i..].starts_with("*/") { i += 1; }
            i += 2;
        }
        else { break; }
    }
    i
}

fn parse_string(s: &str, i: usize) -> Result<(String, usize), ParseError> {
    if s.as_bytes().get(i) != Some(&b'"') { return Err(ParseError("expected '\"'".into())); }
    let mut out = String::new();
    let mut idx = i + 1;
    let bytes = s.as_bytes();
    while idx < bytes.len() {
        match bytes[idx] {
            b'"' => return Ok((out, idx + 1)),
            b'\\' => {
                idx += 1;
                if idx >= bytes.len() { break; }
                match bytes[idx] {
                    b'"' => out.push('"'),
                    b'\\' => out.push('\\'),
                    b'/' => out.push('/'),
                    b'n' => out.push('\n'),
                    b'r' => out.push('\r'),
                    b't' => out.push('\t'),
                    b'u' => {
                        if idx + 4 < bytes.len() {
                            let hex = &s[idx+1..idx+5];
                            if let Ok(cp) = u32::from_str_radix(hex, 16) {
                                if let Some(ch) = char::from_u32(cp) { out.push(ch); }
                            }
                            idx += 4;
                        }
                    }
                    c => out.push(c as char),
                }
                idx += 1;
            }
            _ => {
                let ch = s[idx..].chars().next().unwrap();
                out.push(ch);
                idx += ch.len_utf8();
            }
        }
    }
    Err(ParseError("unterminated string".into()))
}

fn parse_value(s: &str, i: usize) -> Result<(JsoncValue, usize), ParseError> {
    let i = skip_ws_and_comments(s, i);
    if i >= s.len() { return Err(ParseError("unexpected eof".into())); }
    let b = s.as_bytes()[i];
    match b {
        b'"' => { let (v, j) = parse_string(s, i)?; Ok((JsoncValue::String(v), j)) }
        b'{' => parse_object(s, i),
        b'[' => parse_array(s, i),
        b't' if s[i..].starts_with("true") => Ok((JsoncValue::Bool(true), i+4)),
        b'f' if s[i..].starts_with("false") => Ok((JsoncValue::Bool(false), i+5)),
        b'n' if s[i..].starts_with("null") => Ok((JsoncValue::Null, i+4)),
        _ => {
            let mut j = i;
            while j < s.len() && !matches!(s.as_bytes()[j], b',' | b'}' | b']' | b'/' ) && !s.as_bytes()[j].is_ascii_whitespace() { j+=1; }
            let num = s[i..j].trim().to_string();
            if num.is_empty() { return Err(ParseError(format!("unexpected char {}", b as char))); }
            Ok((JsoncValue::Number(num), j))
        }
    }
}

fn parse_array(s: &str, i: usize) -> Result<(JsoncValue, usize), ParseError> {
    let mut j = i + 1;
    let mut out = Vec::new();
    loop {
        j = skip_ws_and_comments(s, j);
        if j < s.len() && s.as_bytes()[j] == b']' { return Ok((JsoncValue::Array(out), j+1)); }
        if j >= s.len() { return Err(ParseError("unterminated array".into())); }
        let (v, k) = parse_value(s, j)?;
        out.push(v);
        j = skip_ws_and_comments(s, k);
        if j < s.len() && s.as_bytes()[j] == b',' { j += 1; continue; }
        if j < s.len() && s.as_bytes()[j] == b']' { return Ok((JsoncValue::Array(out), j+1)); }
    }
}

fn parse_object(s: &str, i: usize) -> Result<(JsoncValue, usize), ParseError> {
    let mut j = i + 1;
    let mut out = Vec::new();
    loop {
        j = skip_ws_and_comments(s, j);
        if j < s.len() && s.as_bytes()[j] == b'}' { return Ok((JsoncValue::Object(out), j+1)); }
        if j >= s.len() { return Err(ParseError("unterminated object".into())); }
        let (key, k) = parse_string(s, j)?;
        j = skip_ws_and_comments(s, k);
        if s.as_bytes().get(j) != Some(&b':') { return Err(ParseError("expected ':'".into())); }
        j += 1;
        let (val, k2) = parse_value(s, j)?;
        out.push((key, val));
        j = skip_ws_and_comments(s, k2);
        if j < s.len() && s.as_bytes()[j] == b',' { j += 1; continue; }
        if j < s.len() && s.as_bytes()[j] == b'}' { return Ok((JsoncValue::Object(out), j+1)); }
    }
}

pub fn parse(s: &str) -> Result<JsoncValue, ParseError> {
    let (v, j) = parse_value(s, 0)?;
    let j = skip_ws_and_comments(s, j);
    if j != s.len() { return Err(ParseError(format!("trailing data at {}", j))); }
    Ok(v)
}

impl JsoncValue {
    pub fn get(&self, key: &str) -> Option<&JsoncValue> {
        if let JsoncValue::Object(pairs) = self { pairs.iter().find(|(k,_)| k==key).map(|(_,v)| v) } else { None }
    }
    pub fn as_str(&self) -> Option<&str> { if let JsoncValue::String(s)=self { Some(s) } else { None } }
    pub fn as_bool(&self) -> Option<bool> { if let JsoncValue::Bool(b)=self { Some(*b) } else { None } }
}

pub fn config_dir() -> std::path::PathBuf {
    if cfg!(windows) {
        if let Ok(appdata) = std::env::var("APPDATA") { return std::path::PathBuf::from(appdata).join("Microsoft").join("Edit"); }
    } else if cfg!(target_os = "macos") {
        if let Ok(home) = std::env::var("HOME") { return std::path::PathBuf::from(home).join("Library").join("Application Support").join("com.microsoft.edit"); }
    }
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") { return std::path::PathBuf::from(xdg).join("msedit"); }
    if let Ok(home) = std::env::var("HOME") { return std::path::PathBuf::from(home).join(".config").join("msedit"); }
    std::path::PathBuf::from(".")
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn jsonc_comments_trailing() {
        let s = r#"{
            // comment
            "a": 1, // trailing
            "b": [1, 2,],
            /* block */
            "c": true
        }"#;
        let v = parse(s).unwrap();
        assert_eq!(v.get("a").unwrap(), &JsoncValue::Number("1".into()));
        assert_eq!(v.get("c").unwrap().as_bool(), Some(true));
    }
    #[test]
    fn jsonc_string_escape() {
        let v = parse(r#"{"k":"a\nb"}"#).unwrap();
        assert_eq!(v.get("k").unwrap().as_str(), Some("a\nb"));
    }
}
