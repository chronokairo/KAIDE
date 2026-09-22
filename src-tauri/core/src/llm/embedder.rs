use crate::error::Result;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::llm::infer::engine::InferenceEngine;
use crate::llm::infer::gguf::GgufReader;
use crate::llm::infer::model::Model;
use crate::llm::infer::tokenizer::Tokenizer;

/// Default embedding model file name placed under
/// `~/.chronokairo/models/embeddings/`.
pub const EMBEDDING_DEFAULT: &str = "Qwen3-Embedding-0.6B-Q8_0.gguf";

/// Candidate download sources, tried in order. Qwen3-Embedding 0.6B is the
/// recommended default (official Qwen GGUF, Q8_0 ~0.6 GB); Jina v5 small
/// retrieval (1024-dim, last-token pooling) is the fallback.
const EMBEDDING_CANDIDATES: &[&str] = &[
    "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf",
    "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-f16.gguf",
    "https://huggingface.co/jinaai/jina-embeddings-v5-text-small-retrieval-GGUF/resolve/main/v5-small-retrieval-Q8_0.gguf",
];

/// Whether the text being embedded is a query or a stored passage. The two use
/// different instruction prefixes (required by Qwen3-Embedding / Jina v5).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmbedKind {
    Query,
    Passage,
}

enum EmbedderSource {
    Gguf { path: PathBuf, max_seq_len: usize },
}

/// Local embedding engine that lazily loads a GGUF embedding model and exposes
/// normalized last-token embeddings. When no model file is present it stays
/// inert and `embed` returns a guidance error.
pub struct Embedder {
    source: Option<EmbedderSource>,
    engine: Mutex<Option<InferenceEngine>>,
}

impl Embedder {
    pub fn new() -> Self {
        let source = resolve_source().map(|path| EmbedderSource::Gguf {
            path,
            max_seq_len: 512,
        });
        Self {
            source,
            engine: Mutex::new(None),
        }
    }

    pub fn is_available(&self) -> bool {
        self.source.is_some()
    }

    /// Embed `text` with the task-appropriate instruction prefix and L2
    /// normalization, so cosine similarity is a plain dot product.
    pub fn embed(&self, text: &str, kind: EmbedKind) -> Result<Vec<f32>> {
        let Some(source) = &self.source else {
            crate::error::bail!(
                "no embedding model configured — run `ckc --download-embedding-model` once (stores the model in ~/.chronokairo/models)"
            );
        };
        let mut guard = self.engine.lock().unwrap();
        if guard.is_none() {
            let EmbedderSource::Gguf { path, max_seq_len } = source;
            let path_str = path.to_string_lossy().to_string();
            let model = Model::load(&path_str)?;
            let reader = GgufReader::load(&path_str)?;
            let tokenizer = Tokenizer::load_from_gguf(&reader)?;
            crate::cki_info!("embedding model loaded from {}", path.display());
            *guard = Some(InferenceEngine::new(model, tokenizer, *max_seq_len));
        }
        let engine = guard.as_mut().expect("engine loaded above");
        let prompt = match kind {
            EmbedKind::Query => format!("Query: {text}"),
            EmbedKind::Passage => format!("Passage: {text}"),
        };
        engine.embed(&prompt)
    }

    /// Embedding dimensionality once a model is loaded (0 before then).
    pub fn dim(&self) -> usize {
        let guard = self.engine.lock().unwrap();
        if let Some(engine) = guard.as_ref() {
            let n_embd = engine.n_embd();
            drop(guard);
            return n_embd;
        }
        0
    }
}

/// Global config models dir: `~/.chronokairo/models`. The embedding model lives
/// here (shared across every project) so workspaces stay free of multi-hundred
/// MB blobs and the transaction snapshot never has to read them.
pub fn global_models_dir() -> PathBuf {
    crate::config::home_dir().join(".chronokairo").join("models")
}

/// Locate the embedding GGUF in the global config dir
/// (`~/.chronokairo/models/embeddings/`): the first `.gguf` present, then the
/// default filename. Also checks legacy `~/.anamnesic/models/embeddings/` if present.
fn resolve_source() -> Option<PathBuf> {
    let candidate_dirs = [
        global_models_dir().join("embeddings"),
        crate::config::home_dir().join(".anamnesic").join("models").join("embeddings"),
    ];
    for dir in &candidate_dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            let mut gguf: Vec<PathBuf> = entries
                .filter_map(|entry| entry.ok())
                .map(|entry| entry.path())
                .filter(|path| path.extension().is_some_and(|ext| ext == "gguf"))
                .collect();
            gguf.sort();
            if let Some(first) = gguf.into_iter().next() {
                return Some(first);
            }
        }
        let default = dir.join(EMBEDDING_DEFAULT);
        if default.exists() {
            return Some(default);
        }
    }
    None
}

/// Download the first available candidate embedding model into the global
/// config dir (`~/.chronokairo/models/embeddings/`) and return its path.
pub fn download_embedding_model() -> Result<PathBuf> {
    let dir = global_models_dir().join("embeddings");
    std::fs::create_dir_all(&dir)?;
    let client = crate::http::blocking::Client::builder()
        .user_agent(format!("ckc/{}", env!("CARGO_PKG_VERSION")))
        .timeout(std::time::Duration::from_secs(120))
        .build()?;
    for url in EMBEDDING_CANDIDATES {
        let filename = url.rsplit('/').next().unwrap_or("embedding.gguf");
        let target = dir.join(filename);
        if target.exists() {
            println!("Already present: {}", target.display());
            return Ok(target);
        }
        let label = url.split('/').nth(4).unwrap_or("huggingface.co");
        match download_to(&client, url, &target) {
            Ok(()) => {
                println!("Downloaded: {}", target.display());
                return Ok(target);
            }
            Err(error) => println!("[{label}] download failed: {error}"),
        }
    }
    crate::error::bail!(
        "all embedding model sources failed — check network access to huggingface.co (~0.6 GB each)"
    )
}

fn download_to(client: &crate::http::blocking::Client, url: &str, target: &Path) -> Result<()> {
    let mut response = client.get(url).send()?;
    if !response.status().is_success() {
        crate::error::bail!("HTTP {}", response.status());
    }
    println!("  {url} → {}", target.display());
    let file = std::fs::File::create(target)?;
    let mut writer = std::io::BufWriter::new(file);
    response.copy_to(&mut writer)?;
    writer.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    static ENV_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

    #[test]
    fn resolve_source_uses_global_models_dir() {
        let _guard = ENV_LOCK.lock().unwrap();
        let tmp =
            std::env::temp_dir().join(format!("chronokairo-embedder-global-{}", std::process::id()));
        let dir = tmp.join(".chronokairo").join("models").join("embeddings");
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("my-embed.gguf");
        std::fs::write(&file, b"not a real model").unwrap();
        let prev_home = std::env::var_os("HOME");
        let prev_up = std::env::var_os("USERPROFILE");
        std::env::set_var("HOME", &tmp);
        std::env::set_var("USERPROFILE", &tmp);
        let found = resolve_source();
        assert_eq!(found, Some(file));
        assert!(Embedder::new().is_available());
        match prev_home {
            Some(v) => std::env::set_var("HOME", v),
            None => std::env::remove_var("HOME"),
        }
        match prev_up {
            Some(v) => std::env::set_var("USERPROFILE", v),
            None => std::env::remove_var("USERPROFILE"),
        }
        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn resolve_source_returns_none_when_missing() {
        let _guard = ENV_LOCK.lock().unwrap();
        let tmp =
            std::env::temp_dir().join(format!("chronokairo-embedder-none-{}", std::process::id()));
        let prev_home = std::env::var_os("HOME");
        let prev_up = std::env::var_os("USERPROFILE");
        std::env::set_var("HOME", &tmp);
        std::env::set_var("USERPROFILE", &tmp);
        std::fs::create_dir_all(&tmp).unwrap();
        assert!(resolve_source().is_none());
        assert!(!Embedder::new().is_available());
        match prev_home {
            Some(v) => std::env::set_var("HOME", v),
            None => std::env::remove_var("HOME"),
        }
        match prev_up {
            Some(v) => std::env::set_var("USERPROFILE", v),
            None => std::env::remove_var("USERPROFILE"),
        }
        let _ = std::fs::remove_dir_all(&tmp);
    }

    /// End-to-end check of the real inference engine against the embedding
    /// GGUF in `~/.chronokairo/models`. Skipped by default; run with
    /// `cargo test -- --ignored` after `--download-embedding-model`.
    #[test]
    #[ignore]
    fn real_embedding_model_ranks_similar_texts() {
        let embedder = Embedder::new();
        assert!(
            embedder.is_available(),
            "no embedding model in {} — run --download-embedding-model first",
            global_models_dir().display()
        );
        let a = embedder
            .embed("how do I run the test suite?", EmbedKind::Query)
            .unwrap();
        let b = embedder
            .embed("run cargo test to verify the changes", EmbedKind::Passage)
            .unwrap();
        let c = embedder
            .embed("bake a cake with flour and sugar", EmbedKind::Passage)
            .unwrap();
        assert_eq!(a.len(), b.len());
        assert_eq!(a.len(), c.len());
        assert!(embedder.dim() > 0);
        let dot = |x: &[f32], y: &[f32]| x.iter().zip(y).map(|(x, y)| x * y).sum::<f32>();
        let similar = dot(&a, &b);
        let unrelated = dot(&a, &c);
        assert!(
            similar > unrelated,
            "similar texts must score higher ({similar:.4}) than unrelated ones ({unrelated:.4})"
        );
    }
}
