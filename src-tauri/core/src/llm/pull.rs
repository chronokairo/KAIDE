//! Download and manage local GGUF models from trusted repositories (Hugging Face).
//!
//! Models are saved in `~/.chronokairo/models/` and are immediately resolvable
//! by `ckc` for local zero-lib inference.

use crate::error::{bail, Result};
use std::path::{Path, PathBuf};

pub struct TrustedModel {
    pub name: &'static str,
    pub aliases: &'static [&'static str],
    pub description: &'static str,
    pub filename: &'static str,
    pub url: &'static str,
    pub size_gb: f32,
}

pub const TRUSTED_MODELS: &[TrustedModel] = &[
    TrustedModel {
        name: "qwen2.5-coder:3b",
        aliases: &[
            "qwen2.5-coder:3b",
            "qwen2.5-coder-3b",
            "qwen-coder:3b",
            "qwen-coder-3b",
            "qwen2.5-coder",
            "qwen:3b",
        ],
        description: "Qwen 2.5 Coder 3B Instruct (Q4_K_M) — #1 choice for GTX 1650 & agentic coding",
        filename: "qwen2.5-coder-3b-instruct-q4_k_m.gguf",
        url: "https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf",
        size_gb: 1.95,
    },
    TrustedModel {
        name: "qwen2.5-coder:1.5b",
        aliases: &[
            "qwen2.5-coder:1.5b",
            "qwen2.5-coder-1.5b",
            "qwen-coder:1.5b",
            "qwen:1.5b",
        ],
        description: "Qwen 2.5 Coder 1.5B Instruct (Q4_K_M) — ultra-lightweight coding model",
        filename: "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
        url: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
        size_gb: 0.98,
    },
    TrustedModel {
        name: "qwen2.5-coder:7b",
        aliases: &[
            "qwen2.5-coder:7b",
            "qwen2.5-coder-7b",
            "qwen-coder:7b",
            "qwen:7b",
        ],
        description: "Qwen 2.5 Coder 7B Instruct (Q4_K_M) — advanced coding model (needs 6GB+ VRAM or CPU)",
        filename: "qwen2.5-coder-7b-instruct-q4_k_m.gguf",
        url: "https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/qwen2.5-coder-7b-instruct-q4_k_m.gguf",
        size_gb: 4.68,
    },
    TrustedModel {
        name: "nemotron-mini:4b",
        aliases: &[
            "nemotron-mini:4b",
            "nemotron-mini",
            "nemotron:4b",
            "nemotron-4b",
            "nemotron",
        ],
        description: "NVIDIA Nemotron-Mini-4B Instruct (Q4_K_M) — optimized for NVIDIA edge & general chat",
        filename: "Nemotron-Mini-4B-Instruct-Q4_K_M.gguf",
        url: "https://huggingface.co/bartowski/Nemotron-Mini-4B-Instruct-GGUF/resolve/main/Nemotron-Mini-4B-Instruct-Q4_K_M.gguf",
        size_gb: 2.51,
    },
    TrustedModel {
        name: "ministral:3b",
        aliases: &[
            "ministral:3b",
            "ministral-3b",
            "ministral",
        ],
        description: "Mistral AI Ministral 3B Instruct (Q4_K_M) — edge agentic & structured output",
        filename: "Ministral-3b-instruct-Q4_K_M.gguf",
        url: "https://huggingface.co/bartowski/Ministral-3b-instruct-GGUF/resolve/main/Ministral-3b-instruct-Q4_K_M.gguf",
        size_gb: 2.10,
    },
    TrustedModel {
        name: "phi-4-mini:3.8b",
        aliases: &[
            "phi-4-mini:3.8b",
            "phi-4-mini",
            "phi4-mini",
            "phi-4",
        ],
        description: "Microsoft Phi-4-Mini Instruct (Q4_K_M) — high reasoning & multi-turn planning",
        filename: "Phi-4-mini-instruct-Q4_K_M.gguf",
        url: "https://huggingface.co/bartowski/Phi-4-mini-instruct-GGUF/resolve/main/Phi-4-mini-instruct-Q4_K_M.gguf",
        size_gb: 2.45,
    },
    TrustedModel {
        name: "gemma3:1b",
        aliases: &[
            "gemma3:1b",
            "gemma-3:1b",
            "gemma:1b",
        ],
        description: "Google Gemma 3 1B IT (Q4_K_M) — compact lightweight assistant",
        filename: "gemma-3-1b-it-q4_k_m.gguf",
        url: "https://huggingface.co/google/gemma-3-1b-it-gguf/resolve/main/gemma-3-1b-it-q4_k_m.gguf",
        size_gb: 0.85,
    },
    TrustedModel {
        name: "llama-3.2:3b",
        aliases: &[
            "llama-3.2:3b",
            "llama-3.2-3b",
            "llama3.2:3b",
        ],
        description: "Meta Llama 3.2 3B Instruct (Q4_K_M) — fast general SLM",
        filename: "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        size_gb: 2.02,
    },
];

pub fn models_dir() -> PathBuf {
    crate::config::home_dir().join(".chronokairo").join("models")
}

/// Resolves model input to (download_url, filename, display_name).
pub fn resolve_download_target(query: &str) -> Result<(String, String, String)> {
    let q = query.trim();

    // 1. Direct HTTPS URL
    if q.starts_with("https://") || q.starts_with("http://") {
        let filename = q
            .rsplit('/')
            .next()
            .and_then(|f| f.split('?').next())
            .unwrap_or("model.gguf")
            .to_string();
        return Ok((q.to_string(), filename.clone(), filename));
    }

    // 2. Hugging Face shorthand: owner/repo/filename.gguf
    if q.contains('/') && q.ends_with(".gguf") {
        let parts: Vec<&str> = q.split('/').collect();
        if parts.len() >= 3 {
            let owner = parts[0];
            let repo = parts[1];
            let file = parts[2..].join("/");
            let url = format!("https://huggingface.co/{owner}/{repo}/resolve/main/{file}");
            let filename = parts.last().unwrap().to_string();
            return Ok((url, filename.clone(), q.to_string()));
        }
    }

    // 3. Match against trusted models
    let q_lower = q.to_lowercase();
    for m in TRUSTED_MODELS {
        if m.name == q_lower || m.aliases.iter().any(|&a| a == q_lower) {
            return Ok((m.url.to_string(), m.filename.to_string(), m.name.to_string()));
        }
    }

    // Not found: provide helpful error with list of available models
    let mut help = String::new();
    help.push_str(&format!("Unknown model '{query}'.\n\nTrusted models available for 'ckc pull':\n"));
    for m in TRUSTED_MODELS {
        help.push_str(&format!("  - {:<20} (~{:.1} GB) — {}\n", m.name, m.size_gb, m.description));
    }
    help.push_str("\nYou can also pass a direct Hugging Face URL or shorthand, e.g.:\n");
    help.push_str("  ckc pull https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf\n");
    help.push_str("  ckc pull Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/qwen2.5-coder-3b-instruct-q4_k_m.gguf\n");
    bail!("{help}");
}

/// Download a model and save it in `~/.chronokairo/models/`.
pub fn pull_model(query: &str) -> Result<PathBuf> {
    let (url, filename, display_name) = resolve_download_target(query)?;
    let dest_dir = models_dir();
    std::fs::create_dir_all(&dest_dir)?;

    let target_path = dest_dir.join(&filename);
    if target_path.is_file() {
        if let Ok(meta) = std::fs::metadata(&target_path) {
            let size_mb = meta.len() as f64 / (1024.0 * 1024.0);
            println!("Model '{}' is already downloaded ({:.1} MB).", display_name, size_mb);
            println!("Path: {}", target_path.display());
            create_aliases(&dest_dir, query, &filename)?;
            return Ok(target_path);
        }
    }

    println!("pulling model: {}", display_name);
    println!("source URL:    {}", url);
    println!("destination:   {}", target_path.display());
    println!();

    let part_path = dest_dir.join(format!("{}.part", filename));

    // Prefer curl.exe with progress bar if available
    let curl_status = std::process::Command::new("curl.exe")
        .arg("-L")
        .arg("--progress-bar")
        .arg("--fail")
        .arg("-C")
        .arg("-")
        .arg("-o")
        .arg(&part_path)
        .arg(&url)
        .status();

    let download_success = match curl_status {
        Ok(status) => status.success(),
        Err(_) => {
            // Fallback to curl without .exe or internal HTTP client
            let fallback_status = std::process::Command::new("curl")
                .arg("-L")
                .arg("--progress-bar")
                .arg("--fail")
                .arg("-C")
                .arg("-")
                .arg("-o")
                .arg(&part_path)
                .arg(&url)
                .status();
            match fallback_status {
                Ok(s) => s.success(),
                Err(_) => {
                    // Fallback to internal HTTP client
                    download_via_http(&url, &part_path)?
                }
            }
        }
    };

    if !download_success {
        bail!("Failed to download model from '{url}'. Check your network connection.");
    }

    // Rename part file to destination
    std::fs::rename(&part_path, &target_path)?;

    println!("\nSuccessfully downloaded {} to {}", display_name, target_path.display());

    // Create convenient aliases so user can run --model <alias>
    create_aliases(&dest_dir, query, &filename)?;

    println!("You can now run:\n  ckc --local --model {}", query);
    Ok(target_path)
}

fn create_aliases(dir: &Path, query: &str, target_filename: &str) -> Result<()> {
    let clean = query.replace(':', "-");
    let base = query.split(':').next().unwrap_or(query);

    let aliases = vec![
        dir.join(format!("{clean}.alias")),
        dir.join(format!("{base}.alias")),
    ];

    for alias in aliases {
        let _ = std::fs::write(&alias, target_filename);
    }
    Ok(())
}

fn download_via_http(url: &str, target: &Path) -> Result<bool> {
    println!("Downloading via internal HTTP client (this may take a few minutes)...\n");
    let client = crate::http::blocking::Client::builder()
        .user_agent(format!("ckc/{}", env!("CARGO_PKG_VERSION")))
        .timeout(std::time::Duration::from_secs(600))
        .build()?;

    let mut response = client.get(url).send()?;
    if !response.status().is_success() {
        bail!("HTTP download failed with status {}", response.status());
    }

    let file = std::fs::File::create(target)?;
    let mut writer = std::io::BufWriter::new(file);
    response.copy_to(&mut writer)?;
    use std::io::Write;
    writer.flush()?;
    Ok(true)
}
