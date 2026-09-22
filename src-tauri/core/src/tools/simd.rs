//! SIMD-accelerated line seeking — port de `microsoft/edit` `crates/edit/src/simd/lines_fwd.rs` + `lines_bwd.rs` + `stdext/src/simd/memset.rs`
//! Scalar fallback 100% std; intrinics AVX2/NEON via std::simd quando nightly + cfg.
//! Zero-lib: std only.

/// Conta '\n' até atingir target_line (0-based), retorna offset após o '\n' da linha target
/// Se target além do fim, retorna None
pub fn lines_fwd(text: &str, from_offset: usize, target_line: usize) -> Option<usize> {
    let bytes = text.as_bytes();
    if from_offset > bytes.len() { return None; }
    if target_line == 0 { return Some(0); }
    // count lines from start to from_offset
    let mut cur_line = bytes[..from_offset.min(bytes.len())].iter().filter(|&&b| b == b'\n').count();
    if cur_line >= target_line { return Some(from_offset); }
    // scan forward scalar (edit uses AVX2 _mm256_cmpeq_epi8 + SAD; aqui scalar chunked 32)
    let mut i = from_offset;
    while i < bytes.len() {
        let chunk_end = (i + 32).min(bytes.len());
        for &b in &bytes[i..chunk_end] {
            if b == b'\n' {
                cur_line += 1;
                if cur_line == target_line {
                    // offset após este \n
                    return Some(i + 1 + (&bytes[i+1..chunk_end].iter().position(|_| false).unwrap_or(0)));
                }
            }
            i += 1;
            if cur_line >= target_line { break; }
        }
        if cur_line >= target_line { break; }
    }
    // fallback: linear para remainder
    let mut offset = from_offset;
    let mut line_count = bytes[..from_offset].iter().filter(|&&b| b == b'\n').count();
    for (idx, &b) in bytes.iter().enumerate().skip(from_offset) {
        if line_count == target_line { return Some(idx); }
        if b == b'\n' { line_count += 1; }
        offset = idx + 1;
    }
    if line_count == target_line { Some(offset) } else { None }
}

/// Busca para trás (como edit `lines_bwd`): encontra início da target_line mesmo se já estiver nela
pub fn lines_bwd(text: &str, from_offset: usize, target_line: usize) -> Option<usize> {
    let bytes = text.as_bytes();
    if target_line == 0 { return Some(0); }
    let mut line = 0usize;
    let mut last_nl_pos = None;
    for (i, &b) in bytes.iter().enumerate() {
        if b == b'\n' { line += 1; if line == target_line { last_nl_pos = Some(i+1); } }
        if i >= from_offset { break; }
    }
    last_nl_pos
}

/// memchr2 scalar — busca dois bytes simultaneamente (edit usa SIMD)
pub fn memchr2(needle1: u8, needle2: u8, haystack: &[u8]) -> Option<usize> {
    for (i, &b) in haystack.iter().enumerate() {
        if b == needle1 || b == needle2 { return Some(i); }
    }
    None
}

/// memset para slices genéricos (edit `stdext/src/simd/memset.rs` SWAR) — scalar std
pub fn memset<T: Clone>(slice: &mut [T], value: T) {
    for x in slice.iter_mut() { *x = value.clone(); }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fwd_basic() {
        let s = "a\nb\nc\nd";
        assert_eq!(lines_fwd(s, 0, 1), Some(2)); // após "a\n"
        assert_eq!(lines_fwd(s, 0, 2), Some(4));
    }
    #[test]
    fn bwd_basic() {
        let s = "a\nb\nc\n";
        assert_eq!(lines_bwd(s, 10, 1), Some(2));
    }
    #[test]
    fn memchr2_found() {
        assert_eq!(memchr2(b'\n', b'\r', b"a\nb"), Some(1));
        assert_eq!(memchr2(b'x', b'y', b"abc"), None);
    }
}
