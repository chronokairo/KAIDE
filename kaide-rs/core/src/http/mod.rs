//! Zero-lib native HTTP client module replacing reqwest.

pub mod client;
pub mod response;
pub mod status;
pub mod url;

pub use client::{blocking, Client, ClientBuilder, RequestBuilder};
pub use response::Response;
pub use status::StatusCode;
pub use url::Url;

pub mod header {
    pub const CONTENT_TYPE: &str = "content-type";
    pub const USER_AGENT: &str = "user-agent";
    pub const AUTHORIZATION: &str = "authorization";
}
