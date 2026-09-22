const PROMPT_VERSION: &str = "0.1.0";

pub struct PlannerPrompt;

impl PlannerPrompt {
    pub fn system() -> &'static str {
        r#"You are a coding task planner. Given a task, workspace architecture, and context, output a minimal JSON plan.
Each step has a type and description.

Step types: read_file, edit_file, create_file, search_code, run_command, run_tests, answer, git_commit, git_status, done

Rules:
- edit_file MUST be used for modifying EXISTING files. Specify "filename" (relative path, e.g. "src/storage.rs").
- create_file MUST ONLY be used when creating a BRAND NEW file that does not exist yet. NEVER use create_file on existing files.
- read_file MUST include "filename" (relative path).
- run_command MUST include "command" (the exact shell command).
- search_code MUST include "pattern" (regex to search).
- run_tests MUST include the test filter in "description" (use "cargo test" for Rust projects).
- Respect existing crate architecture: ONLY import from modules and crates that exist in the repository map.
- For features or bug fixes, follow TDD: write/update tests, implement changes across existing modules using edit_file, compile check, and run tests.
- NEVER modify or weaken existing tests to make them pass; fix the implementation instead.

Output JSON format:
{
  "steps": [
    {"type": "read_file", "description": "inspect existing storage", "filename": "src/storage.rs"},
    {"type": "edit_file", "description": "add method in storage", "filename": "src/storage.rs"},
    {"type": "edit_file", "description": "update service to call storage", "filename": "src/service.rs"},
    {"type": "create_file", "description": "add new test file", "filename": "tests/test_feature.rs"},
    {"type": "run_command", "description": "compile check", "command": "cargo check"},
    {"type": "run_tests", "description": "cargo test"},
    {"type": "done", "description": "feature implemented and tested"}
  ]
}

Keep plans minimal: 1-7 steps. Only include necessary steps. Output ONLY the JSON, nothing else."#
    }

    pub fn version() -> &'static str {
        PROMPT_VERSION
    }
}

pub struct CoderPrompt;

impl CoderPrompt {
    pub fn system() -> &'static str {
        include_str!("../../prompts/coder.txt").trim()
    }

    pub fn load_project_context(workspace: &std::path::Path) -> String {
        let mut loaded = Vec::new();

        // 1. Zero-Lib ChronoContext Engine for structured Obsidian & Markdown vaults
        if workspace.join("AGENTS.md").is_file() {
            let pack = crate::repo::ChronoContextEngine::build_context_pack(workspace, None, 12000);
            if !pack.trim().is_empty() {
                loaded.push(pack);
            }
        } else {
            let candidates = ["CLAUDE.md", ".cursorrules", "CONTEXT.md"];
            for name in candidates {
                let path = workspace.join(name);
                if path.is_file() {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        let trimmed = content.trim();
                        if !trimmed.is_empty() {
                            let capped: String = trimmed.chars().take(4000).collect();
                            loaded.push(format!("### Project Instructions ({name})\n{capped}"));
                        }
                    }
                }
            }
        }
        let repo_map = crate::repo::RepoMap::build(workspace);
        let struct_map = repo_map.to_prompt_string();
        if !struct_map.is_empty() {
            loaded.push(struct_map);
        } else {
            let map = crate::repo::RepoMapGenerator::generate_map(workspace, 2000);
            if !map.is_empty() && map != "No symbols found in workspace." {
                loaded.push(map);
            }
        }
        loaded.join("\n\n")
    }

    pub fn with_context(project_context: &str) -> String {
        let base = Self::system();
        let mut prompt = base.to_string();
        if !project_context.trim().is_empty() {
            prompt.push_str("\n\nProject Instructions:\n");
            prompt.push_str(project_context.trim());
        }
        prompt
    }

    pub fn version() -> &'static str {
        PROMPT_VERSION
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_project_context_from_workspace() {
        let temp = std::env::temp_dir().join(format!("test_agents_md_{}", std::process::id()));
        std::fs::create_dir_all(&temp).unwrap();
        std::fs::write(
            temp.join("AGENTS.md"),
            "# Rules\nRule 1: Always check tests",
        )
        .unwrap();

        let ctx = CoderPrompt::load_project_context(&temp);
        assert!(ctx.contains("AGENTS.md"));
        assert!(ctx.contains("Rule 1"));

        let full_prompt = CoderPrompt::with_context(&ctx);
        assert!(full_prompt.contains("Project Instructions:"));
        assert!(full_prompt.contains("Rule 1"));

        std::fs::remove_dir_all(&temp).ok();
    }

    #[test]
    fn planner_prompt_contains_expected_sections() {
        let prompt = PlannerPrompt::system();
        assert!(prompt.contains("JSON plan"), "missing JSON plan section");
        assert!(prompt.contains("Step types:"), "missing step types");
        assert!(
            prompt.contains("Output JSON format:"),
            "missing output format"
        );
    }

    #[test]
    fn coder_prompt_contains_expected_sections() {
        let prompt = CoderPrompt::system();
        assert!(prompt.contains("Observe"), "missing Observe phase");
        assert!(prompt.contains("Act"), "missing Act phase");
        assert!(prompt.contains("Verify"), "missing Verify phase");
        assert!(prompt.contains("Repair"), "missing Repair phase");
    }

    #[test]
    fn prompts_report_version() {
        assert!(!PlannerPrompt::version().is_empty());
        assert!(!CoderPrompt::version().is_empty());
        assert_eq!(PlannerPrompt::version(), CoderPrompt::version());
    }
}
