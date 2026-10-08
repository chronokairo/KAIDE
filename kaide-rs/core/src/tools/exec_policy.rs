//! Persistent command rules owned and enforced by the CLI runtime.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Decision { Allow, Prompt, Forbidden }

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecRule {
    pub command: String,
    pub decision: Decision,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub justification: Option<String>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ExecPolicy { pub rules: Vec<ExecRule> }

impl ExecPolicy {
    pub fn load(path: &Path) -> Result<Self, String> {
        if !path.exists() { return Ok(Self::default()); }
        let content = std::fs::read_to_string(path).map_err(|error| error.to_string())?;
        
        let mut rules = Vec::new();
        let mut in_rule = false;
        let mut current_command = String::new();
        let mut current_decision = Decision::Prompt;
        let mut current_scope: Option<String> = None;
        let mut current_justification: Option<String> = None;

        let flush_rule = |rules: &mut Vec<ExecRule>, in_rule: bool, cmd: &str, dec: Decision, sc: Option<String>, just: Option<String>| {
            if in_rule && !cmd.is_empty() {
                rules.push(ExecRule {
                    command: cmd.to_string(),
                    decision: dec,
                    scope: sc,
                    justification: just,
                });
            }
        };

        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            if line == "[[rules]]" {
                flush_rule(&mut rules, in_rule, &current_command, current_decision, current_scope.take(), current_justification.take());
                in_rule = true;
                current_command.clear();
                current_decision = Decision::Prompt;
                continue;
            }

            if in_rule {
                if let Some((k, v)) = line.split_once('=') {
                    let key = k.trim();
                    let val = v.trim().trim_matches('"').trim_matches('\'');
                    match key {
                        "command" => current_command = val.to_string(),
                        "decision" => {
                            current_decision = match val.to_lowercase().as_str() {
                                "allow" => Decision::Allow,
                                "forbidden" => Decision::Forbidden,
                                _ => Decision::Prompt,
                            };
                        }
                        "scope" => current_scope = Some(val.to_string()),
                        "justification" => current_justification = Some(val.to_string()),
                        _ => {}
                    }
                }
            }
        }
        flush_rule(&mut rules, in_rule, &current_command, current_decision, current_scope, current_justification);

        Ok(Self { rules })
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let mut content = String::new();
        for rule in &self.rules {
            content.push_str("[[rules]]\n");
            content.push_str(&format!("command = \"{}\"\n", rule.command));
            let dec_str = match rule.decision {
                Decision::Allow => "allow",
                Decision::Forbidden => "forbidden",
                Decision::Prompt => "prompt",
            };
            content.push_str(&format!("decision = \"{dec_str}\"\n"));
            if let Some(ref sc) = rule.scope {
                content.push_str(&format!("scope = \"{sc}\"\n"));
            }
            if let Some(ref j) = rule.justification {
                content.push_str(&format!("justification = \"{j}\"\n"));
            }
            content.push('\n');
        }
        std::fs::write(path, content).map_err(|error| error.to_string())
    }

    pub fn check(&self, command: &[String], workspace: Option<&Path>) -> (Decision, Option<&ExecRule>) {
        let full = command.join(" ");
        let first = command.first().map(String::as_str).unwrap_or("");
        let mut matches = self.rules.iter().filter(|rule| {
            if let Some(expected) = rule.scope.as_deref().and_then(|scope| scope.strip_prefix("workspace:")) {
                if !workspace.is_some_and(|path| path.starts_with(expected)) { return false; }
            }
            let pattern = rule.command.trim();
            pattern == "*"
                || pattern == full
                || pattern == first
                || pattern.strip_suffix(" *").is_some_and(|prefix| full.starts_with(prefix))
                || pattern.strip_prefix("* ").is_some_and(|suffix| full.ends_with(suffix))
        }).collect::<Vec<_>>();
        matches.sort_by_key(|rule| rule.decision);
        matches.last().map_or((Decision::Prompt, None), |rule| (rule.decision, Some(*rule)))
    }
}

pub fn default_path() -> PathBuf {
    crate::config::home_dir().join(".chronokairo").join("exec_policy.toml")
}

pub fn load_default() -> ExecPolicy { ExecPolicy::load(&default_path()).unwrap_or_default() }

pub fn command_is_forbidden(command: &str, workspace: &Path) -> bool {
    let tokens = command.split_whitespace().map(str::to_string).collect::<Vec<_>>();
    load_default().check(&tokens, Some(workspace)).0 == Decision::Forbidden
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn most_restrictive_matching_rule_wins() {
        let policy = ExecPolicy { rules: vec![
            ExecRule { command: "cargo *".into(), decision: Decision::Allow, scope: None, justification: None },
            ExecRule { command: "cargo test".into(), decision: Decision::Forbidden, scope: None, justification: None },
        ]};
        assert_eq!(policy.check(&["cargo".into(), "test".into()], None).0, Decision::Forbidden);
    }

    #[test]
    fn test_save_and_load_roundtrip() {
        let temp_dir = std::env::temp_dir().join(format!("chronokairo_exec_policy_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp_dir);
        let path = temp_dir.join("exec_policy.toml");

        let policy = ExecPolicy { rules: vec![
            ExecRule {
                command: "git push".into(),
                decision: Decision::Forbidden,
                scope: Some("workspace:main".into()),
                justification: Some("No direct push to main".into()),
            },
            ExecRule {
                command: "cargo check".into(),
                decision: Decision::Allow,
                scope: None,
                justification: None,
            },
        ]};

        policy.save(&path).unwrap();
        let loaded = ExecPolicy::load(&path).unwrap();

        assert_eq!(loaded.rules.len(), 2);
        assert_eq!(loaded.rules[0].command, "git push");
        assert_eq!(loaded.rules[0].decision, Decision::Forbidden);
        assert_eq!(loaded.rules[0].scope.as_deref(), Some("workspace:main"));
        assert_eq!(loaded.rules[0].justification.as_deref(), Some("No direct push to main"));
        assert_eq!(loaded.rules[1].command, "cargo check");
        assert_eq!(loaded.rules[1].decision, Decision::Allow);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
