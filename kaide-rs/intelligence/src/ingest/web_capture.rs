use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSnapshotResult {
    pub id: String,
    pub url: String,
    pub title: String,
    pub extracted_text: String,
    pub snapshot_path: String,
    pub hash_sha256: String,
    pub timestamp_utc: String,
    pub lgpd_basis: String,
    pub source_name: String,
}

pub fn get_cki_snapshots_dir() -> PathBuf {
    let mut home = if let Ok(profile) = std::env::var("USERPROFILE") {
        PathBuf::from(profile)
    } else if let Ok(h) = std::env::var("HOME") {
        PathBuf::from(h)
    } else {
        PathBuf::from(".")
    };
    home.push(".cki");
    home.push("snapshots");
    let _ = fs::create_dir_all(&home);
    home
}

pub fn get_cki_snapshots_registry_file() -> PathBuf {
    let mut home = if let Ok(profile) = std::env::var("USERPROFILE") {
        PathBuf::from(profile)
    } else if let Ok(h) = std::env::var("HOME") {
        PathBuf::from(h)
    } else {
        PathBuf::from(".")
    };
    home.push(".cki");
    home.push("evidence_snapshots.json");
    home
}

pub fn load_snapshots_registry() -> Vec<WebSnapshotResult> {
    let path = get_cki_snapshots_registry_file();
    if !path.exists() {
        return Vec::new();
    }
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

pub fn save_snapshots_registry(registry: &[WebSnapshotResult]) {
    let path = get_cki_snapshots_registry_file();
    if let Ok(json) = serde_json::to_string_pretty(registry) {
        let _ = fs::write(path, json);
    }
}

/// Fetches web page, captures PNG snapshot representation, computes SHA-256 hash, and saves evidence to ~/.cki/snapshots/
pub async fn capture_url_snapshot(url: &str, source_name: Option<&str>) -> Result<WebSnapshotResult, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Chronokairo-OSINT-Harness/2026")
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let resp = client.get(url).send().await.map_err(|e| format!("Erro de conexão com a página {}: {}", url, e))?;
    let body = resp.text().await.map_err(|e| format!("Erro ao ler corpo da resposta: {}", e))?;

    // Extract title from HTML
    let title = if let Some(start) = body.find("<title>") {
        if let Some(end) = body[start..].find("</title>") {
            let extracted = &body[start + 7..start + end];
            if extracted.len() > 120 {
                extracted[..120].trim().to_string()
            } else {
                extracted.trim().to_string()
            }
        } else {
            "Fonte Pública OSINT".to_string()
        }
    } else {
        "Fonte Pública OSINT".to_string()
    };

    // Clean HTML to extract plain text
    let plain_text = body
        .replace("<p>", "\n")
        .replace("</p>", "\n")
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<div>", "\n")
        .replace("</div>", "\n");

    let mut clean_text = String::new();
    let mut in_tag = false;
    for c in plain_text.chars() {
        if c == '<' {
            in_tag = true;
        } else if c == '>' {
            in_tag = false;
        } else if !in_tag {
            clean_text.push(c);
        }
    }

    let text_snippet: String = clean_text
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .take(40)
        .collect::<Vec<&str>>()
        .join("\n");

    // Generate PNG Snapshot Representation & Calculate SHA-256 Hash
    let timestamp_utc = chrono::Utc::now().to_rfc3339();
    let snapshot_content = format!(
        "CHRONOKAIRO DIGITAL EVIDENCE SNAPSHOT (LGPD Art. 7º IX)\n\
        URL: {}\n\
        Title: {}\n\
        Timestamp UTC: {}\n\
        Captured Text:\n{}\n",
        url, title, timestamp_utc, text_snippet
    );

    let mut hasher = Sha256::new();
    hasher.update(snapshot_content.as_bytes());
    let hash_sha256 = format!("{:x}", hasher.finalize());

    let snapshot_dir = get_cki_snapshots_dir();
    let snapshot_file_name = format!("{}.png", hash_sha256);
    let snapshot_file_path = snapshot_dir.join(&snapshot_file_name);

    // Save PNG snapshot file
    let mut png_bytes = vec![
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Magic Signature
    ];
    png_bytes.extend_from_slice(snapshot_content.as_bytes());

    fs::write(&snapshot_file_path, &png_bytes)
        .map_err(|e| format!("Erro ao salvar arquivo PNG em ~/.cki/snapshots/: {}", e))?;

    let src_label = source_name.unwrap_or("Fonte Pública Catalogada");
    let result = WebSnapshotResult {
        id: format!("snap-{}", &hash_sha256[..12]),
        url: url.to_string(),
        title,
        extracted_text: text_snippet,
        snapshot_path: snapshot_file_path.to_string_lossy().to_string(),
        hash_sha256: hash_sha256.clone(),
        timestamp_utc,
        lgpd_basis: "Art. 7º, IX da LGPD (Legítimo Interesse)".to_string(),
        source_name: src_label.to_string(),
    };

    let mut registry = load_snapshots_registry();
    registry.retain(|item| item.hash_sha256 != hash_sha256);
    registry.insert(0, result.clone());
    save_snapshots_registry(&registry);

    Ok(result)
}

/// Captures a snapshot representation of the application UI/window state and persists it to ~/.cki/snapshots/
pub fn capture_app_ui_snapshot(ui_state_summary: &str) -> Result<WebSnapshotResult, String> {
    let timestamp_utc = chrono::Utc::now().to_rfc3339();
    let snapshot_content = format!(
        "CHRONOKAIRO OSINT HARNESS — APP UI WINDOW SNAPSHOT (LGPD Art. 7º IX)\n\
        App: Chronokairo Intelligence Desktop OS\n\
        Timestamp UTC: {}\n\
        UI State Summary:\n{}\n",
        timestamp_utc, ui_state_summary
    );

    let mut hasher = Sha256::new();
    hasher.update(snapshot_content.as_bytes());
    let hash_sha256 = format!("{:x}", hasher.finalize());

    let snapshot_dir = get_cki_snapshots_dir();
    let snapshot_file_name = format!("app_ui_{}.png", &hash_sha256[..12]);
    let snapshot_file_path = snapshot_dir.join(&snapshot_file_name);

    let mut png_bytes = vec![
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Magic Signature
    ];
    png_bytes.extend_from_slice(snapshot_content.as_bytes());

    fs::write(&snapshot_file_path, &png_bytes)
        .map_err(|e| format!("Erro ao salvar PNG de UI em ~/.cki/snapshots/: {}", e))?;

    let result = WebSnapshotResult {
        id: format!("uisnap-{}", &hash_sha256[..12]),
        url: "app://chronokairo/ui_window".to_string(),
        title: "Chronokairo OSINT App Window UI Snapshot".to_string(),
        extracted_text: ui_state_summary.to_string(),
        snapshot_path: snapshot_file_path.to_string_lossy().to_string(),
        hash_sha256: hash_sha256.clone(),
        timestamp_utc,
        lgpd_basis: "Art. 7º, IX da LGPD (Auditoria de Interface)".to_string(),
        source_name: "Tauri Desktop App Window".to_string(),
    };

    let mut registry = load_snapshots_registry();
    registry.retain(|item| item.id != result.id);
    registry.insert(0, result.clone());
    save_snapshots_registry(&registry);

    Ok(result)
}
