//! HTTP Response representation with streaming support.

use super::status::StatusCode;
use std::collections::HashMap;

pub struct Response {
    pub status: StatusCode,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    pub stream_rx: Option<crate::async_rt::sync::mpsc::Receiver<Vec<u8>>>,
}

impl Response {
    pub fn status(&self) -> StatusCode {
        self.status
    }

    pub fn headers(&self) -> &HashMap<String, String> {
        &self.headers
    }

    pub fn text(&self) -> crate::error::Result<String> {
        Ok(String::from_utf8_lossy(&self.body).into_owned())
    }

    /// Parse a dynamic JSON payload without pulling the external JSON stack
    /// into callers that only need object/array traversal.
    pub fn json_value(&self) -> crate::error::Result<crate::json::Value> {
        crate::json::from_str(&self.text()?)
            .map_err(|error| crate::error::message(error.to_string()))
    }

    pub fn json<T: serde::de::DeserializeOwned>(&self) -> crate::error::Result<T> {
        serde_json::from_slice(&self.body).map_err(|e| crate::error::anyhow!("{e}"))
    }

    pub fn bytes(&self) -> crate::error::Result<Vec<u8>> {
        Ok(self.body.clone())
    }

    pub async fn chunk(&mut self) -> crate::error::Result<Option<Vec<u8>>> {
        if let Some(rx) = &mut self.stream_rx {
            Ok(rx.recv().await)
        } else if !self.body.is_empty() {
            let data = std::mem::take(&mut self.body);
            Ok(Some(data))
        } else {
            Ok(None)
        }
    }

    pub fn copy_to<W: std::io::Write>(&mut self, writer: &mut W) -> crate::error::Result<u64> {
        writer.write_all(&self.body)?;
        Ok(self.body.len() as u64)
    }
}
