use crate::error::{bail, Result};
use std::path::{Path, PathBuf};

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
        models.extend(list_models_in_root(&root));
    }
    models.sort();
    models.dedup();
    models
}

/// List all model names from a single candidate root directory.
pub fn list_models_in_root(root: &Path) -> Vec<String> {
    let mut models = Vec::new();

    // 1. Direct .gguf files in root
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension() {
                    if ext.eq_ignore_ascii_case("gguf") {
                        let fname = entry.file_name().to_string_lossy().to_string();
                        let nice_name = crate::llm::pull::TRUSTED_MODELS
                            .iter()
                            .find(|tm| tm.filename.eq_ignore_ascii_case(&fname))
                            .map(|tm| tm.name.to_string())
                            .unwrap_or(fname);
                        models.push(nice_name);
                    }
                }
            }
        }
    }

    // 2. Manifests (Ollama format)
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
                    // Verify that the model blob actually exists on disk
                    if let Ok(data) = std::fs::read(&tag_path) {
                        if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&data) {
                            if let Some(layers) = val["layers"].as_array() {
                                if let Some(model_layer) = layers.iter().find(|l| l["mediaType"].as_str().is_some_and(|m| m.contains("model"))) {
                                    if let Some(digest) = model_layer["digest"].as_str() {
                                        let clean_digest = digest.replace("sha256:", "sha256-");
                                        if root.join("blobs").join(&clean_digest).is_file() {
                                            models.push(format!("{}:{}", model_name, tag));
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
    models.sort();
    models.dedup();
    models
}

pub fn candidate_roots(models_dir: &Path) -> Vec<PathBuf> {
    let mut roots = vec![models_dir.to_path_buf()];

    let chrono_models = crate::llm::pull::models_dir();
    if !roots.contains(&chrono_models) && chrono_models.exists() {
        roots.push(chrono_models);
    }

    let legacy_models = crate::config::home_dir().join(".anamnesic").join("models");
    if !roots.contains(&legacy_models) && legacy_models.exists() {
        roots.push(legacy_models);
    }

    // 1. OLLAMA_MODELS environment variable
    if let Some(ollama_env) = std::env::var_os("OLLAMA_MODELS") {
        let p = PathBuf::from(ollama_env);
        if !roots.contains(&p) && p.exists() {
            roots.push(p);
        }
    }

    // 2. User home ~/.ollama/models
    if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
        let user = PathBuf::from(home).join(".ollama").join("models");
        if !roots.contains(&user) && user.exists() {
            roots.push(user);
        }
    }

    // 3. Windows %LOCALAPPDATA%\Ollama\models
    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        let p = PathBuf::from(local_app_data).join("Ollama").join("models");
        if !roots.contains(&p) && p.exists() {
            roots.push(p);
        }
    }

    // 4. Linux system /usr/share/ollama/.ollama/models
    let system = PathBuf::from("/usr/share/ollama/.ollama/models");
    if !roots.contains(&system) && system.exists() {
        roots.push(system);
    }

    roots
}

fn try_resolve(name: &str, root: &Path) -> Option<PathBuf> {
    // 1. Direct file in root
    let direct = root.join(name);
    if direct.is_file() {
        return Some(direct);
    }
    let direct_gguf = root.join(format!("{name}.gguf"));
    if direct_gguf.is_file() {
        return Some(direct_gguf);
    }

    // 2. Alias files created by `ckc pull`
    let clean_alias = name.replace(':', "-");
    for alias_name in &[
        format!("{clean_alias}.alias"),
        format!("{name}.alias"),
        format!("{}.alias", name.split(':').next().unwrap_or(name)),
    ] {
        let alias_path = root.join(alias_name);
        if alias_path.is_file() {
            if let Ok(target) = std::fs::read_to_string(&alias_path) {
                let target = target.trim();
                let resolved = root.join(target);
                if resolved.is_file() {
                    return Some(resolved);
                }
            }
        }
    }

    // 3. Match against trusted model catalog
    let name_lower = name.to_lowercase();
    for tm in crate::llm::pull::TRUSTED_MODELS {
        if tm.name == name_lower || tm.aliases.iter().any(|&a| a == name_lower) {
            let p = root.join(tm.filename);
            if p.is_file() {
                return Some(p);
            }
        }
    }

    // 4. Substring/prefix match for .gguf files in root
    let search_token = clean_alias.to_lowercase();
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension() {
                    if ext.eq_ignore_ascii_case("gguf") {
                        let fname = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                        if fname.contains(&search_token) {
                            return Some(p);
                        }
                    }
                }
            }
        }
    }

    // 5. Ollama manifests
    let (model_name, tag) = name.split_once(':').unwrap_or((name, "latest"));

    let manifest_dir = root
        .join("manifests")
        .join("registry.ollama.ai")
        .join("library")
        .join(model_name);

    let manifest_path = if manifest_dir.join(tag).is_file() {
        manifest_dir.join(tag)
    } else if tag == "latest" && manifest_dir.is_dir() {
        // Fallback to first available tag in this model's manifest directory
        if let Ok(entries) = std::fs::read_dir(&manifest_dir) {
            entries
                .flatten()
                .filter(|e| e.path().is_file())
                .map(|e| e.path())
                .next()
                .unwrap_or_else(|| manifest_dir.join(tag))
        } else {
            manifest_dir.join(tag)
        }
    } else {
        manifest_dir.join(tag)
    };

    let data = std::fs::read(&manifest_path).ok()?;
    let manifest: serde_json::Value = serde_json::from_slice(&data).ok()?;

    let digest = manifest["layers"]
        .as_array()?
        .iter()
        .find(|l| l["mediaType"].as_str().is_some_and(|m| m.contains("model")))?["digest"]
        .as_str()?
        .replace("sha256:", "sha256-");

    let blob = root.join("blobs").join(&digest);
    if blob.exists() {
        Some(blob)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("chronokairo-models-{tag}"));
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
        let models = list_models_in_root(&root);
        assert!(
            models.contains(&"qwen3:1.7b".to_string()),
            "got: {models:?}"
        );
        assert!(models.contains(&"qwen3:latest".to_string()));
        assert!(models.contains(&"gemma3:4b".to_string()));
        assert!(
            models
                .iter()
                .all(|a| models.iter().filter(|b| *b == a).count() == 1),
            "no duplicates"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn lists_nothing_without_manifests() {
        let root = temp_dir("empty");
        let models = list_models_in_root(&root);
        assert!(models.is_empty(), "got: {models:?}");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn resolves_direct_gguf_in_root() {
        let root = temp_dir("gguf_in_root");
        let file = root.join("my-model.gguf");
        fs::write(&file, b"gguf-data").unwrap();
        let resolved = resolve_model("my-model", &root).unwrap();
        assert_eq!(resolved, file);
        let resolved_ext = resolve_model("my-model.gguf", &root).unwrap();
        assert_eq!(resolved_ext, file);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn resolves_via_alias_file() {
        let root = temp_dir("alias");
        let target = root.join("actual-weights-v1.gguf");
        fs::write(&target, b"weights").unwrap();
        fs::write(root.join("qwen2.5-coder-3b.alias"), b"actual-weights-v1.gguf").unwrap();
        let resolved = resolve_model("qwen2.5-coder:3b", &root).unwrap();
        assert_eq!(resolved, target);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn resolves_trusted_model_filename() {
        let root = temp_dir("trusted");
        let target = root.join("qwen2.5-coder-3b-instruct-q4_k_m.gguf");
        fs::write(&target, b"qwen3b").unwrap();
        let resolved = resolve_model("qwen2.5-coder:3b", &root).unwrap();
        assert_eq!(resolved, target);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn lists_direct_gguf_models() {
        let root = temp_dir("list_gguf");
        fs::write(root.join("qwen2.5-coder-3b-instruct-q4_k_m.gguf"), b"x").unwrap();
        fs::write(root.join("custom-model.gguf"), b"y").unwrap();
        let models = list_models_in_root(&root);
        assert!(models.contains(&"qwen2.5-coder:3b".to_string()));
        assert!(models.contains(&"custom-model.gguf".to_string()));
        let _ = fs::remove_dir_all(&root);
    }
}
