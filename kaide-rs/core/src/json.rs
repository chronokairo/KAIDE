//! Zero-Lib JSON Serialization — std-only replacement for serde/serde_json
//! 
//! Provides Serialize/Deserialize traits and Value type without proc-macros.
//! Types implement Serialize/Deserialize manually (no derive macros).

use std::collections::BTreeMap;
use std::fmt;
use std::ops::{Index, IndexMut};

/// JSON Value type (equivalent to serde_json::Value)
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    Number(Number),
    String(String),
    Array(Vec<Value>),
    Object(BTreeMap<String, Value>),
}

/// JSON Number type
#[derive(Debug, Clone, PartialEq)]
pub struct Number {
    inner: String,
}

impl Number {
    pub fn from_f64(n: f64) -> Option<Self> {
        if n.is_finite() {
            Some(Self { inner: n.to_string() })
        } else {
            None
        }
    }
    pub fn from_i64(n: i64) -> Self { Self { inner: n.to_string() } }
    pub fn from_u64(n: u64) -> Self { Self { inner: n.to_string() } }
    pub fn as_f64(&self) -> Option<f64> { self.inner.parse().ok() }
    pub fn as_i64(&self) -> Option<i64> { self.inner.parse().ok() }
    pub fn as_u64(&self) -> Option<u64> { self.inner.parse().ok() }
}

impl fmt::Display for Number {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.inner) }
}

impl Value {
    pub fn null() -> Self { Value::Null }
    pub fn bool(b: bool) -> Self { Value::Bool(b) }
    pub fn number<N: Into<Number>>(n: N) -> Self { Value::Number(n.into()) }
    pub fn string<S: Into<String>>(s: S) -> Self { Value::String(s.into()) }
    pub fn array<A: Into<Vec<Value>>>(a: A) -> Self { Value::Array(a.into()) }
    pub fn object<O: Into<BTreeMap<String, Value>>>(o: O) -> Self { Value::Object(o.into()) }

    pub fn get(&self, key: &str) -> Option<&Value> {
        if let Value::Object(map) = self { map.get(key) } else { None }
    }
    pub fn get_mut(&mut self, key: &str) -> Option<&mut Value> {
        if let Value::Object(map) = self { map.get_mut(key) } else { None }
    }
    pub fn as_object_mut(&mut self) -> Option<&mut BTreeMap<String, Value>> {
        if let Value::Object(map) = self { Some(map) } else { None }
    }
    pub fn as_bool(&self) -> Option<bool> { if let Value::Bool(b) = self { Some(*b) } else { None } }
    pub fn as_f64(&self) -> Option<f64> { if let Value::Number(n) = self { n.as_f64() } else { None } }
    pub fn as_i64(&self) -> Option<i64> { if let Value::Number(n) = self { n.as_i64() } else { None } }
    pub fn as_u64(&self) -> Option<u64> { if let Value::Number(n) = self { n.as_u64() } else { None } }
    pub fn as_str(&self) -> Option<&str> { if let Value::String(s) = self { Some(s) } else { None } }
    pub fn as_array(&self) -> Option<&[Value]> { if let Value::Array(a) = self { Some(a) } else { None } }
    pub fn is_array(&self) -> bool { matches!(self, Value::Array(_)) }
    pub fn as_array_mut(&mut self) -> Option<&mut Vec<Value>> { if let Value::Array(a) = self { Some(a) } else { None } }
    pub fn as_object(&self) -> Option<&BTreeMap<String, Value>> { if let Value::Object(o) = self { Some(o) } else { None } }
    pub fn is_null(&self) -> bool { matches!(self, Value::Null) }
}

static NULL_VALUE: Value = Value::Null;

impl Index<&str> for Value {
    type Output = Value;
    fn index(&self, key: &str) -> &Self::Output { self.get(key).unwrap_or(&NULL_VALUE) }
}

impl Index<usize> for Value {
    type Output = Value;
    fn index(&self, index: usize) -> &Self::Output {
        match self { Value::Array(values) => values.get(index).unwrap_or(&NULL_VALUE), _ => &NULL_VALUE }
    }
}

impl IndexMut<&str> for Value {
    fn index_mut(&mut self, key: &str) -> &mut Self::Output {
        match self { Value::Object(map) => map.entry(key.to_string()).or_insert(Value::Null), _ => panic!("cannot index non-object JSON value") }
    }
}

/// Serialize trait (equivalent to serde::Serialize)
pub trait Serialize {
    fn to_json(&self) -> Value;
    fn to_json_string(&self) -> String { to_string(&self.to_json()) }
}

/// Deserialize trait (equivalent to serde::Deserialize)
pub trait Deserialize: Sized {
    fn from_json(val: &Value) -> Result<Self, Error>;
    fn from_json_string(s: &str) -> Result<Self, Error> {
        let v = from_str(s)?;
        Self::from_json(&v)
    }
}

/// JSON Error type
#[derive(Debug, Clone)]
pub struct Error(pub String);

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "JSON error: {}", self.0) }
}
impl std::error::Error for Error {}

/// Convert Value to JSON string
pub fn to_string(val: &Value) -> String {
    struct Serializer;
    impl Serializer {
        fn write_val(&self, v: &Value, out: &mut String, depth: usize) {
            match v {
                Value::Null => out.push_str("null"),
                Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
                Value::Number(n) => out.push_str(&n.inner),
                Value::String(s) => { out.push('"'); out.push_str(&Serializer.escape_str(s)); out.push('"'); }
                Value::Array(arr) => {
                    out.push('[');
                    for (i, v) in arr.iter().enumerate() {
                        if i > 0 { out.push(','); }
                        self.write_val(v, out, depth + 1);
                    }
                    out.push(']');
                }
                Value::Object(obj) => {
                    out.push('{');
                    for (i, (k, v)) in obj.iter().enumerate() {
                        if i > 0 { out.push(','); }
                        out.push('"'); out.push_str(&Serializer.escape_str(k)); out.push_str("\":");
                        self.write_val(v, out, depth + 1);
                    }
                    out.push('}');
                }
            }
        }
        fn escape_str(&self, s: &str) -> String {
            s.chars().map(|c| match c {
                '"' => "\\\"".to_string(),
                '\\' => "\\\\".to_string(),
                '\n' => "\\n".to_string(),
                '\r' => "\\r".to_string(),
                '\t' => "\\t".to_string(),
                c if c.is_control() => format!("\\u{:04x}", c as u32),
                c => c.to_string(),
            }).collect()
        }
    }
    let mut out = String::new();
    Serializer.write_val(val, &mut out, 0);
    out
}

/// Byte-oriented helpers matching the common serde_json call sites.
pub fn to_vec(val: &Value) -> Vec<u8> { to_string(val).into_bytes() }
pub fn to_string_pretty(val: &Value) -> String { to_string(val) }
pub fn from_slice(bytes: &[u8]) -> Result<Value, Error> {
    let text = std::str::from_utf8(bytes).map_err(|e| Error(e.to_string()))?;
    from_str(text)
}

/// Parse JSON string to Value
pub fn from_str(s: &str) -> Result<Value, Error> {
    let mut parser = Parser::new(s);
    let value = parser.parse_value()?;
    parser.skip_ws();
    if parser.peek().is_some() {
        return Err(Error("trailing data after JSON value".into()));
    }
    Ok(value)
}

struct Parser<'a> {
    s: &'a str,
    i: usize,
}

impl<'a> Parser<'a> {
    fn new(s: &'a str) -> Self { Self { s, i: 0 } }
    fn peek(&self) -> Option<char> { self.s[self.i..].chars().next() }
    fn next(&mut self) -> Option<char> { let c = self.peek()?; self.i += c.len_utf8(); Some(c) }
    fn skip_ws(&mut self) { while matches!(self.peek(), Some(c) if c.is_whitespace()) { self.next(); } }
    fn expect(&mut self, c: char) -> Result<(), Error> {
        if self.next() == Some(c) { Ok(()) } else { Err(Error(format!("expected '{}'", c))) }
    }
    fn parse_value(&mut self) -> Result<Value, Error> {
        self.skip_ws();
        match self.peek() {
            Some('n') => { self.expect('n')?; self.expect('u')?; self.expect('l')?; self.expect('l')?; Ok(Value::Null) }
            Some('t') => { self.expect('t')?; self.expect('r')?; self.expect('u')?; self.expect('e')?; Ok(Value::Bool(true)) }
            Some('f') => { self.expect('f')?; self.expect('a')?; self.expect('l')?; self.expect('s')?; self.expect('e')?; Ok(Value::Bool(false)) }
            Some('"') => { self.next(); Ok(Value::String(self.parse_string()?)) }
            Some('[') => { self.next(); self.parse_array() }
            Some('{') => { self.next(); self.parse_object() }
            Some(c) if c.is_ascii_digit() || c == '-' => self.parse_number(),
            _ => Err(Error("unexpected character".into())),
        }
    }
    fn parse_string(&mut self) -> Result<String, Error> {
        let mut out = String::new();
        while let Some(c) = self.next() {
            match c {
                '"' => return Ok(out),
                '\\' => {
                    let c = self.next().ok_or_else(|| Error("unterminated escape".into()))?;
                    out.push(match c {
                        '"' => '"', '\\' => '\\', '/' => '/', 'n' => '\n', 'r' => '\r', 't' => '\t', 'b' => '\u{08}', 'f' => '\u{0c}',
                        'u' => {
                            let mut hex = String::new();
                            for _ in 0..4 { hex.push(self.next().ok_or_else(|| Error("unicode escape".into()))?); }
                            char::from_u32(u32::from_str_radix(&hex, 16).map_err(|_| Error("invalid unicode".into()))?).ok_or_else(|| Error("invalid codepoint".into()))?
                        }
                        c => c,
                    });
                }
                c => out.push(c),
            }
        }
        Err(Error("unterminated string".into()))
    }
    fn parse_number(&mut self) -> Result<Value, Error> {
        let start = self.i;
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || c == '.' || c == '-' || c == '+' || c == 'e' || c == 'E' { self.next(); } else { break; }
        }
        let num_str = &self.s[start..self.i];
        Ok(Value::Number(Number { inner: num_str.to_string() }))
    }
    fn parse_array(&mut self) -> Result<Value, Error> {
        let mut arr = Vec::new();
        self.skip_ws();
        if self.peek() == Some(']') { self.next(); return Ok(Value::Array(arr)); }
        loop {
            arr.push(self.parse_value()?);
            self.skip_ws();
            match self.peek() {
                Some(',') => { self.next(); continue; }
                Some(']') => { self.next(); return Ok(Value::Array(arr)); }
                _ => return Err(Error("expected ',' or ']'" .into())),
            }
        }
    }
    fn parse_object(&mut self) -> Result<Value, Error> {
        let mut obj = BTreeMap::new();
        self.skip_ws();
        if self.peek() == Some('}') { self.next(); return Ok(Value::Object(obj)); }
        loop {
            self.skip_ws();
            let key = if let Some('"') = self.peek() { self.next(); self.parse_string()? } else { return Err(Error("expected string key".into())); };
            self.skip_ws();
            self.expect(':')?;
            let val = self.parse_value()?;
            obj.insert(key, val);
            self.skip_ws();
            match self.peek() {
                Some(',') => { self.next(); continue; }
                Some('}') => { self.next(); return Ok(Value::Object(obj)); }
                _ => return Err(Error("expected ',' or '}'" .into())),
            }
        }
    }
}

// Macro for constructing JSON objects easily (like serde_json::json!)
#[macro_export]
macro_rules! json {
    (null) => { $crate::json::Value::null() };
    ([]) => { $crate::json::Value::array(Vec::new()) };
    ([$($elem:tt),* $(,)?]) => { $crate::json::Value::array(vec![$($crate::json!($elem)),*]) };
    ({}) => { $crate::json::Value::object(std::collections::BTreeMap::new()) };
    ({$($key:tt : $val:tt),* $(,)?}) => {{
        #[allow(unused_mut)]
        let mut map = std::collections::BTreeMap::new();
        $( map.insert($key.to_string(), $crate::json!($val)); )*
        $crate::json::Value::object(map)
    }};
    ({$($key:literal : $val:expr),* $(,)?}) => {{
        #[allow(unused_mut)]
        let mut map = std::collections::BTreeMap::new();
        $( map.insert($key.to_string(), $crate::json::Value::from($val)); )*
        $crate::json::Value::object(map)
    }};
    ($key:literal : $val:tt) => { ($key.to_string(), $crate::json!($val)) };
    ($val:expr) => { $crate::json::Value::from($val) };
}

/// Object constructor for code that already has Rust expressions as values.
#[macro_export]
macro_rules! json_expr {
    ({}) => { $crate::json::Value::object(std::collections::BTreeMap::new()) };
    ({$($key:literal : $val:expr),* $(,)?}) => {{
        #[allow(unused_mut)]
        let mut map = std::collections::BTreeMap::new();
        $( map.insert($key.to_string(), $crate::json::Value::from($val)); )*
        $crate::json::Value::object(map)
    }};
}

// Implement Serialize for common types
impl Serialize for Value { fn to_json(&self) -> Value { self.clone() } }
impl From<bool> for Value { fn from(v: bool) -> Self { Value::Bool(v) } }
impl From<i32> for Value { fn from(v: i32) -> Self { Value::Number(Number::from_i64(v as i64)) } }
impl From<usize> for Value { fn from(v: usize) -> Self { Value::Number(Number::from_u64(v as u64)) } }
impl From<i64> for Value { fn from(v: i64) -> Self { Value::Number(Number::from_i64(v)) } }
impl From<u64> for Value { fn from(v: u64) -> Self { Value::Number(Number::from_u64(v)) } }
impl From<u32> for Value { fn from(v: u32) -> Self { Value::Number(Number::from_u64(v as u64)) } }
impl From<u128> for Value { fn from(v: u128) -> Self { Value::Number(Number::from_u64(v as u64)) } }
impl From<f64> for Value { fn from(v: f64) -> Self { Value::Number(Number::from_f64(v).unwrap_or(Number::from_i64(0))) } }
impl From<f32> for Value { fn from(v: f32) -> Self { Value::Number(Number::from_f64(v as f64).unwrap_or(Number::from_i64(0))) } }
impl From<&str> for Value { fn from(v: &str) -> Self { Value::String(v.to_string()) } }
impl From<&String> for Value { fn from(v: &String) -> Self { Value::String(v.clone()) } }
impl From<&bool> for Value { fn from(v: &bool) -> Self { Value::Bool(*v) } }
impl From<()> for Value { fn from(_: ()) -> Self { Value::Null } }
impl From<std::borrow::Cow<'_, str>> for Value { fn from(v: std::borrow::Cow<'_, str>) -> Self { Value::String(v.into_owned()) } }
impl<T: Into<Value>, const N: usize> From<[T; N]> for Value {
    fn from(v: [T; N]) -> Self { Value::array(v.into_iter().map(Into::into).collect::<Vec<Value>>()) }
}
impl From<String> for Value { fn from(v: String) -> Self { Value::String(v) } }
impl From<std::path::PathBuf> for Value { fn from(v: std::path::PathBuf) -> Self { Value::String(v.to_string_lossy().into_owned()) } }
impl From<&Value> for Value { fn from(v: &Value) -> Self { v.clone() } }
impl From<Vec<String>> for Value {
    fn from(values: Vec<String>) -> Self {
        Value::array(values.into_iter().map(Value::String).collect::<Vec<_>>())
    }
}
impl From<Vec<Value>> for Value { fn from(values: Vec<Value>) -> Self { Value::array(values) } }
impl<T: Into<Value>> From<Option<T>> for Value {
    fn from(value: Option<T>) -> Self {
        value.map(Into::into).unwrap_or(Value::Null)
    }
}
impl Serialize for bool { fn to_json(&self) -> Value { Value::Bool(*self) } }
impl Serialize for i8 { fn to_json(&self) -> Value { Value::Number(Number::from_i64(*self as i64)) } }
impl Serialize for i16 { fn to_json(&self) -> Value { Value::Number(Number::from_i64(*self as i64)) } }
impl Serialize for i32 { fn to_json(&self) -> Value { Value::Number(Number::from_i64(*self as i64)) } }
impl Serialize for i64 { fn to_json(&self) -> Value { Value::Number(Number::from_i64(*self)) } }
impl Serialize for u8 { fn to_json(&self) -> Value { Value::Number(Number::from_u64(*self as u64)) } }
impl Serialize for u16 { fn to_json(&self) -> Value { Value::Number(Number::from_u64(*self as u64)) } }
impl Serialize for u32 { fn to_json(&self) -> Value { Value::Number(Number::from_u64(*self as u64)) } }
impl Serialize for u64 { fn to_json(&self) -> Value { Value::Number(Number::from_u64(*self)) } }
impl Serialize for f32 { fn to_json(&self) -> Value { Value::Number(Number::from_f64(*self as f64).unwrap_or(Number::from_i64(0))) } }
impl Serialize for f64 { fn to_json(&self) -> Value { Value::Number(Number::from_f64(*self).unwrap_or(Number::from_i64(0))) } }
impl Serialize for &str { fn to_json(&self) -> Value { Value::String(self.to_string()) } }
impl Serialize for String { fn to_json(&self) -> Value { Value::String(self.clone()) } }
impl<T: Serialize> Serialize for Option<T> { fn to_json(&self) -> Value { match self { Some(v) => v.to_json(), None => Value::Null } } }
impl<T: Serialize> Serialize for Vec<T> { fn to_json(&self) -> Value { Value::Array(self.iter().map(|v| v.to_json()).collect()) } }
impl<K: ToString, V: Serialize> Serialize for BTreeMap<K, V> { fn to_json(&self) -> Value { Value::Object(self.iter().map(|(k,v)| (k.to_string(), v.to_json())).collect()) } }
impl<K: ToString, V: Serialize> Serialize for std::collections::HashMap<K, V> { fn to_json(&self) -> Value { Value::Object(self.iter().map(|(k,v)| (k.to_string(), v.to_json())).collect()) } }

// Deserialize implementations
macro_rules! deserialize_primitive {
    ($t:ty, $method:ident) => {
        impl Deserialize for $t {
            fn from_json(val: &Value) -> Result<Self, Error> {
                val.$method().ok_or_else(|| Error(format!("expected {}", stringify!($t))))
            }
        }
    };
}

deserialize_primitive!(bool, as_bool);
impl Deserialize for i8 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_i64().and_then(|n| i8::try_from(n).ok()).ok_or_else(|| Error("expected i8".into())) } }
impl Deserialize for i16 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_i64().and_then(|n| i16::try_from(n).ok()).ok_or_else(|| Error("expected i16".into())) } }
impl Deserialize for i32 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_i64().and_then(|n| i32::try_from(n).ok()).ok_or_else(|| Error("expected i32".into())) } }
deserialize_primitive!(i64, as_i64);
impl Deserialize for u8 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_u64().and_then(|n| u8::try_from(n).ok()).ok_or_else(|| Error("expected u8".into())) } }
impl Deserialize for u16 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_u64().and_then(|n| u16::try_from(n).ok()).ok_or_else(|| Error("expected u16".into())) } }
impl Deserialize for u32 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_u64().and_then(|n| u32::try_from(n).ok()).ok_or_else(|| Error("expected u32".into())) } }
impl Deserialize for u64 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_u64().ok_or_else(|| Error("expected u64".into())) } }
impl Deserialize for f32 { fn from_json(v: &Value) -> Result<Self, Error> { v.as_f64().map(|n| n as f32).ok_or_else(|| Error("expected f32".into())) } }
deserialize_primitive!(f64, as_f64);

impl Deserialize for String {
    fn from_json(val: &Value) -> Result<Self, Error> {
        val.as_str().map(|s| s.to_string()).ok_or_else(|| Error("expected string".into()))
    }
}

impl<T: Deserialize> Deserialize for Option<T> {
    fn from_json(val: &Value) -> Result<Self, Error> {
        if val.is_null() { Ok(None) } else { T::from_json(val).map(Some) }
    }
}

impl<T: Deserialize> Deserialize for Vec<T> {
    fn from_json(val: &Value) -> Result<Self, Error> {
        let arr = val.as_array().ok_or_else(|| Error("expected array".into()))?;
        arr.iter().map(T::from_json).collect()
    }
}

impl<K: std::str::FromStr + Ord, V: Deserialize> Deserialize for BTreeMap<K, V> {
    fn from_json(val: &Value) -> Result<Self, Error> {
        let obj = val.as_object().ok_or_else(|| Error("expected object".into()))?;
        obj.iter().map(|(k,v)| Ok((k.parse().map_err(|_| Error("invalid key".into()))?, V::from_json(v)?))).collect()
    }
}

impl<K: std::str::FromStr + Eq + std::hash::Hash, V: Deserialize> Deserialize for std::collections::HashMap<K, V> {
    fn from_json(val: &Value) -> Result<Self, Error> {
        let obj = val.as_object().ok_or_else(|| Error("expected object".into()))?;
        obj.iter().map(|(k,v)| Ok((k.parse().map_err(|_| Error("invalid key".into()))?, V::from_json(v)?))).collect()
    }
}

impl Deserialize for Value {
    fn from_json(val: &Value) -> Result<Self, Error> { Ok(val.clone()) }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn serde_roundtrip() {
        let v = json!({"a": 1, "b": [true, false], "c": "hello"});
        let s = v.to_json_string();
        let v2 = Value::from_json_string(&s).unwrap();
        assert_eq!(v, v2);
    }
    #[test] fn parse_number() {
        let v = from_str("42").unwrap();
        assert_eq!(v.as_i64(), Some(42));
        let v = from_str("-3.14").unwrap();
        assert_eq!(v.as_f64(), Some(-3.14));
    }
    #[test] fn parse_string() {
        let v = from_str(r#""hello\nworld""#).unwrap();
        assert_eq!(v.as_str(), Some("hello\nworld"));
    }
    #[test] fn parse_array() {
        let v = from_str("[1,2,3]").unwrap();
        assert_eq!(v.as_array().unwrap().len(), 3);
    }
    #[test] fn parse_object() {
        let v = from_str(r#"{"a":1,"b":2}"#).unwrap();
        assert_eq!(v.get("a").unwrap().as_i64(), Some(1));
    }
    #[test] fn macro_json() {
        let v = json!({"a": 1, "b": [true, "x"]});
        assert_eq!(v.get("a").unwrap().as_i64(), Some(1));
    }
}
