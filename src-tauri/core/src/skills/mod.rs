//! Skill packs: reusable instruction documents the agent loads on demand.
//!
//! A *skill* is a Markdown file with optional YAML frontmatter that exposes a
//! short `description` and optional `tools` allowlist. The agent discovers
//! skills from two layers (project `./skills` and user `~/.chronokairo/skills`)
//! and injects the matched skill body into its context via the `load_skill`
//! tool. Skills are passive context — they never run code.

use std::path::{Path, PathBuf};

/// One loaded skill pack.
#[derive(Debug, Clone)]
pub struct Skill {
    pub name: String,
    pub description: String,
    pub body: String,
    pub source: PathBuf,
}

impl Skill {
    /// Parse a skill file. Frontmatter is delimited by leading `---` fences.
    /// Supported keys: `name`, `description`. Unknown keys are ignored.
    fn parse(path: &Path, raw: &str) -> Self {
        let (frontmatter, body) = split_frontmatter(raw);
        let mut name = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let mut description = String::new();
        for line in frontmatter.lines() {
            let line = line.trim();
            if let Some(value) = line.strip_prefix("name:") {
                let v = value.trim().trim_matches(['"', '\'']);
                if !v.is_empty() {
                    name = v.to_string();
                }
            } else if let Some(value) = line.strip_prefix("description:") {
                let v = value.trim().trim_matches(['"', '\'']);
                description = v.to_string();
            }
        }
        Skill {
            name,
            description,
            body: body.trim().to_string(),
            source: path.to_path_buf(),
        }
    }

    /// Compact one-line summary for the `list_skills` tool output.
    pub fn summary(&self) -> String {
        if self.description.is_empty() {
            self.name.clone()
        } else {
            format!("{} - {}", self.name, self.description)
        }
    }
}

fn split_frontmatter(raw: &str) -> (&str, &str) {
    let trimmed = raw.trim_start_matches('\u{feff}');
    let after = trimmed
        .strip_prefix("---\n")
        .or_else(|| trimmed.strip_prefix("---\r\n"));
    if let Some(rest) = after {
        if let Some(end) = rest.find("\n---\n").or_else(|| rest.find("\r\n---\r\n")) {
            let body_start = end + rest[end..].find("---\n").map(|i| i + 4).unwrap_or(5);
            return (&rest[..end], &rest[body_start..]);
        }
        if let Some(end) = rest.find("\n---") {
            let body_start = end + 4;
            let body = &rest[body_start..];
            let body = body
                .strip_prefix('\n')
                .or_else(|| body.strip_prefix("\r\n"))
                .unwrap_or(body);
            return (&rest[..end], body);
        }
    }
    ("", raw)
}

/// In-memory index of all discovered skills, keyed by lowercased name.
#[derive(Debug, Clone, Default)]
pub struct SkillRegistry {
    skills: Vec<Skill>,
}

impl SkillRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Discover skills from the given directories (later dirs win on name
    /// collisions, mirroring the project-over-user precedence used for the
    /// embedding model resolution).
    pub fn load_from(&mut self, dirs: impl IntoIterator<Item = PathBuf>) {
        self.skills.clear();
        for dir in dirs {
            self.scan_dir(&dir);
        }
        self.skills
            .sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        self.skills
            .dedup_by(|a, b| a.name.eq_ignore_ascii_case(&b.name));
    }

    fn scan_dir(&mut self, dir: &Path) {
        let Ok(entries) = std::fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            let is_md = path
                .extension()
                .map(|ext| ext.eq_ignore_ascii_case("md"))
                .unwrap_or(false);
            if !is_md {
                continue;
            }
            let name = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            if name.is_empty() {
                continue;
            }
            let Ok(raw) = std::fs::read_to_string(&path) else {
                continue;
            };
            let skill = Skill::parse(&path, &raw);
            self.skills.push(skill);
        }
    }

    pub fn list(&self) -> &[Skill] {
        &self.skills
    }

    pub fn get(&self, name: &str) -> Option<&Skill> {
        self.skills
            .iter()
            .find(|skill| skill.name.eq_ignore_ascii_case(name))
    }

    pub fn is_empty(&self) -> bool {
        self.skills.is_empty()
    }
}

/// Resolve default skill search directories: project `./skills` and the
/// user-global `~/.chronokairo/skills` (plus legacy `~/.anamnesic/skills` if present).
pub fn default_skill_dirs(workspace: &Path) -> Vec<PathBuf> {
    let mut dirs = vec![workspace.join("skills")];
    let home = crate::config::home_dir();
    dirs.push(home.join(".chronokairo").join("skills"));
    let legacy = home.join(".anamnesic").join("skills");
    if legacy.is_dir() {
        dirs.push(legacy);
    }
    dirs
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_skill(dir: &Path, name: &str, body: &str) {
        std::fs::create_dir_all(dir).unwrap();
        std::fs::write(dir.join(format!("{name}.md")), body).unwrap();
    }

    #[test]
    fn parses_frontmatter_and_body() {
        let skill = Skill::parse(
            Path::new("rust-testing.md"),
            "---\nname: rust-testing\ndescription: TDD with cargo test\n---\n# Rust Testing\nRun `cargo test` first.",
        );
        assert_eq!(skill.name, "rust-testing");
        assert_eq!(skill.description, "TDD with cargo test");
        assert!(skill.body.starts_with("# Rust Testing"));
        assert!(skill.body.contains("cargo test"));
    }

    #[test]
    fn body_without_frontmatter_still_works() {
        let skill = Skill::parse(
            Path::new("notes.md"),
            "# Notes\nJust prose, no frontmatter.",
        );
        assert_eq!(skill.name, "notes");
        assert!(skill.description.is_empty());
        assert!(skill.body.starts_with("# Notes"));
    }

    #[test]
    fn registry_loads_and_dedups_with_project_precedence() {
        let project = std::env::temp_dir().join(format!("skills-proj-{}", std::process::id()));
        let user = std::env::temp_dir().join(format!("skills-user-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&project);
        let _ = std::fs::remove_dir_all(&user);
        write_skill(&user, "shared", "user-version-body");
        write_skill(&project, "shared", "project-version-body");
        write_skill(&project, "only-proj", "proj");

        let mut reg = SkillRegistry::new();
        reg.load_from(vec![project.clone(), user.clone()]);
        // project wins because it's listed first and dedup keeps the first
        assert_eq!(reg.get("shared").unwrap().body, "project-version-body");
        assert!(reg.get("only-proj").is_some());
        assert!(reg.get("missing").is_none());

        let _ = std::fs::remove_dir_all(&project);
        let _ = std::fs::remove_dir_all(&user);
    }

    #[test]
    fn summary_uses_description_when_present() {
        let skill = Skill {
            name: "x".into(),
            description: "does thing".into(),
            body: String::new(),
            source: PathBuf::new(),
        };
        assert_eq!(skill.summary(), "x - does thing");
    }

    #[test]
    fn missing_directory_is_silently_ignored() {
        let mut reg = SkillRegistry::new();
        reg.load_from(vec![PathBuf::from("/nonexistent/skills/here")]);
        assert!(reg.is_empty());
    }
}
