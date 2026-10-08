//! Minimal URL parser and builder for HTTP requests.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Url {
    pub scheme_str: String,
    pub host_str: String,
    pub port_num: Option<u16>,
    pub path_and_query_str: String,
    full: String,
}

impl Url {
    pub fn parse(input: &str) -> Result<Self, String> {
        let (scheme, rest) = input
            .split_once("://")
            .ok_or_else(|| "missing URL scheme".to_string())?;
        let (host_port, path) = match rest.find('/') {
            Some(idx) => (&rest[..idx], &rest[idx..]),
            None => (rest, "/"),
        };
        let (host, port) = match host_port.split_once(':') {
            Some((h, p)) => (h.to_string(), p.parse::<u16>().ok()),
            None => (host_port.to_string(), None),
        };
        Ok(Self {
            scheme_str: scheme.to_lowercase(),
            host_str: host,
            port_num: port,
            path_and_query_str: if path.is_empty() {
                "/".to_string()
            } else {
                path.to_string()
            },
            full: input.to_string(),
        })
    }

    pub fn parse_with_params(base: &str, params: &[(&str, &str)]) -> Result<Self, String> {
        let mut full = base.to_string();
        if !params.is_empty() {
            let sep = if full.contains('?') { '&' } else { '?' };
            let mut query = String::new();
            for (i, (k, v)) in params.iter().enumerate() {
                if i > 0 {
                    query.push('&');
                }
                query.push_str(k);
                query.push('=');
                for b in v.bytes() {
                    match b {
                        b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                            query.push(b as char);
                        }
                        b' ' => query.push('+'),
                        _ => query.push_str(&format!("%{:02X}", b)),
                    }
                }
            }
            full.push(sep);
            full.push_str(&query);
        }
        Self::parse(&full)
    }

    pub fn scheme(&self) -> &str {
        &self.scheme_str
    }

    pub fn host(&self) -> &str {
        &self.host_str
    }

    pub fn port(&self) -> u16 {
        self.port_num
            .unwrap_or(if self.scheme_str == "https" { 443 } else { 80 })
    }

    pub fn path_and_query(&self) -> &str {
        &self.path_and_query_str
    }

    pub fn as_str(&self) -> &str {
        &self.full
    }
}

impl std::fmt::Display for Url {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.full)
    }
}
