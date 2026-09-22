//! i18n minimal — inspirado em `microsoft/edit` `i18n/edit.toml` + `EDIT_CFG_LANGUAGES`.
//! Centraliza strings de UI; build-time filtra via env `CKI_LANGS` (ex: "en,pt-BR").

use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct I18n {
    lang: String,
    table: HashMap<String, String>,
}

impl I18n {
    pub fn new(lang: &str) -> Self {
        let mut table = HashMap::new();
        // en defaults — edit.toml-like flat map
        table.insert("file_saved".into(), "File saved".into());
        table.insert("search_no_results".into(), "No results".into());
        table.insert("picker_prompt".into(), "Type to filter (Ctrl+P)".into());
        table.insert("confirm_overwrite".into(), "Overwrite existing file?".into());

        let mut i18n = Self { lang: lang.to_string(), table };
        // pt-BR overlay
        if lang.starts_with("pt") {
            i18n.table.insert("file_saved".into(), "Arquivo salvo".into());
            i18n.table.insert("search_no_results".into(), "Nenhum resultado".into());
            i18n.table.insert("picker_prompt".into(), "Digite para filtrar (Ctrl+P)".into());
            i18n.table.insert("confirm_overwrite".into(), "Sobrescrever arquivo existente?".into());
        }
        if lang.starts_with("es") {
            i18n.table.insert("file_saved".into(), "Archivo guardado".into());
        }
        if lang.starts_with("fr") {
            i18n.table.insert("file_saved".into(), "Fichier enregistré".into());
        }
        if lang.starts_with("de") {
            i18n.table.insert("file_saved".into(), "Datei gespeichert".into());
        }
        if lang.starts_with("ja") {
            i18n.table.insert("file_saved".into(), "ファイルを保存しました".into());
        }
        i18n
    }

    pub fn detect() -> Self {
        // runtime locale detection como edit (LANG env)
        let lang = std::env::var("CKI_LANG")
            .or_else(|_| std::env::var("LANG"))
            .unwrap_or_else(|_| "en".into());
        let filtered = std::env::var("CKI_LANGS").ok();
        let lang = if let Some(allow) = filtered {
            let allowed: Vec<&str> = allow.split(',').map(|s| s.trim()).collect();
            if allowed.iter().any(|a| lang.starts_with(*a)) { lang } else { "en".into() }
        } else { lang };
        Self::new(&lang)
    }

    pub fn t(&self, key: &str) -> String {
        self.table.get(key).cloned().unwrap_or_else(|| key.to_string())
    }

    pub fn lang(&self) -> &str { &self.lang }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pt_overlay() {
        let i = I18n::new("pt-BR");
        assert_eq!(i.t("file_saved"), "Arquivo salvo");
    }
    #[test]
    fn fallback_en() {
        let i = I18n::new("xx");
        assert_eq!(i.t("file_saved"), "File saved");
    }
}
