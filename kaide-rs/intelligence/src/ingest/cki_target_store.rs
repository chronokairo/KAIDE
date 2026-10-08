use std::fs;
use std::path::PathBuf;
use sha2::{Digest, Sha256};
use crate::dossier::generator::{generate_complete_dossier, InvestigationDossier};

pub fn get_cki_targets_dir() -> PathBuf {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let mut path = PathBuf::from(home);
    path.push(".cki");
    path.push("targets");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

/// Normalizes a document string (CPF or CNPJ) into digits-only folder key.
/// E.g. "04.123.456/0001-89" -> "04123456000189", "123.456.789-00" -> "12345678900".
pub fn clean_document_key(doc_or_name: &str) -> String {
    let digits: String = doc_or_name.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() >= 8 {
        digits
    } else {
        // Fallback: derive deterministic document key from string hash
        let mut hasher = Sha256::new();
        hasher.update(doc_or_name.trim().to_lowercase().as_bytes());
        let hash = format!("{:x}", hasher.finalize());
        format!("doc_{}", &hash[..14])
    }
}

pub fn get_target_dir(target_name: &str, target_doc: &str) -> PathBuf {
    let key = if !target_doc.trim().is_empty() && target_doc != "N/A" && target_doc != "Não Informado" {
        clean_document_key(target_doc)
    } else {
        clean_document_key(target_name)
    };

    let mut path = get_cki_targets_dir();
    path.push(&key);
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

pub fn load_or_create_target_dossier(target_name: &str, target_doc: &str) -> InvestigationDossier {
    let target_dir = get_target_dir(target_name, target_doc);
    let dossier_path = target_dir.join("dossier.json");

    if dossier_path.exists() {
        if let Ok(content) = fs::read_to_string(&dossier_path) {
            if let Ok(dossier) = serde_json::from_str::<InvestigationDossier>(&content) {
                return dossier;
            }
        }
    }

    // Generate brand-new dossier for this target dynamically
    let dossier = generate_complete_dossier(target_name, target_doc);

    // Persist to ~/.cki/targets/<doc_key>/dossier.json
    if let Ok(json_str) = serde_json::to_string_pretty(&dossier) {
        let _ = fs::write(&dossier_path, json_str);
    }

    // Save graph separately as ~/.cki/targets/<doc_key>/graph.json
    let graph_path = target_dir.join("graph.json");
    if let Ok(graph_json) = serde_json::to_string_pretty(&dossier.graph) {
        let _ = fs::write(&graph_path, graph_json);
    }

    dossier
}

pub fn save_target_dossier(dossier: &InvestigationDossier) -> Result<(), String> {
    let target_dir = get_target_dir(&dossier.alvo_investigacao, &dossier.documento_alvo);
    let dossier_path = target_dir.join("dossier.json");
    let graph_path = target_dir.join("graph.json");

    let json_str = serde_json::to_string_pretty(dossier)
        .map_err(|e| format!("Erro ao serializar dossiê: {}", e))?;
    fs::write(&dossier_path, json_str)
        .map_err(|e| format!("Erro ao salvar dossiê em ~/.cki/targets/: {}", e))?;

    let graph_json = serde_json::to_string_pretty(&dossier.graph)
        .map_err(|e| format!("Erro ao serializar grafo: {}", e))?;
    let _ = fs::write(&graph_path, graph_json);

    Ok(())
}

pub fn list_stored_cki_targets() -> Vec<String> {
    let targets_dir = get_cki_targets_dir();
    let mut names = Vec::new();

    if let Ok(entries) = fs::read_dir(targets_dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                let dossier_path = entry.path().join("dossier.json");
                if dossier_path.exists() {
                    if let Ok(content) = fs::read_to_string(&dossier_path) {
                        if let Ok(dossier) = serde_json::from_str::<InvestigationDossier>(&content) {
                            names.push(format!("{} (CNPJ/CPF: {})", dossier.alvo_investigacao, dossier.documento_alvo));
                        }
                    }
                }
            }
        }
    }

    names
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_document_key_cpf_cnpj() {
        assert_eq!(clean_document_key("04.123.456/0001-89"), "04123456000189");
        assert_eq!(clean_document_key("123.456.789-00"), "12345678900");
    }

    #[test]
    fn test_target_dir_creation_by_doc() {
        let dir = get_target_dir("Chronokairo RLV", "04.123.456/0001-89");
        assert!(dir.to_string_lossy().contains("04123456000189"));
    }

    #[test]
    fn test_save_and_load_target_dossier() {
        let dossier = load_or_create_target_dossier("Empresa Teste LTDA", "04123456000189");
        assert_eq!(dossier.documento_alvo, "04123456000189");
        assert!(save_target_dossier(&dossier).is_ok());
    }
}
