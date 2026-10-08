use crate::compressor::caveman::CavemanLevel;
use crate::llm::prompt::PlannerPrompt;
use crate::llm::router::LlmRouter;
use crate::types::plan::{Plan, PlanStep};
use anyhow::Result;

pub async fn plan_task(
    client: &LlmRouter,
    model: &str,
    task: &str,
    context: &str,
    caveman: &CavemanLevel,
) -> Result<Plan> {
    let system = PlannerPrompt::with_caveman(caveman);
    let prompt = format!("{}\n\nContext:\n{}\n\nTask:\n{}", system, context, task);
    let response = client
        .generate_with_retry_with_fallback(model, &prompt, None, None)
        .await?;
    parse_plan(response, task)
}

fn parse_plan(response: String, task: &str) -> Result<Plan> {
    if let Some(json_start) = response.find('{') {
        if let Some(json_end) = response.rfind('}') {
            let json_str = &response[json_start..=json_end];
            if let Ok(plan) = serde_json::from_str::<Plan>(json_str) {
                // An empty plan is not actionable. Treat it like malformed
                // output so the agent still gives the task a direct attempt.
                if !plan.steps.is_empty() {
                    return Ok(plan);
                }
            }
        }
    }

    // Models occasionally return a shell snippet despite the JSON-only
    // instruction.  Treat one fenced shell block as a single command step;
    // the executor still applies its command allow/block policy before it can
    // run.  This is more useful than silently turning an actionable command
    // into a text-only answer.
    if let Some(command) = extract_shell_command(&response) {
        return Ok(Plan {
            steps: vec![PlanStep {
                step_type: "run_command".into(),
                description: "Run command proposed by the planner".into(),
                filename: None,
                pattern: None,
                command: Some(command),
            }],
        });
    }

    // If the user explicitly requested one of the safe verification commands,
    // do not lose that intent just because a provider returned empty or
    // non-structured planner output. These commands are also checked again by
    // the executor's allowlist before execution.
    if let Some(command) = explicit_verification_command(task) {
        return Ok(Plan {
            steps: vec![PlanStep {
                step_type: "run_command".into(),
                description: "Run explicitly requested verification command".into(),
                filename: None,
                pattern: None,
                command: Some(command.to_string()),
            }],
        });
    }

    Ok(Plan {
        steps: vec![PlanStep {
            step_type: "answer".into(),
            description: task.to_string(),
            filename: None,
            pattern: None,
            command: None,
        }],
    })
}

fn extract_shell_command(response: &str) -> Option<String> {
    let start = response.find("```")?;
    let after_fence = &response[start + 3..];
    let end = after_fence.find("```")?;
    let mut lines = after_fence[..end].lines();
    let first = lines.next()?.trim().to_ascii_lowercase();
    if !matches!(first.as_str(), "sh" | "bash" | "shell" | "zsh" | "console") {
        return None;
    }
    let command = lines.collect::<Vec<_>>().join("\n").trim().to_string();
    (!command.is_empty()).then_some(command)
}

fn explicit_verification_command(task: &str) -> Option<&'static str> {
    let task = task.to_ascii_lowercase();
    ["cargo check", "cargo test", "pytest", "npm test"]
        .into_iter()
        .find(|command| task.contains(command))
}

#[cfg(test)]
mod tests {
    use super::parse_plan;

    #[test]
    fn accepts_fenced_shell_fallback() {
        let plan = parse_plan("```sh\ncargo check\n```".into(), "check").unwrap();
        assert_eq!(plan.steps[0].step_type, "run_command");
        assert_eq!(plan.steps[0].command.as_deref(), Some("cargo check"));
    }

    #[test]
    fn preserves_explicit_verification_command() {
        let plan = parse_plan("not JSON".into(), "Please run cargo check").unwrap();
        assert_eq!(plan.steps[0].command.as_deref(), Some("cargo check"));
    }
}
