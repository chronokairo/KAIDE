//! RFC 4648 standard alphabet, with canonical padding and strict decoding.
use std::fmt;

const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

pub fn encode(input: impl AsRef<[u8]>) -> String {
    let input = input.as_ref();
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let a = chunk[0];
        let b = chunk.get(1).copied().unwrap_or(0);
        let c = chunk.get(2).copied().unwrap_or(0);
        out.push(ALPHABET[(a >> 2) as usize] as char);
        out.push(ALPHABET[((a & 3) << 4 | b >> 4) as usize] as char);
        out.push(if chunk.len() > 1 { ALPHABET[((b & 15) << 2 | c >> 6) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { ALPHABET[(c & 63) as usize] as char } else { '=' });
    }
    out
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DecodeError;
impl fmt::Display for DecodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.write_str("invalid canonical base64") }
}
impl std::error::Error for DecodeError {}

fn digit(byte: u8) -> Result<u8, DecodeError> {
    match byte {
        b'A'..=b'Z' => Ok(byte - b'A'),
        b'a'..=b'z' => Ok(byte - b'a' + 26),
        b'0'..=b'9' => Ok(byte - b'0' + 52),
        b'+' => Ok(62), b'/' => Ok(63), _ => Err(DecodeError),
    }
}

pub fn decode(input: impl AsRef<[u8]>) -> Result<Vec<u8>, DecodeError> {
    let input = input.as_ref();
    if input.len() % 4 != 0 { return Err(DecodeError); }
    let mut out = Vec::with_capacity(input.len() / 4 * 3);
    for (i, c) in input.chunks_exact(4).enumerate() {
        let a = digit(c[0])?;
        let b = digit(c[1])?;
        let last = (i + 1) * 4 == input.len();
        out.push(a << 2 | b >> 4);
        if c[2] == b'=' {
            if !last || c[3] != b'=' || b & 15 != 0 { return Err(DecodeError); }
        } else {
            let d = digit(c[2])?;
            out.push(b << 4 | d >> 2);
            if c[3] == b'=' {
                if !last || d & 3 != 0 { return Err(DecodeError); }
            } else { out.push(d << 6 | digit(c[3])?); }
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rfc4648_vectors() {
        for (raw, encoded) in [("", ""), ("f", "Zg=="), ("fo", "Zm8="), ("foo", "Zm9v"), ("foob", "Zm9vYg=="), ("fooba", "Zm9vYmE="), ("foobar", "Zm9vYmFy")] {
            assert_eq!(encode(raw), encoded);
            assert_eq!(decode(encoded).unwrap(), raw.as_bytes());
        }
    }
    #[test]
    fn binary_roundtrips() {
        let data: Vec<u8> = (0..=255).collect();
        for n in 0..=data.len() { assert_eq!(decode(encode(&data[..n])).unwrap(), data[..n]); }
    }
    #[test]
    fn rejects_invalid_padding_and_trailing_bits() {
        for invalid in ["Zg", "Zg=", "Zh==", "Zm9=", "=m9v", "Zg==AAAA", "Zg===", "Zg==\n", "Zm-_"] {
            assert!(decode(invalid).is_err(), "{invalid}");
        }
    }
}
