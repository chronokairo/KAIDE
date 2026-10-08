//! Test-only compatibility facade retained while external JSON dependencies are absent.
pub use crate::json::Value;
#[allow(unused_imports)]
pub use crate::json as json;

pub fn to_value<T: crate::json::Serialize>(value: T) -> Result<Value, crate::json::Error> {
    Ok(value.to_json())
}

pub fn from_str<T: crate::json::Deserialize>(source: &str) -> Result<T, crate::json::Error> {
    T::from_json_string(source)
}

pub fn from_slice<T: crate::json::Deserialize>(source: &[u8]) -> Result<T, crate::json::Error> {
    let text = std::str::from_utf8(source).map_err(|error| crate::json::Error(error.to_string()))?;
    from_str(text)
}

pub fn to_string<T: crate::json::Serialize>(value: &T) -> Result<String, crate::json::Error> {
    Ok(value.to_json_string())
}
