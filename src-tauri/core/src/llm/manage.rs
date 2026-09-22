//! Management commands for local GGUF models: rm, show, cp, ps, run, and enhanced models list.
//!
//! Follows ChronoKairo Zero-Lib policy using only std::* and internal primitives.

use crate::error::{bail, Context, Result};
use crate::llm::infer::engine::InferenceEngine;
use crate::llm::infer::gguf::GgufReader;
use crate::llm::infer::model::Model;
use crate::llm::infer::tokenizer::Tokenizer;
use crate::llm::model_resolver;
use std::io::Write;
use std::path::Path;

/// Remove/delete a local model and its aliases from ~/.chronokairo/models
pub fn rm_model(query: &str) -> Result<()> {
    rm_model_in(query, &crate::llm::pull::models_dir())
}

pub fn rm_model_in(query: &str, dir: &Path) -> Result<()> {
    if !dir.exists() {
        bail!("Models directory {} does not exist. No models to remove.", dir.display());
    }

    // Attempt to resolve the model file
    let target_path = match model_resolver::resolve_model(query, dir) {
        Ok(p) => p,
        Err(_) => {
            let direct = dir.join(query);
            if direct.is_file() {
                direct
            } else {
                let direct_gguf = dir.join(format!("{query}.gguf"));
                if direct_gguf.is_file() {
                    direct_gguf
                } else {
                    bail!("Model '{query}' not found in {}.\nUse 'ckc models' to see installed models.", dir.display());
                }
            }
        }
    };

    let filename = target_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let size_bytes = std::fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0);
    let size_gb = size_bytes as f64 / (1024.0 * 1024.0 * 1024.0);

    // Remove target .gguf file
    std::fs::remove_file(&target_path)
        .with_context(|| format!("Failed to delete model file {}", target_path.display()))?;

    // Also look for and remove any .alias files pointing to this file
    let mut removed_aliases = 0usize;
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.extension().is_some_and(|e| e == "alias") {
                if let Ok(content) = std::fs::read_to_string(&p) {
                    if content.trim() == filename {
                        let _ = std::fs::remove_file(&p);
                        removed_aliases += 1;
                    }
                }
            }
        }
    }

    println!("Deleted model '{}' ({:.2} GB freed).", filename, size_gb);
    if removed_aliases > 0 {
        println!("Cleaned up {} associated alias(es).", removed_aliases);
    }
    Ok(())
}

/// Copy or create an alias for a local model
pub fn cp_model(source: &str, target: &str) -> Result<()> {
    cp_model_in(source, target, &crate::llm::pull::models_dir())
}

pub fn cp_model_in(source: &str, target: &str, dir: &Path) -> Result<()> {
    std::fs::create_dir_all(dir)?;

    let source_path = model_resolver::resolve_model(source, dir)
        .with_context(|| format!("Cannot copy: source model '{source}' not found"))?;

    let filename = source_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let clean = target.replace(':', "-");
    let alias_path = dir.join(format!("{clean}.alias"));
    std::fs::write(&alias_path, filename.as_bytes())?;

    if !target.contains(':') {
        let base_alias = dir.join(format!("{target}.alias"));
        let _ = std::fs::write(&base_alias, filename.as_bytes());
    }

    println!("Copied '{}' -> '{}'", source, target);
    println!("Created alias pointing to: {}", filename);
    println!("Now accessible via:\n  ckc --local --model {}", target);
    Ok(())
}

/// Show detailed metadata and architecture info for a local GGUF model
pub fn show_model(query: &str) -> Result<()> {
    let dir = crate::llm::pull::models_dir();
    let path = model_resolver::resolve_model(query, &dir)
        .with_context(|| format!("Model '{query}' not found. Use 'ckc models' to view installed models."))?;

    let meta = std::fs::metadata(&path)?;
    let size_gb = meta.len() as f64 / (1024.0 * 1024.0 * 1024.0);

    println!("Loading metadata for {}...", path.display());
    let reader = GgufReader::load(&path.to_string_lossy())?;

    let arch = reader
        .metadata_str
        .get("general.architecture")
        .cloned()
        .unwrap_or_else(|| "unknown".to_string());

    let name = reader
        .metadata_str
        .get("general.name")
        .cloned()
        .unwrap_or_else(|| query.to_string());

    // Parameters calculation: sum of all tensor elements
    let total_elements: i64 = reader.tensors.values().map(|t| t.nelements()).sum();
    let params_str = if total_elements > 1_000_000_000 {
        format!("{:.2}B", total_elements as f64 / 1_000_000_000.0)
    } else if total_elements > 1_000_000 {
        format!("{:.2}M", total_elements as f64 / 1_000_000.0)
    } else {
        format!("{}", total_elements)
    };

    let context_length = reader
        .metadata_int
        .get(&format!("{arch}.context_length"))
        .or_else(|| reader.metadata_int.get("general.context_length"))
        .copied()
        .unwrap_or(32768);

    let embedding_length = reader
        .metadata_int
        .get(&format!("{arch}.embedding_length"))
        .copied()
        .unwrap_or(0);

    let block_count = reader
        .metadata_int
        .get(&format!("{arch}.block_count"))
        .copied()
        .unwrap_or(0);

    let head_count = reader
        .metadata_int
        .get(&format!("{arch}.attention.head_count"))
        .copied()
        .unwrap_or(0);

    let head_count_kv = reader
        .metadata_int
        .get(&format!("{arch}.attention.head_count_kv"))
        .copied()
        .unwrap_or(head_count);

    // Quantization estimation from tensors
    let quant_type = reader
        .tensors
        .get("token_embd.weight")
        .or_else(|| reader.tensors.values().find(|t| t.name.contains("weight")))
        .map(|t| format!("{:?}", t.ty))
        .unwrap_or_else(|| "Q4_K_M".to_string());

    println!();
    println!("Model Information");
    println!("  Name:              {}", name);
    println!("  Architecture:      {}", arch);
    println!("  Parameters:        {}", params_str);
    println!("  Quantization:      {}", quant_type);
    println!("  Context Length:    {} tokens", context_length);
    println!("  Embedding Dim:     {}", embedding_length);
    println!("  Layers (blocks):   {}", block_count);
    println!("  Attention Heads:   {} (KV heads: {})", head_count, head_count_kv);
    println!("  Total Tensors:     {}", reader.tensors.len());
    println!();
    println!("File Information");
    println!("  Path:              {}", path.display());
    println!("  File Size:         {:.2} GB", size_gb);
    println!("  Format:            GGUF");
    println!();
    println!("Hardware Compatibility (GTX 1650 - 4GB VRAM)");
    if size_gb <= 2.2 {
        println!("  Status:            [Optimal] Entire model fits in VRAM with large KV-cache (~8k-16k tokens)");
        println!("  Recommended Args:  ckc --local --model {}", query);
    } else if size_gb <= 3.2 {
        println!("  Status:            [Compatible] Model fits in VRAM with standard KV-cache (~2k-4k tokens)");
        println!("  Recommended Args:  ckc --local --model {}", query);
    } else {
        println!("  Status:            [Tight / High VRAM] May exceed usable 4GB VRAM; CPU fallback recommended");
        println!("  Recommended Args:  ckc --local --no-gpu --model {}", query);
    }
    println!();
    Ok(())
}

/// Show system hardware, VRAM, and model runtime status
pub fn ps_status() -> Result<()> {
    println!("ChronoKairo Coder (CKC) — Runtime Status");
    println!("========================================\n");

    // 1. Hardware & Acceleration
    println!("Compute Acceleration:");
    #[cfg(feature = "gpu")]
    {
        if crate::llm::infer::gpu::is_available() {
            println!("  GPU (OpenCL):      Active");
        } else {
            println!("  GPU (OpenCL):      Not detected / unavailable");
        }
    }
    #[cfg(not(feature = "gpu"))]
    {
        println!("  GPU (OpenCL):      Disabled (compile with --features gpu to enable)");
    }
    let workers = crate::llm::infer::ops::worker_count();
    println!("  CPU Workers:       {} threads for matrix operations", workers);
    println!("  Available Cores:   {}", std::thread::available_parallelism().map_or(1, |n| n.get()));
    println!();

    // 2. Storage & Model Cache
    let models_dir = crate::llm::pull::models_dir();
    let mut total_size_bytes = 0u64;
    let mut model_count = 0usize;
    if let Ok(entries) = std::fs::read_dir(&models_dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.extension().is_some_and(|e| e.eq_ignore_ascii_case("gguf")) {
                model_count += 1;
                if let Ok(meta) = p.metadata() {
                    total_size_bytes += meta.len();
                }
            }
        }
    }
    let total_size_gb = total_size_bytes as f64 / (1024.0 * 1024.0 * 1024.0);
    println!("Model Storage (~/.chronokairo/models):");
    println!("  Path:              {}", models_dir.display());
    println!("  Local Models:      {} GGUF models", model_count);
    println!("  Total Disk Used:   {:.2} GB", total_size_gb);
    println!();

    // 3. Environment & Active Modes
    println!("Environment:");
    println!("  Workspace:         {}", std::env::current_dir().map(|p| p.display().to_string()).unwrap_or_else(|_| ".".to_string()));
    let gpu_env = std::env::var("CKC_NO_GPU").unwrap_or_else(|_| "0".to_string());
    println!("  CKC_NO_GPU:        {}", if gpu_env == "1" || gpu_env == "true" { "Enabled (CPU only)" } else { "Disabled (GPU allowed)" });
    println!();
    Ok(())
}

/// Run direct local inference or interactive chat
pub fn run_direct(query: &str, prompt: Option<&str>, no_gpu: bool) -> Result<()> {
    let dir = crate::llm::pull::models_dir();
    let blob_path = model_resolver::resolve_model(query, &dir)
        .with_context(|| format!("Model '{query}' not found. Use 'ckc pull {query}' first."))?;

    eprintln!("Loading {} from {}...", query, blob_path.display());
    let model = Model::load(&blob_path.to_string_lossy())?;
    let reader = GgufReader::load(&blob_path.to_string_lossy())?;
    let tokenizer = Tokenizer::load_from_gguf(&reader)?;
    let mut engine = InferenceEngine::new(model, tokenizer, 2048);

    if no_gpu {
        engine.disable_gpu();
        eprintln!("GPU acceleration disabled; running on CPU.");
    } else if engine.gpu_active() {
        eprintln!("GPU acceleration active (OpenCL).");
    }

    match prompt {
        Some(p) => {
            let start = std::time::Instant::now();
            let (_, tokens) = engine.generate_interactive(p, 512, 0.7, 40)?;
            let elapsed = start.elapsed();
            let tps = if elapsed.as_secs_f64() > 0.0 {
                tokens as f64 / elapsed.as_secs_f64()
            } else {
                0.0
            };
            eprintln!("\n[{tokens} tokens in {:.2}s — {:.1} tok/s]", elapsed.as_secs_f64(), tps);
        }
        None => {
            println!("\nChronoKairo Interactive Model Runner (Zero-Lib Local Inference)");
            println!("Model: {} | Type /bye, /exit or Ctrl+C to quit.\n", query);

            use std::io::BufRead;
            let stdin = std::io::stdin();
            let mut handle = stdin.lock();

            loop {
                print!(">>> ");
                std::io::stdout().flush().ok();
                let mut line = String::new();
                if handle.read_line(&mut line)? == 0 {
                    break;
                }
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                if trimmed == "/exit" || trimmed == "/bye" || trimmed == "/quit" {
                    break;
                }
                let start = std::time::Instant::now();
                let (_, tokens) = engine.generate_interactive(trimmed, 512, 0.7, 40)?;
                let elapsed = start.elapsed();
                let tps = if elapsed.as_secs_f64() > 0.0 {
                    tokens as f64 / elapsed.as_secs_f64()
                } else {
                    0.0
                };
                println!("[{tokens} tokens in {:.2}s — {:.1} tok/s]\n", elapsed.as_secs_f64(), tps);
            }
        }
    }
    Ok(())
}

/// Enhanced detailed list of available models (including Ollama models)
pub fn list_models_detailed(models_dir: &Path) -> Result<()> {
    let mut entries_found = Vec::new();
    let roots = model_resolver::candidate_roots(models_dir);

    for root in roots {
        if !root.exists() {
            continue;
        }
        // 1. Direct .gguf files
        if let Ok(entries) = std::fs::read_dir(&root) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() && p.extension().is_some_and(|e| e.eq_ignore_ascii_case("gguf")) {
                    let fname = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                    let size_gb = p.metadata().map(|m| m.len() as f64 / (1024.0 * 1024.0 * 1024.0)).unwrap_or(0.0);
                    let (name, quant) = if let Some(tm) = crate::llm::pull::TRUSTED_MODELS.iter().find(|tm| tm.filename.eq_ignore_ascii_case(&fname)) {
                        (tm.name.to_string(), "Q4_K_M")
                    } else {
                        let q = if fname.to_lowercase().contains("q4_k_m") {
                            "Q4_K_M"
                        } else if fname.to_lowercase().contains("q4_0") {
                            "Q4_0"
                        } else if fname.to_lowercase().contains("q8_0") {
                            "Q8_0"
                        } else {
                            "GGUF"
                        };
                        (fname.clone(), q)
                    };
                    entries_found.push((name, fname, format!("{:.2} GB", size_gb), quant.to_string(), "Local".to_string()));
                }
            }
        }

        // 2. Ollama manifests
        let manifests_root = root
            .join("manifests")
            .join("registry.ollama.ai")
            .join("library");
        if let Ok(entries) = std::fs::read_dir(&manifests_root) {
            for entry in entries.flatten() {
                let model_name = entry.file_name().to_string_lossy().to_string();
                let model_path = entry.path();
                if let Ok(tags) = std::fs::read_dir(&model_path) {
                    for tag_entry in tags.flatten() {
                        let tag = tag_entry.file_name().to_string_lossy().to_string();
                        let tag_path = tag_entry.path();
                        if let Ok(data) = std::fs::read(&tag_path) {
                            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&data) {
                                if let Some(layers) = val["layers"].as_array() {
                                    if let Some(model_layer) = layers.iter().find(|l| l["mediaType"].as_str().is_some_and(|m| m.contains("model"))) {
                                        if let Some(digest) = model_layer["digest"].as_str() {
                                            let clean_digest = digest.replace("sha256:", "sha256-");
                                            let blob_path = root.join("blobs").join(&clean_digest);
                                            if blob_path.is_file() {
                                                let size_gb = blob_path.metadata().map(|m| m.len() as f64 / (1024.0 * 1024.0 * 1024.0)).unwrap_or(0.0);
                                                let name = format!("{model_name}:{tag}");
                                                let fname = format!("sha256:{}...", &clean_digest.strip_prefix("sha256-").unwrap_or(&clean_digest)[..12]);
                                                entries_found.push((name, fname, format!("{:.2} GB", size_gb), "Ollama (GGUF)".to_string(), "Ollama".to_string()));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    entries_found.sort_by(|a, b| a.0.cmp(&b.0));
    entries_found.dedup_by(|a, b| a.0 == b.0);

    if entries_found.is_empty() {
        println!("No local models found in ~/.chronokairo/models or ~/.ollama/models");
        println!("Tip: run 'ckc pull qwen2.5-coder:3b' to download a verified model.");
        return Ok(());
    }

    println!("{:<24} {:<24} {:<10} {:<16} {:<10}", "NAME", "ID / BLOB", "SIZE", "FORMAT", "SOURCE");
    println!("{:<24} {:<24} {:<10} {:<16} {:<10}", "----", "---------", "----", "------", "------");
    for (name, fname, size, quant, source) in entries_found {
        println!("{:<24} {:<24} {:<10} {:<16} {:<10}", name, fname, size, quant, source);
    }
    println!();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_models_dir(tag: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("ckc-manage-{tag}"));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn ps_status_runs_without_panic() {
        assert!(ps_status().is_ok());
    }

    #[test]
    fn list_models_detailed_handles_empty() {
        let dir = temp_models_dir("empty");
        assert!(list_models_detailed(&dir).is_ok());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn list_models_detailed_formats_table() {
        let dir = temp_models_dir("table");
        std::fs::write(dir.join("test-model.gguf"), b"test-data").unwrap();
        assert!(list_models_detailed(&dir).is_ok());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cp_and_rm_model_lifecycle() {
        let dir = temp_models_dir("cp_rm");
        let model_file = dir.join("my-cool-coder.gguf");
        std::fs::write(&model_file, b"weights-data").unwrap();

        // Copy / alias
        assert!(cp_model_in("my-cool-coder", "coder", &dir).is_ok());
        assert!(dir.join("coder.alias").is_file());
        let alias_content = std::fs::read_to_string(dir.join("coder.alias")).unwrap();
        assert_eq!(alias_content, "my-cool-coder.gguf");

        // Remove
        assert!(rm_model_in("coder", &dir).is_ok());
        assert!(!model_file.exists());
        assert!(!dir.join("coder.alias").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }
}
