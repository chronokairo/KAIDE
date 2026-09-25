use std::path::{Path, PathBuf};
use anyhow::{Result, bail};

/// Resolves a model name (e.g. "gemma3:1b") or a direct path to a GGUF blob path.
///
/// Search order for manifests:
///   1. `models_dir` (e.g. `./models` in the project)
///   2. `/usr/share/ollama/.ollama/models` (system Ollama)
///   3. `~/.ollama/models` (user Ollama)
pub fn resolve_model(name_or_path: &str, models_dir: &Path) -> Result<PathBuf> {
    let p = Path::new(name_or_path);
    if p.exists() {
        return Ok(p.to_path_buf());
    }

    let candidates = candidate_roots(models_dir);

    for root in &candidates {
        if let Some(blob) = try_resolve(name_or_path, root) {
            return Ok(blob);
        }
    }

    bail!(
        "Model '{}' not found.\n  Searched: {}\n  Tip: use a full path to a .gguf file, or 'name:tag' matching a manifest.",
        name_or_path,
        candidates.iter().map(|p| p.display().to_string()).collect::<Vec<_>>().join(", ")
    )
}

/// List all available model names from all candidate roots.
pub fn list_models(models_dir: &Path) -> Vec<String> {
    let mut models = Vec::new();
    for root in candidate_roots(models_dir) {
        let manifests_root = root.join("manifests").join("registry.ollama.ai").join("library");
        if let Ok(entries) = std::fs::read_dir(&manifests_root) {
            for entry in entries.flatten() {
                let model_name = entry.file_name().to_string_lossy().to_string();
                let model_path = entry.path();
                if let Ok(tags) = std::fs::read_dir(&model_path) {
                    for tag_entry in tags.flatten() {
                        let tag = tag_entry.file_name().to_string_lossy().to_string();
                        models.push(format!("{}:{}", model_name, tag));
                    }
                }
            }
        }
    }
    models.sort();
    models.dedup();
    models
}

fn candidate_roots(models_dir: &Path) -> Vec<PathBuf> {
    let mut roots = vec![models_dir.to_path_buf()];

    let system = PathBuf::from("/usr/share/ollama/.ollama/models");
    if system != models_dir && system.exists() {
        roots.push(system);
    }

    if let Some(home) = std::env::var_os("HOME") {
        let user = PathBuf::from(home).join(".ollama").join("models");
        if user != models_dir && user.exists() {
            roots.push(user);
        }
    }

    roots
}

fn try_resolve(name: &str, root: &Path) -> Option<PathBuf> {
    let (model_name, tag) = name.split_once(':').unwrap_or((name, "latest"));

    let manifest_path = root
        .join("manifests")
        .join("registry.ollama.ai")
        .join("library")
        .join(model_name)
        .join(tag);

    let data = std::fs::read(&manifest_path).ok()?;
    let manifest: serde_json::Value = serde_json::from_slice(&data).ok()?;

    let digest = manifest["layers"]
        .as_array()?
        .iter()
        .find(|l| l["mediaType"].as_str().is_some_and(|m| m.contains("model")))?
        ["digest"]
        .as_str()?
        .replace("sha256:", "sha256-");

    let blob = root.join("blobs").join(&digest);
    if blob.exists() { Some(blob) } else { None }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("anamnesic-models-{tag}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// Lay out a fake Ollama manifest + matching blob inside `root`.
    fn write_manifest(root: &Path, model: &str, tag: &str, digest: &str) -> PathBuf {
        let dir = root
            .join("manifests")
            .join("registry.ollama.ai")
            .join("library")
            .join(model);
        fs::create_dir_all(&dir).unwrap();
        let manifest = serde_json::json!({
            "layers": [
                { "mediaType": "application/vnd.ollama.image.model", "digest": format!("sha256:{digest}") }
            ]
        });
        fs::write(dir.join(tag), manifest.to_string()).unwrap();
        let blob_dir = root.join("blobs");
        fs::create_dir_all(&blob_dir).unwrap();
        let blob = blob_dir.join(format!("sha256-{digest}"));
        fs::write(&blob, b"fake-gguf").unwrap();
        blob
    }

    #[test]
    fn resolves_named_model_to_blob() {
        let root = temp_dir("resolve");
        let blob = write_manifest(&root, "qwen3", "1.7b", "aaa111");
        let resolved = resolve_model("qwen3:1.7b", &root).unwrap();
        assert_eq!(resolved, blob);
        assert!(resolved.exists());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn resolves_direct_file_path() {
        let root = temp_dir("direct");
        let file = root.join("custom.gguf");
        fs::write(&file, b"data").unwrap();
        let resolved = resolve_model(file.to_str().unwrap(), &root).unwrap();
        assert_eq!(resolved, file);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn errors_when_model_missing() {
        let root = temp_dir("missing");
        let err = resolve_model("does-not-exist:9z", &root).unwrap_err();
        assert!(err.to_string().contains("not found"));
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn lists_models_from_manifests() {
        let root = temp_dir("list");
        write_manifest(&root, "qwen3", "1.7b", "b1");
        write_manifest(&root, "qwen3", "latest", "b2");
        write_manifest(&root, "gemma3", "4b", "b3");
        let models = list_models(&root);
        assert!(models.contains(&"qwen3:1.7b".to_string()), "got: {models:?}");
        assert!(models.contains(&"qwen3:latest".to_string()));
        assert!(models.contains(&"gemma3:4b".to_string()));
        assert!(models.iter().all(|a| models.iter().filter(|b| *b == a).count() == 1), "no duplicates");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn lists_nothing_without_manifests() {
        let root = temp_dir("empty");
        let models = list_models(&root);
        assert!(models.is_empty(), "got: {models:?}");
        let _ = fs::remove_dir_all(&root);
    }
}
