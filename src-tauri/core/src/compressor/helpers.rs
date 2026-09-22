//! Pure std helpers for pattern replacements without regex.

pub fn is_base64_url_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '-' || c == '_'
}

/// Replace occurrences of ISO timestamp `YYYY-MM-DDTHH:MM:SS` with `<TS>`
pub fn replace_timestamps(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if i + 19 <= bytes.len() {
            let chunk = &bytes[i..i + 19];
            if chunk[0..4].iter().all(|b| b.is_ascii_digit())
                && chunk[4] == b'-'
                && chunk[5..7].iter().all(|b| b.is_ascii_digit())
                && chunk[7] == b'-'
                && chunk[8..10].iter().all(|b| b.is_ascii_digit())
                && chunk[10] == b'T'
                && chunk[11..13].iter().all(|b| b.is_ascii_digit())
                && chunk[13] == b':'
                && chunk[14..16].iter().all(|b| b.is_ascii_digit())
                && chunk[16] == b':'
                && chunk[17..19].iter().all(|b| b.is_ascii_digit())
            {
                out.push_str("<TS>");
                i += 19;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace UUIDs (8-4-4-4-12 hex) with `<UUID>`
pub fn replace_uuids(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if i + 36 <= bytes.len() {
            let chunk = &bytes[i..i + 36];
            let is_boundary_start = i == 0 || !bytes[i - 1].is_ascii_alphanumeric();
            if is_boundary_start
                && chunk[0..8].iter().all(|b| b.is_ascii_hexdigit())
                && chunk[8] == b'-'
                && chunk[9..13].iter().all(|b| b.is_ascii_hexdigit())
                && chunk[13] == b'-'
                && chunk[14..18].iter().all(|b| b.is_ascii_hexdigit())
                && chunk[18] == b'-'
                && chunk[19..23].iter().all(|b| b.is_ascii_hexdigit())
                && chunk[23] == b'-'
                && chunk[24..36].iter().all(|b| b.is_ascii_hexdigit())
            {
                let is_boundary_end = i + 36 == bytes.len() || !bytes[i + 36].is_ascii_alphanumeric();
                if is_boundary_end {
                    out.push_str("<UUID>");
                    i += 36;
                    continue;
                }
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace hex literals `0x[0-9a-fA-F]{6,}` with `<HEX>`
pub fn replace_hex_literals(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if i + 8 <= bytes.len() && bytes[i] == b'0' && (bytes[i + 1] == b'x' || bytes[i + 1] == b'X') {
            let mut j = i + 2;
            while j < bytes.len() && bytes[j].is_ascii_hexdigit() {
                j += 1;
            }
            if j - (i + 2) >= 6 {
                let end_boundary = j == bytes.len() || !bytes[j].is_ascii_alphanumeric();
                if end_boundary {
                    out.push_str("<HEX>");
                    i = j;
                    continue;
                }
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace digit sequences of 3 or more digits `\b\d{3,}\b` with `<N>`
pub fn replace_numbers(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_digit() && (i == 0 || !bytes[i - 1].is_ascii_alphanumeric()) {
            let mut j = i;
            while j < bytes.len() && bytes[j].is_ascii_digit() {
                j += 1;
            }
            let end_boundary = j == bytes.len() || !bytes[j].is_ascii_alphanumeric();
            if j - i >= 3 && end_boundary {
                out.push_str("<N>");
                i = j;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace hashes in layer 2 (\b[0-9a-fA-F]{40,}\b) with <HASH>
pub fn replace_opaque_hashes(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_hexdigit() && (i == 0 || !bytes[i - 1].is_ascii_alphanumeric()) {
            let mut j = i;
            while j < bytes.len() && bytes[j].is_ascii_hexdigit() {
                j += 1;
            }
            let end_boundary = j == bytes.len() || !bytes[j].is_ascii_alphanumeric();
            let len = j - i;
            if end_boundary && len >= 40 {
                out.push_str("<HASH>");
                i = j;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace SHA256 (64 hex digits), and other long hex hashes (>= 32 hex digits)
pub fn replace_hashes_and_sha(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if (bytes[i].is_ascii_hexdigit() || bytes[i] == b'e')
            && (i == 0 || !bytes[i - 1].is_ascii_alphanumeric())
        {
            let mut j = i;
            while j < bytes.len() && bytes[j].is_ascii_hexdigit() {
                j += 1;
            }
            let end_boundary = j == bytes.len() || !bytes[j].is_ascii_alphanumeric();
            let len = j - i;
            if end_boundary {
                if len == 64 {
                    out.push_str("<SHA256>");
                    i = j;
                    continue;
                } else if len >= 32 {
                    out.push_str("<HASH>");
                    i = j;
                    continue;
                }
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

/// Replace JWT tokens (`eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`)
pub fn replace_jwts(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut remaining = s;

    while let Some(pos) = remaining.find("eyJ") {
        out.push_str(&remaining[..pos]);
        let token_cand = &remaining[pos..];
        let mut parts = token_cand.splitn(4, '.');
        let p1 = parts.next().unwrap_or("");
        let p2 = parts.next().unwrap_or("");
        let rest = parts.next().unwrap_or("");

        let p3_end = rest
            .find(|c: char| !is_base64_url_char(c))
            .unwrap_or(rest.len());
        let p3 = &rest[..p3_end];

        if p1.len() >= 13
            && p1.chars().all(is_base64_url_char)
            && p2.len() >= 10
            && p2.chars().all(is_base64_url_char)
            && p3.len() >= 10
            && p3.chars().all(is_base64_url_char)
        {
            out.push_str("<JWT>");
            let total_len = p1.len() + 1 + p2.len() + 1 + p3.len();
            remaining = &remaining[pos + total_len..];
        } else {
            out.push_str("eyJ");
            remaining = &remaining[pos + 3..];
        }
    }
    out.push_str(remaining);
    out
}

/// Replace URLs like `https://...` or `http://...` with `https://<URL>` or `http://<URL>`
pub fn replace_urls(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut remaining = s;

    while let Some(pos) = remaining.find("http://").or_else(|| remaining.find("https://")) {
        out.push_str(&remaining[..pos]);
        let scheme = if remaining[pos..].starts_with("https://") {
            "https://"
        } else {
            "http://"
        };
        out.push_str(scheme);
        out.push_str("<URL>");

        let after_scheme = &remaining[pos + scheme.len()..];
        let url_end = after_scheme
            .find(|c: char| c.is_whitespace() || c == '"' || c == '\'')
            .unwrap_or(after_scheme.len());

        remaining = &after_scheme[url_end..];
    }
    out.push_str(remaining);
    out
}

/// Shorten long quoted paths like `"this/is/a/very/long/path/to/file.txt"` keeping the last segments
pub fn shorten_quoted_paths(input: &str, min_len: usize) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '"' {
            let mut inside = String::new();
            let mut closed = false;
            while let Some(&nc) = chars.peek() {
                chars.next();
                if nc == '"' {
                    closed = true;
                    break;
                }
                inside.push(nc);
            }
            if inside.len() >= min_len && inside.contains('/') {
                let segments: Vec<&str> = inside.split('/').collect();
                if segments.len() > 3 {
                    out.push('"');
                    out.push_str(&segments[segments.len() - 3..].join("/"));
                    if closed {
                        out.push('"');
                    }
                    continue;
                }
            }
            out.push('"');
            out.push_str(&inside);
            if closed {
                out.push('"');
            }
        } else {
            out.push(c);
        }
    }
    out
}
