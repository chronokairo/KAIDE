//! Native zero-lib HTTP client with async, blocking, and SSE streaming support.

use super::response::Response;
use super::status::StatusCode;
use super::url::Url;
use std::collections::HashMap;
use std::time::Duration;
use crate::async_rt::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Clone, Default)]
pub struct ClientBuilder {
    timeout: Option<Duration>,
    user_agent: Option<String>,
}

impl ClientBuilder {
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }

    pub fn user_agent(mut self, ua: impl Into<String>) -> Self {
        self.user_agent = Some(ua.into());
        self
    }

    pub fn build(self) -> crate::error::Result<Client> {
        Ok(Client {
            timeout: self.timeout.unwrap_or(Duration::from_secs(60)),
            user_agent: self.user_agent,
        })
    }
}

#[derive(Clone, Debug)]
pub struct Client {
    timeout: Duration,
    user_agent: Option<String>,
}

impl Default for Client {
    fn default() -> Self {
        Self::new()
    }
}

impl Client {
    pub fn new() -> Self {
        Self {
            timeout: Duration::from_secs(60),
            user_agent: Some(format!("ckc/{}", env!("CARGO_PKG_VERSION"))),
        }
    }

    pub fn builder() -> ClientBuilder {
        ClientBuilder::default()
    }

    pub fn get(&self, url: impl Into<String>) -> RequestBuilder {
        RequestBuilder::new(self.clone(), "GET", url.into())
    }

    pub fn post(&self, url: impl Into<String>) -> RequestBuilder {
        RequestBuilder::new(self.clone(), "POST", url.into())
    }
}

pub struct RequestBuilder {
    client: Client,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<Vec<u8>>,
    timeout: Option<Duration>,
}

impl RequestBuilder {
    pub fn new(client: Client, method: &str, url: String) -> Self {
        let mut headers = HashMap::new();
        if let Some(ua) = &client.user_agent {
            headers.insert("User-Agent".to_string(), ua.clone());
        }
        Self {
            client,
            method: method.to_string(),
            url,
            headers,
            body: None,
            timeout: None,
        }
    }

    pub fn bearer_auth(mut self, token: impl Into<String>) -> Self {
        self.headers.insert("Authorization".to_string(), format!("Bearer {}", token.into()));
        self
    }

    pub fn header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into(), value.into());
        self
    }

    pub fn json_value(mut self, json_val: &crate::json::Value) -> Self {
        self.headers.insert("Content-Type".to_string(), "application/json".to_string());
        self.body = Some(crate::json::to_vec(json_val));
        self
    }

    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }

    pub async fn send(self) -> crate::error::Result<Response> {
        let timeout = self.timeout.unwrap_or(self.client.timeout);
        let parsed_url = Url::parse(&self.url).map_err(|e| crate::error::message(e))?;

        if parsed_url.scheme() == "http" {
            Self::send_http_stream(parsed_url, self.method, self.headers, self.body, timeout).await
        } else {
            Self::send_curl(self.url, self.method, self.headers, self.body, timeout).await
        }
    }

    async fn send_http_stream(
        url: Url,
        method: String,
        headers: HashMap<String, String>,
        body: Option<Vec<u8>>,
        timeout: Duration,
    ) -> crate::error::Result<Response> {
        let addr = format!("{}:{}", url.host(), url.port());
        let connect_fut = crate::async_rt::net::TcpStream::connect(&addr);
        let mut stream = crate::async_rt::time::timeout(timeout, connect_fut)
            .await
            .map_err(|_| crate::error::message("connection timed out"))??;

        let mut req_bytes = Vec::new();
        req_bytes.extend_from_slice(format!("{} {} HTTP/1.1\r\n", method, url.path_and_query()).as_bytes());
        req_bytes.extend_from_slice(format!("Host: {}\r\n", url.host()).as_bytes());
        req_bytes.extend_from_slice(b"Connection: close\r\n");

        for (k, v) in &headers {
            req_bytes.extend_from_slice(format!("{}: {}\r\n", k, v).as_bytes());
        }

        if let Some(b) = &body {
            req_bytes.extend_from_slice(format!("Content-Length: {}\r\n", b.len()).as_bytes());
            req_bytes.extend_from_slice(b"\r\n");
            req_bytes.extend_from_slice(b);
        } else {
            req_bytes.extend_from_slice(b"\r\n");
        }

        stream.write_all(&req_bytes).await?;
        stream.flush().await?;

        // Read response headers
        let mut header_buf = Vec::new();
        let mut byte = [0u8; 1];
        while stream.read_exact(&mut byte).await.is_ok() {
            header_buf.push(byte[0]);
            if header_buf.ends_with(b"\r\n\r\n") {
                break;
            }
        }

        let header_str = String::from_utf8_lossy(&header_buf);
        let mut lines = header_str.lines();
        let status_line = lines.next().unwrap_or("");
        let status_code = status_line
            .split_whitespace()
            .nth(1)
            .and_then(|s| s.parse::<u16>().ok())
            .unwrap_or(200);

        let mut resp_headers = HashMap::new();
        for line in lines {
            if let Some((k, v)) = line.split_once(':') {
                resp_headers.insert(k.trim().to_lowercase(), v.trim().to_string());
            }
        }

        let is_event_stream = resp_headers
            .get("content-type")
            .map(|ct| ct.contains("text/event-stream"))
            .unwrap_or(false);

        if is_event_stream {
            let (tx, rx) = crate::async_rt::sync::mpsc::channel::<Vec<u8>>(128);
            crate::async_rt::task::spawn(async move {
                let mut buf = [0u8; 4096];
                loop {
                    match stream.read(&mut buf).await {
                        Ok(0) | Err(_) => break,
                        Ok(n) => {
                            if tx.send(buf[..n].to_vec()).await.is_err() {
                                break;
                            }
                        }
                    }
                }
            });
            Ok(Response {
                status: StatusCode(status_code),
                headers: resp_headers,
                body: Vec::new(),
                stream_rx: Some(rx),
            })
        } else {
            let mut body_bytes = Vec::new();
            stream.read_to_end(&mut body_bytes).await?;
            Ok(Response {
                status: StatusCode(status_code),
                headers: resp_headers,
                body: body_bytes,
                stream_rx: None,
            })
        }
    }

    async fn send_curl(
        url: String,
        method: String,
        headers: HashMap<String, String>,
        body: Option<Vec<u8>>,
        timeout: Duration,
    ) -> crate::error::Result<Response> {
        let mut cmd = crate::async_rt::process::Command::new("curl.exe");
        cmd.arg("-s").arg("-i").arg("-N");
        cmd.arg("-X").arg(&method);
        cmd.arg("--max-time").arg(timeout.as_secs().max(1).to_string());

        for (k, v) in &headers {
            cmd.arg("-H").arg(format!("{}: {}", k, v));
        }

        cmd.arg(&url);

        if body.is_some() {
            cmd.stdin(std::process::Stdio::piped());
            cmd.arg("--data-binary").arg("@-");
        }
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::null());

        let mut child = cmd.spawn()?;
        if let Some(b) = body {
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(&b).await;
            }
        }

        let mut stdout = child.stdout.take().ok_or_else(|| crate::error::message("failed to open curl stdout"))?;

        // Read response headers
        let mut header_buf = Vec::new();
        let mut byte = [0u8; 1];
        while stdout.read_exact(&mut byte).await.is_ok() {
            header_buf.push(byte[0]);
            if header_buf.ends_with(b"\r\n\r\n") || header_buf.ends_with(b"\n\n") {
                break;
            }
        }

        let header_str = String::from_utf8_lossy(&header_buf);
        let mut lines = header_str.lines();
        let status_line = lines.next().unwrap_or("");
        let status_code = status_line
            .split_whitespace()
            .nth(1)
            .and_then(|s| s.parse::<u16>().ok())
            .unwrap_or(200);

        let mut resp_headers = HashMap::new();
        for line in lines {
            if let Some((k, v)) = line.split_once(':') {
                resp_headers.insert(k.trim().to_lowercase(), v.trim().to_string());
            }
        }

        let is_event_stream = resp_headers
            .get("content-type")
            .map(|ct| ct.contains("text/event-stream"))
            .unwrap_or(false);

        if is_event_stream {
            let (tx, rx) = crate::async_rt::sync::mpsc::channel::<Vec<u8>>(128);
            crate::async_rt::task::spawn(async move {
                let mut buf = [0u8; 4096];
                loop {
                    match stdout.read(&mut buf).await {
                        Ok(0) | Err(_) => break,
                        Ok(n) => {
                            if tx.send(buf[..n].to_vec()).await.is_err() {
                                break;
                            }
                        }
                    }
                }
                let _ = child.wait().await;
            });
            Ok(Response {
                status: StatusCode(status_code),
                headers: resp_headers,
                body: Vec::new(),
                stream_rx: Some(rx),
            })
        } else {
            let mut body_bytes = Vec::new();
            stdout.read_to_end(&mut body_bytes).await?;
            let _ = child.wait().await;
            Ok(Response {
                status: StatusCode(status_code),
                headers: resp_headers,
                body: body_bytes,
                stream_rx: None,
            })
        }
    }
}

pub mod blocking {
    use super::*;

    #[derive(Clone, Default)]
    pub struct ClientBuilder {
        timeout: Option<Duration>,
        user_agent: Option<String>,
    }

    impl ClientBuilder {
        pub fn timeout(mut self, timeout: Duration) -> Self {
            self.timeout = Some(timeout);
            self
        }

        pub fn user_agent(mut self, ua: impl Into<String>) -> Self {
            self.user_agent = Some(ua.into());
            self
        }

        pub fn build(self) -> crate::error::Result<Client> {
            Ok(Client {
                timeout: self.timeout.unwrap_or(Duration::from_secs(60)),
                user_agent: self.user_agent,
            })
        }
    }

    #[derive(Clone, Debug)]
    pub struct Client {
        timeout: Duration,
        user_agent: Option<String>,
    }

    impl Client {
        pub fn builder() -> ClientBuilder {
            ClientBuilder::default()
        }

        pub fn get(&self, url: impl Into<String>) -> RequestBuilder {
            RequestBuilder::new(self.clone(), "GET", url.into())
        }

        pub fn post(&self, url: impl Into<String>) -> RequestBuilder {
            RequestBuilder::new(self.clone(), "POST", url.into())
        }
    }

    pub struct RequestBuilder {
        client: Client,
        method: String,
        url: String,
        headers: HashMap<String, String>,
        body: Option<Vec<u8>>,
        timeout: Option<Duration>,
    }

    impl RequestBuilder {
        pub fn new(client: Client, method: &str, url: String) -> Self {
            let mut headers = HashMap::new();
            if let Some(ua) = &client.user_agent {
                headers.insert("User-Agent".to_string(), ua.clone());
            }
            Self {
                client,
                method: method.to_string(),
                url,
                headers,
                body: None,
                timeout: None,
            }
        }

        pub fn bearer_auth(mut self, token: impl Into<String>) -> Self {
            self.headers
                .insert("Authorization".to_string(), format!("Bearer {}", token.into()));
            self
        }

        pub fn send(self) -> crate::error::Result<Response> {
            let timeout = self.timeout.unwrap_or(self.client.timeout);
            let mut cmd = std::process::Command::new("curl.exe");
            cmd.arg("-s").arg("-i");
            cmd.arg("-X").arg(&self.method);
            cmd.arg("--max-time").arg(timeout.as_secs().max(1).to_string());
            cmd.stdout(std::process::Stdio::piped());
            cmd.stderr(std::process::Stdio::null());

            for (k, v) in &self.headers {
                cmd.arg("-H").arg(format!("{}: {}", k, v));
            }

            cmd.arg(&self.url);

            if self.body.is_some() {
                cmd.stdin(std::process::Stdio::piped());
                cmd.arg("--data-binary").arg("@-");
            }

            let mut child = cmd.spawn()?;
            if let Some(b) = self.body {
                if let Some(mut stdin) = child.stdin.take() {
                    let _ = std::io::Write::write_all(&mut stdin, &b);
                }
            }

            let output = child.wait_with_output()?;
            let mut split_pos = None;
            for i in 0..output.stdout.len().saturating_sub(3) {
                if &output.stdout[i..i + 4] == b"\r\n\r\n" {
                    split_pos = Some((i, i + 4));
                    break;
                }
                if &output.stdout[i..i + 2] == b"\n\n" {
                    split_pos = Some((i, i + 2));
                    break;
                }
            }

            let (header_bytes, body_bytes) = match split_pos {
                Some((h_end, b_start)) => (&output.stdout[..h_end], output.stdout[b_start..].to_vec()),
                None => (output.stdout.as_slice(), Vec::new()),
            };

            let header_str = String::from_utf8_lossy(header_bytes);
            let mut lines = header_str.lines();
            let status_line = lines.next().unwrap_or("");
            let status_code = status_line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse::<u16>().ok())
                .unwrap_or(200);

            let mut resp_headers = HashMap::new();
            for line in lines {
                if let Some((k, v)) = line.split_once(':') {
                    resp_headers.insert(k.trim().to_lowercase(), v.trim().to_string());
                }
            }

            Ok(Response {
                status: StatusCode(status_code),
                headers: resp_headers,
                body: body_bytes,
                stream_rx: None,
            })
        }
    }
}
