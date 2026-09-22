use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use crate::error::{Context, Result};
use serde::{Deserialize, Serialize};

/// Global user settings stored at `~/.chronokairo/settings.json`.
///
/// Follows Claude Code's `~/.claude/settings.json` convention: a single JSON
/// file whose top-level `env` block holds API keys and other environment
/// variables that apply globally (across every workspace). Example:
///
/// ```json
/// {
///   "env": {
///     "NVIDIA_API_KEY": "nvapi-...",
///     "OLLAMA_HOST": "http://localhost:11434"
///   }
/// }
/// ```
///
/// Values in the real process environment always win over these, which in turn
/// win over a per-project `.env` file.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct GlobalSettings {
    #[serde(default)]
    pub env: HashMap<String, String>,
}

impl GlobalSettings {
    /// Resolve the global settings file path: `~/.chronokairo/settings.json` (fallback `~/.anamnesic/settings.json`).
    pub fn path() -> PathBuf {
        let primary = home_dir().join(".chronokairo").join("settings.json");
        if !primary.exists() {
            let legacy = home_dir().join(".anamnesic").join("settings.json");
            if legacy.exists() {
                return legacy;
            }
        }
        primary
    }

    /// Load the global settings; returns an empty struct if the file is absent
    /// or unreadable (best-effort — never fatal).
    pub fn load() -> Self {
        Self::load_inner().unwrap_or_default()
    }

    fn load_inner() -> Result<Self> {
        let path = Self::path();
        if !path.exists() {
            return Ok(Self::default());
        }
        let text =
            fs::read_to_string(&path).with_context(|| format!("reading {}", path.display()))?;
        serde_json::from_str(&text).context("parsing settings.json")
    }

    /// Persist the settings file, creating `~/.chronokairo` if needed.
    pub fn save(&self) -> Result<()> {
        let path = Self::path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).with_context(|| format!("creating {}", parent.display()))?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(parent, fs::Permissions::from_mode(0o700));
            }
        }
        let text = serde_json::to_string_pretty(self).context("serialising settings")?;
        fs::write(&path, text).with_context(|| format!("writing {}", path.display()))?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
        }
        Ok(())
    }

    /// Set (or update) an env var in the settings file.
    pub fn set_env(&mut self, key: &str, value: &str) {
        self.env.insert(key.to_string(), value.to_string());
    }
}

/// Best-effort `$HOME` (falls back to `$USERPROFILE` on Windows).
pub fn home_dir() -> PathBuf {
    #[cfg(test)]
    if let Some(path) = TEST_HOME.with(|home| home.borrow().clone()) {
        return path;
    }
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

#[cfg(test)]
thread_local! {
    static TEST_HOME: std::cell::RefCell<Option<PathBuf>> = const { std::cell::RefCell::new(None) };
}

/// Isolate tests that persist keys or backups from the operator's real profile.
#[cfg(test)]
pub(crate) struct TestHome { previous: Option<PathBuf> }
#[cfg(test)]
impl TestHome {
    pub(crate) fn new() -> Self {
        let path = std::env::temp_dir().join(format!("ckc-test-home-{}-{:016x}", std::process::id(), crate::random::system_u64().unwrap()));
        std::fs::create_dir_all(&path).unwrap();
        let previous = TEST_HOME.with(|home| home.replace(Some(path)));
        Self { previous }
    }
}
#[cfg(test)]
impl Drop for TestHome {
    fn drop(&mut self) { TEST_HOME.with(|home| home.replace(self.previous.take())); }
}

#[cfg(test)]
mod tests {
    use super::*;

    static ENV_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

    #[test]
    fn round_trips_save_and_load() {
        let _guard = ENV_LOCK.lock().unwrap();
        let prev_home = std::env::var_os("HOME");
        let prev_up = std::env::var_os("USERPROFILE");
        let tmp = std::env::temp_dir().join(format!("chronokairo-globals-{}", std::process::id()));
        std::env::set_var("HOME", &tmp);
        std::env::remove_var("USERPROFILE");

        let mut s = GlobalSettings::default();
        s.set_env("NVIDIA_API_KEY", "nvapi-test-key");
        s.save().unwrap();
        let loaded = GlobalSettings::load();
        assert_eq!(
            loaded.env.get("NVIDIA_API_KEY").map(String::as_str),
            Some("nvapi-test-key")
        );
        let path = GlobalSettings::path();
        let parent_name = path
            .parent()
            .unwrap()
            .file_name()
            .unwrap()
            .to_string_lossy();
        assert!(
            parent_name.contains("chronokairo"),
            "unexpected parent {parent_name}"
        );

        let _ = fs::remove_dir_all(&tmp);
        match prev_home {
            Some(v) => std::env::set_var("HOME", v),
            None => std::env::remove_var("HOME"),
        }
        match prev_up {
            Some(v) => std::env::set_var("USERPROFILE", v),
            None => std::env::remove_var("USERPROFILE"),
        }
    }
}
