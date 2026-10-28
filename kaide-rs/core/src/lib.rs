// Biblioteca do núcleo Chronokairo CLI (ck) — zero-lib.
// Expõe os módulos do kaide para consumidores (ex.: a casca Tauri), sem alterar o binário `kaide` (src/main.rs).
// Fonte de verdade do código Rust: este crate. O restante (casca Tauri) apenas consome esta lib.
#![allow(dead_code)]

pub mod cli_args;
pub mod error;
pub mod base64;
pub mod random;
pub mod password;
pub mod json;
pub mod serde_json;
pub mod editor;
pub mod agent;
pub mod app_server;
pub mod bench;
pub mod async_rt;
pub use async_rt as tokio;
pub mod compressor;
pub mod config;
pub mod http;
pub mod hw_recommend;
pub mod llm;
pub mod logger;
pub mod mcp;
pub mod memory;
pub mod protocol;
pub mod providers;
pub mod repo;
pub mod skills;
pub mod tools;
pub mod types;
pub mod ui;
