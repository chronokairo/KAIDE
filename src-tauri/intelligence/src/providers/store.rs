use std::collections::HashMap;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use crate::models_dev::Catalog;

/// A single configured provider entry.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct ProviderEntry {
    /// The API key — stored in the config file (never logged).
    pub api_key: Option<String>,
    /// Override the default API base URL (e.g. for proxies).
    pub api_base: Option<String>,
    /// Whether this provider is enabled for routing.
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool { true }

/// All configured providers, keyed by provider_id matching models.dev.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct ProviderStore {
    #[serde(flatten)]
    pub providers: HashMap<String, ProviderEntry>,
}

impl ProviderStore {
    /// Load from `~/.config/rustcode/providers.toml`.
    /// Returns empty store if file doesn't exist yet.
    pub fn load() -> Self {
        Self::load_inner().unwrap_or_default()
    }

    fn load_inner() -> Result<Self> {
        let path = config_path()?;
        if !path.exists() { return Ok(Self::default()); }
        let text = std::fs::read_to_string(&path)
            .with_context(|| format!("reading {}", path.display()))?;
        toml::from_str(&text).context("parsing providers.toml")
    }

    /// Persist to disk with 0600 permissions (owner read/write only on Unix).
    pub fn save(&self) -> Result<()> {
        let path = config_path()?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("creating {}", parent.display()))?;
        }
        let text = toml::to_string_pretty(self).context("serialising providers")?;
        std::fs::write(&path, &text)
            .with_context(|| format!("writing {}", path.display()))?;
        #[cfg(unix)]
        {
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))
                .with_context(|| format!("chmod 600 {}", path.display()))?;
        }
        Ok(())
    }

    /// Set (or update) an API key for a provider_id.
    pub fn set_key(&mut self, provider_id: &str, api_key: &str) {
        let entry = self.providers.entry(provider_id.to_string()).or_default();
        entry.api_key = Some(api_key.to_string());
        entry.enabled = true;
    }

    /// Set a custom API base URL for a provider.
    pub fn set_base(&mut self, provider_id: &str, api_base: &str) {
        let entry = self.providers.entry(provider_id.to_string()).or_default();
        entry.api_base = Some(api_base.to_string());
    }

    /// Remove a provider (unset key + config).
    pub fn remove(&mut self, provider_id: &str) {
        self.providers.remove(provider_id);
    }

    /// Enable or disable a provider without removing the key.
    pub fn set_enabled(&mut self, provider_id: &str, enabled: bool) {
        if let Some(e) = self.providers.get_mut(provider_id) {
            e.enabled = enabled;
        }
    }

    /// Retrieve the API key for a provider (None if not configured).
    pub fn api_key(&self, provider_id: &str) -> Option<&str> {
        self.providers.get(provider_id)
            .and_then(|e| e.api_key.as_deref())
    }

    /// Configured providers that are enabled and have a key.
    pub fn active_providers(&self) -> Vec<(&str, &ProviderEntry)> {
        self.providers.iter()
            .filter(|(_, e)| e.enabled && e.api_key.is_some())
            .map(|(id, e)| (id.as_str(), e))
            .collect()
    }

    pub fn config_path_display() -> String {
        config_path()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| "~/.config/rustcode/providers.toml".into())
    }

    /// Scan the current environment (plus an optional .env file) for known
    /// provider API key vars (from the models.dev catalog) and return those
    /// found but not yet configured in the store.
    pub fn detect_env_keys(catalog: &Catalog) -> Vec<(String, String, String)> {
        // Build a merged map: real env vars + .env file (env takes precedence)
        let env_map = load_env_with_dotenv();

        let store = Self::load();
        let mut found: Vec<(String, String, String)> = Vec::new();

        for (pid, prov) in catalog {
            if store.providers.get(pid).and_then(|e| e.api_key.as_deref()).is_some() {
                continue;
            }
            for env_name in &prov.env {
                if let Some(val) = env_map.get(env_name) {
                    if !val.is_empty() {
                        found.push((pid.clone(), env_name.clone(), val.clone()));
                        break;
                    }
                }
            }
        }
        found
    }

    /// Import keys found in environment (and .env file) into the store and persist.
    pub fn import_from_env(catalog: &Catalog) -> Result<Vec<String>> {
        let detected = Self::detect_env_keys(catalog);
        if detected.is_empty() { return Ok(vec![]); }
        let mut store = Self::load();
        let mut imported = Vec::new();
        for (pid, env_name, key) in detected {
            store.set_key(&pid, &key);
            imported.push(format!("{pid} (from ${env_name})"));
        }
        store.save()?;
        Ok(imported)
    }

    /// Resolve cloud endpoint + API key for a provider.
    ///
    /// Base URL priority: store override → models.dev catalog default → built-in default.
    /// Key priority: store key → environment / `.env` file (e.g. `NVIDIA_API_KEY`).
    pub fn resolve_cloud_credentials(provider_id: &str, catalog: &Catalog) -> Result<(String, String)> {
        let env_name = catalog.get(provider_id)
            .and_then(|p| p.env.first().map(|s| s.as_str()))
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("{}_API_KEY", provider_id.to_uppercase().replace('-', "_")));

        let store = Self::load();
        let key = store.api_key(provider_id).map(|s| s.to_string())
            .or_else(|| load_env_with_dotenv().get(&env_name).filter(|v| !v.is_empty()).cloned())
            .with_context(|| format!(
                "no API key for provider '{provider_id}' (set via 'rust-agent providers set {provider_id} <key>' or ${env_name})"
            ))?;

        let base = store.providers.get(provider_id)
            .and_then(|e| e.api_base.clone())
            .or_else(|| catalog.get(provider_id).filter(|p| !p.api.is_empty()).map(|p| p.api.clone()))
            .unwrap_or_else(|| crate::providers::verify::default_base(provider_id));

        Ok((base, key))
    }
}

fn config_path() -> Result<PathBuf> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("XDG_CONFIG_HOME"))
        .context("HOME not set")?;
    Ok(PathBuf::from(home).join(".config").join("rustcode").join("providers.toml"))
}

/// Build a merged env-var map: real process environment + .env file in the
/// current working directory (real env takes precedence over .env values).
fn load_env_with_dotenv() -> HashMap<String, String> {
    let mut map: HashMap<String, String> = std::env::vars().collect();

    // Try project .env in cwd, then parent dirs up to 3 levels
    let candidates = [
        std::env::current_dir().ok().map(|p| p.join(".env")),
        std::env::current_dir().ok().and_then(|p| p.parent().map(|pp| pp.join(".env"))),
    ];
    for maybe_path in candidates.into_iter().flatten() {
        if maybe_path.exists() {
            if let Ok(text) = std::fs::read_to_string(&maybe_path) {
                for line in text.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('#') { continue; }
                    // Remove optional `export ` prefix
                    let line = line.strip_prefix("export ").unwrap_or(line);
                    if let Some((k, v)) = line.split_once('=') {
                        let k = k.trim().to_string();
                        let v_trimmed = v.trim();
                        let val = if (v_trimmed.starts_with('"') && v_trimmed.ends_with('"') && v_trimmed.len() >= 2)
                            || (v_trimmed.starts_with('\'') && v_trimmed.ends_with('\'') && v_trimmed.len() >= 2)
                        {
                            v_trimmed[1..v_trimmed.len() - 1].to_string()
                        } else {
                            v_trimmed.split('#').next().unwrap_or("").trim().to_string()
                        };
                        map.entry(k).or_insert(val);
                    }
                }
                break; // use first .env found
            }
        }
    }
    map
}

/// Load `.env` (cwd + parent dirs) into the process environment so cloud keys
/// and model overrides (e.g. `NVIDIA_API_KEY`, `CODER_MODEL`) are visible to
/// `std::env::var` everywhere. Existing vars are not overridden (dotenv convention).
pub fn load_dotenv() {
    for (k, v) in load_env_with_dotenv() {
        if std::env::var_os(&k).is_none() {
            std::env::set_var(&k, v);
        }
    }
}

/// Pretty-print the store for `providers show`.
/// Also shows any keys detectable from environment that aren't yet configured.
pub fn print_store(store: &ProviderStore, catalog: &Catalog) {
    println!("\n  Configured cloud providers");
    println!("  Config: {}", ProviderStore::config_path_display());
    println!("{}", "─".repeat(70));
    println!("  {:<20} {:<8} {:<10} {:<30}", "Provider", "Enabled", "Key", "API base");
    println!("{}", "─".repeat(70));

    // Only show providers that are configured or have keys in env
    let env_detected: Vec<_> = ProviderStore::detect_env_keys(catalog);
    let env_providers: std::collections::HashSet<&str> =
        env_detected.iter().map(|(pid, _, _)| pid.as_str()).collect();

    let mut ids: Vec<String> = store.providers.keys().cloned().collect();
    for (pid, _, _) in &env_detected {
        if !ids.contains(pid) { ids.push(pid.clone()); }
    }
    ids.sort();

    for id in &ids {
        let entry = store.providers.get(id);
        let in_env = env_providers.contains(id.as_str());
        let enabled = entry.map(|e| e.enabled).unwrap_or(in_env);
        let key_status = match entry.and_then(|e| e.api_key.as_deref()) {
            Some(k) => mask_key(k),
            None if in_env => "env (not saved)".into(),
            None => "—".into(),
        };
        let base = entry.and_then(|e| e.api_base.as_deref())
            .or_else(|| catalog.get(id).map(|p| p.api.as_str()))
            .unwrap_or("—");
        let enabled_str = if enabled { "yes" } else { "—" };
        println!("  {:<20} {:<8} {:<15} {:<30}", id, enabled_str, key_status, base);
    }

    if ids.is_empty() {
        println!("  (none — use: rust-agent providers set <id> <api-key>)");
        println!("  (or:   rust-agent providers import   to read from environment)");
    } else if !env_detected.is_empty() {
        let unsaved: Vec<_> = env_detected.iter()
            .filter(|(pid, _, _)| store.providers.get(pid).and_then(|e| e.api_key.as_deref()).is_none())
            .map(|(pid, env, _)| format!("{pid} (${env})"))
            .collect();
        if !unsaved.is_empty() {
            println!("\n  ⚡ Keys found in environment but not yet saved:");
            for s in &unsaved { println!("     {s}"); }
            println!("  Run: rust-agent providers import");
        }
    }
    println!();
}

/// Show at most min(4, len/2) chars for keys > 4 chars, and completely mask shorter keys.
fn mask_key(key: &str) -> String {
    let len = key.len();
    if len <= 4 {
        "****".to_string()
    } else {
        let visible = 4.min(len / 2);
        format!("{}****", &key[..visible])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models_dev::types::{Catalog, ModelInfo, Provider};

    fn sample_catalog() -> Catalog {
        let mut m = HashMap::new();
        m.insert(
            "fake-model:1b".to_string(),
            ModelInfo {
                id: "fake-model:1b".into(),
                name: "Fake Model".into(),
                family: "fake".into(),
                reasoning: false,
                tool_call: true,
                temperature: false,
                open_weights: false,
                attachment: false,
                limit: Default::default(),
                cost: Default::default(),
                modalities: Default::default(),
                knowledge: None,
                release_date: None,
            },
        );
        let mut provs = HashMap::new();
        provs.insert(
            "fakeco".to_string(),
            Provider {
                id: "fakeco".into(),
                name: "Fake Co".into(),
                api: "https://fake.example.com/v1".into(),
                env: vec!["FAKECO_API_KEY".into()],
                doc: String::new(),
                models: m,
            },
        );
        provs
    }

    #[test]
    fn set_key_creates_enabled_entry() {
        let mut s = ProviderStore::default();
        s.set_key("fakeco", "k123");
        let e = s.providers.get("fakeco").unwrap();
        assert_eq!(e.api_key.as_deref(), Some("k123"));
        assert!(e.enabled);
        assert_eq!(s.api_key("fakeco"), Some("k123"));
    }

    #[test]
    fn remove_deletes_entry() {
        let mut s = ProviderStore::default();
        s.set_key("fakeco", "k123");
        s.remove("fakeco");
        assert!(s.providers.is_empty());
    }

    #[test]
    fn set_enabled_toggles_without_removing_key() {
        let mut s = ProviderStore::default();
        s.set_key("fakeco", "k123");
        s.set_enabled("fakeco", false);
        assert!(!s.providers["fakeco"].enabled);
        assert!(s.api_key("fakeco").is_some());
    }

    #[test]
    fn active_providers_only_returns_enabled_with_key() {
        let mut s = ProviderStore::default();
        s.set_key("a", "ka");
        s.set_key("b", "kb");
        s.set_enabled("b", false);
        let active = s.active_providers();
        assert_eq!(active.len(), 1);
        assert_eq!(active[0].0, "a");
    }

    #[test]
    fn set_base_overrides_default() {
        let mut s = ProviderStore::default();
        s.set_base("fakeco", "https://proxy.example.com");
        assert_eq!(s.providers["fakeco"].api_base.as_deref(), Some("https://proxy.example.com"));
    }

    #[test]
    fn config_path_uses_home() {
        let prev = std::env::var_os("HOME");
        std::env::set_var("HOME", "/tmp/anamnesic-store-test");
        let p = config_path().unwrap();
        assert_eq!(p, PathBuf::from("/tmp/anamnesic-store-test/.config/rustcode/providers.toml"));
        match prev {
            Some(v) => std::env::set_var("HOME", v),
            None => std::env::remove_var("HOME"),
        }
    }

    #[test]
    fn detect_env_keys_finds_unconfigured_provider() {
        let catalog = sample_catalog();
        let prev = std::env::var_os("FAKECO_API_KEY");
        std::env::set_var("FAKECO_API_KEY", "from-env");
        let found = ProviderStore::detect_env_keys(&catalog);
        let hit = found.iter().find(|(pid, _, _)| pid == "fakeco");
        assert!(hit.is_some(), "expected fakeco in {found:?}");
        match prev {
            Some(v) => std::env::set_var("FAKECO_API_KEY", v),
            None => std::env::remove_var("FAKECO_API_KEY"),
        }
    }

    #[test]
    fn mask_key_hides_most_of_key() {
        assert_eq!(mask_key("sk-abcdef123456"), "sk-a****");
        assert_eq!(mask_key("ab"), "****");
        assert_eq!(mask_key("abcdef"), "abc****");
    }
}
