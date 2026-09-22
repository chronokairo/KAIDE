use crate::agent::agent_loop::AgentHooks;
use crate::agent::state::AgentState;
use crate::compressor::layer1;
use crate::llm::prompt::CoderPrompt;
use crate::llm::router::LlmRouter;
use crate::tools::shell;
use crate::tools::test;
use crate::types::plan::PlanStep;

/// How many fix rounds to run after a `.rs` file fails `cargo check`.
const MAX_FILE_FIX_ATTEMPTS: usize = 3;

fn compress_output(output: &str, label: &str, hooks: &AgentHooks) -> String {
    if output.len() < 200 {
        return output.to_string();
    }
    let result = layer1::compress(output);
    if result.compressed_lines < result.original_lines {
        let saved = result
            .original_lines
            .saturating_sub(result.compressed_lines);
        let pct = if result.original_lines > 0 {
            (saved as f64 / result.original_lines as f64 * 100.0) as u32
        } else {
            0
        };
        if label == "command" {
            hooks.warn(&format!(
                "  [NTK-L1: {} lines ({}% saved)]",
                result.output.lines().count(),
                pct
            ));
        }
    }
    result.output
}

/// Known fenced-block language identifiers. Used to strip the leading tag line
/// of a markdown code block without accidentally dropping real code.
fn is_language_tag(line: &str) -> bool {
    let t = line.trim().to_lowercase();
    matches!(
        t.as_str(),
        "rust"
            | "rs"
            | "python"
            | "py"
            | "javascript"
            | "js"
            | "typescript"
            | "ts"
            | "tsx"
            | "jsx"
            | "bash"
            | "sh"
            | "shell"
            | "zsh"
            | "go"
            | "golang"
            | "c"
            | "cpp"
            | "c++"
            | "h"
            | "hpp"
            | "java"
            | "kotlin"
            | "kt"
            | "swift"
            | "ruby"
            | "rb"
            | "php"
            | "perl"
            | "lua"
            | "sql"
            | "html"
            | "css"
            | "scss"
            | "json"
            | "yaml"
            | "yml"
            | "xml"
            | "toml"
            | "ini"
            | "markdown"
            | "md"
            | "text"
            | "txt"
            | "diff"
            | "patch"
            | "dockerfile"
            | "makefile"
            | "plaintext"
            | "plain"
            | "console"
            | "fish"
            | "powershell"
            | "ps1"
            | "dart"
            | "elixir"
            | "ex"
            | "exs"
            | "haskell"
            | "hs"
            | "clojure"
            | "clj"
            | "scala"
            | "groovy"
            | "csharp"
            | "cs"
            | "fsharp"
            | "fs"
            | "asm"
            | "cmake"
            | "gradle"
            | "proto"
            | "graphql"
            | "gql"
            | "svg"
            | "csv"
            | "svelte"
            | "vue"
            | "astro"
            | "cargo,ignore"
    )
}

/// Extract the contents of the first fenced code block from a model response.
/// Falls back to the trimmed response if no fence is found.
fn extract_code_block(content: &str) -> String {
    let content = content.trim();
    let Some(start) = content.find("```") else {
        return content.to_string();
    };
    let after = &content[start + 3..];
    let Some(end) = after.find("```") else {
        return content.to_string();
    };
    let block = after[..end].trim();
    let mut lines = block.lines();
    if let Some(first) = lines.next() {
        if is_language_tag(first) {
            let rest: Vec<&str> = lines.collect();
            let code = rest.join("\n").trim().to_string();
            if !code.is_empty() {
                return code;
            }
        }
    }
    block.to_string()
}

/// Run `cargo check` in the workspace. Returns Some(errors) on failure, None when green.
/// Skips the gate when the workspace isn't a Cargo project.
fn verify_cargo(state: &AgentState) -> Option<String> {
    if !state.config.workspace_dir.join("Cargo.toml").exists() {
        return None;
    }
    let out = shell::run_command_raw("cargo check --message-format short", &state.config);
    if out.code == Some(0) {
        None
    } else {
        Some(out.combined())
    }
}

/// Generate file content via the coder model, write it, and verify `.rs` files
/// with `cargo check`, feeding errors back until it passes (bounded retries).
async fn write_with_verification<F>(
    client: &LlmRouter,
    state: &mut AgentState,
    filename: &str,
    make_prompt: F,
    verbose_label: &str,
    hooks: &AgentHooks,
) where
    F: Fn(&str) -> String,
{
    if let Err(message) = hooks.require_approval(
        state.config.write_tool_policy,
        "planner_write",
        &format!("write {filename}"),
        "workspace mutation (revertible within this turn)",
    ) {
        hooks.warn(&format!("  ✗ {message}"));
        state.record_blocked_action(format!("write {filename}: {message}"));
        return;
    }
    // v0.9.5 oracle lock: planner-driven writes can never touch the exam.
    // A spec-guard refusal is NOT a blocked action: the harness correctly
    // refused an out-of-spec step, and verification stays the sole judge.
    if let Some(message) = state.locked_path_error(filename) {
        hooks.warn(&format!("  ? {message}"));
        return;
    }
    let mut extra = String::new();
    for attempt in 0..=MAX_FILE_FIX_ATTEMPTS {
        let prompt = make_prompt(&extra);
        let content = match client
            .generate_with_retry_with_fallback(&state.config.coder_model, &prompt, None, None)
            .await
        {
            Ok(c) => c,
            Err(_e) => {
                return;
            }
        };
        let code = extract_code_block(&content);
        if code.trim().is_empty() {
            hooks.warn(&format!(
                "  ✗ model returned empty content for {}",
                filename
            ));
            return;
        }

        // Pre-mutation Specification-Locked gate: deterministic API/signature
        // and baseline checks BEFORE any filesystem write or cargo run.
        let mut violation: Option<String> = None;
        if let Some(spec) = state.task_spec.clone() {
            if let Err(rejection) = spec.check_patch(&code, filename) {
                violation = Some(rejection);
            }
        }
        if violation.is_none() {
            // Symbol guard: reject invented methods/APIs not present in the RepoMap.
            let repo_map = crate::repo::RepoMap::build(&state.config.workspace_dir);
            if let Err(v) =
                crate::agent::semantic_guard::validate_code_symbols(&code, &repo_map, filename)
            {
                violation = Some(v);
            }
        }

        if let Some(violation) = violation {
            if attempt < MAX_FILE_FIX_ATTEMPTS {
                hooks.warn(&format!(
                    "  [spec guard] rejection in {} (attempt {}); fixing...",
                    filename,
                    attempt + 1
                ));
                extra = format!(
                    "\n\n{violation}\n\nReturn only the COMPLETE corrected file content inside a single code block."
                );
                continue;
            } else {
                hooks.warn(&format!(
                    "  ✗ [spec guard] still rejecting {} after retries:\n{violation}",
                    filename
                ));
                return;
            }
        }

        if let Err(e) = state.files.write_file(filename, &code) {
            hooks.warn(&format!("  ✗ write failed for {}: {e}", filename));
            return;
        }
        state.mark_changed(filename);
        hooks.note(&format!("  {} {}", verbose_label, filename));

        if filename.ends_with(".rs") {
            if let Err(message) = hooks.require_approval(
                state.config.command_tool_policy,
                "cargo check",
                "cargo check --message-format short",
                "compiles the workspace",
            ) {
                hooks.warn(&format!("  ! {message}"));
                return;
            }
            match verify_cargo(state) {
                None => {
                    hooks.note("  ✓ cargo check passed");
                    return;
                }
                Some(errors) => {
                    if attempt < MAX_FILE_FIX_ATTEMPTS {
                        hooks.warn(&format!(
                            "  cargo check failed (attempt {}); fixing...",
                            attempt + 1
                        ));
                        let diagnostics = crate::tools::test::extract_diagnostics(&errors);
                        let scoped_feedback = crate::tools::test::format_scoped_repair_prompt(
                            &diagnostics,
                            Some(filename),
                            &errors,
                        );
                        extra = format!(
                            "\n\n{}\n\nReturn only the COMPLETE corrected file content inside a single code block.",
                            scoped_feedback
                        );
                    } else {
                        let diagnostics = crate::tools::test::extract_diagnostics(&errors);
                        let scoped_feedback = crate::tools::test::format_scoped_repair_prompt(
                            &diagnostics,
                            Some(filename),
                            &errors,
                        );
                        hooks.warn(&format!(
                            "  ✗ cargo check still failing after retries:\n{}",
                            scoped_feedback
                        ));
                        return;
                    }
                }
            }
        } else {
            return;
        }
    }
}

/// Heuristic: extract a likely file path from a step description, e.g.
/// "create src/calc.rs with a factorial function" -> "src/calc.rs".
/// Used as a fallback when the planner omits the `filename` field.
fn extract_path(description: &str) -> Option<String> {
    let known_ext = [
        "rs", "py", "js", "ts", "tsx", "jsx", "go", "c", "h", "cpp", "hpp", "java", "rb", "php",
        "sh", "toml", "json", "yaml", "yml", "md", "html", "css", "sql", "kt", "swift", "dart",
        "lua", "r", "zig", "ex", "exs", "fs", "cs", "vue", "svelte", "astro", "prisma", "lock",
    ];
    let toks: Vec<&str> = description.split_whitespace().collect();
    for tok in &toks {
        let clean = tok.trim_matches(|c: char| {
            !c.is_alphanumeric() && c != '.' && c != '/' && c != '-' && c != '_' && c != '\\'
        });
        if clean.contains('/') || clean.contains('\\') {
            return Some(clean.to_string());
        }
        if clean.contains('.') && !clean.starts_with('.') {
            if let Some(ext) = clean.rsplit('.').next() {
                if known_ext.contains(&ext) {
                    return Some(clean.to_string());
                }
            }
        }
    }
    None
}

pub async fn execute_step(
    client: &LlmRouter,
    state: &mut AgentState,
    step: &PlanStep,
    hooks: &AgentHooks,
) {
    execute_step_inner(client, state, step, hooks).await
}

async fn execute_step_inner(
    client: &LlmRouter,
    state: &mut AgentState,
    step: &PlanStep,
    hooks: &AgentHooks,
) {
    match step.step_type.as_str() {
        "create_file" => {
            if let Some(filename) = step
                .filename
                .clone()
                .or_else(|| extract_path(&step.description))
            {
                hooks.note(&format!("  Generating [{}]...", filename));
                let repo_map = crate::repo::RepoMap::build(&state.config.workspace_dir);
                let contract_str = state
                    .task_spec
                    .as_ref()
                    .map(|spec| spec.to_prompt_string())
                    .unwrap_or_default();
                let repo_str = repo_map.to_prompt_string();

                let fname = filename.clone();
                let description = step.description.clone();
                write_with_verification(client, state, &fname, |extra| {
                    format!(
                        "{}\n\n{}\n\n{}\n\nTask:\nCreate file '{}': {}\nReturn only the COMPLETE file content inside a single code block.\n{}",
                        CoderPrompt::system(),
                        repo_str,
                        contract_str,
                        fname,
                        description,
                        extra
                    )
                }, "Created", hooks).await;
            } else {
                hooks.warn("  ✗ create_file step is missing a filename");
            }
        }
        "edit_file" => {
            if let Some(filename) = step
                .filename
                .clone()
                .or_else(|| extract_path(&step.description))
            {
                let content = state.files.read_file(&filename).unwrap_or_default();
                if content.is_empty() {
                    hooks.warn(&format!("  File {} not found", filename));
                    return;
                }
                hooks.note(&format!("  Editing [{}]...", filename));
                let repo_map = crate::repo::RepoMap::build(&state.config.workspace_dir);
                let contract_str = state
                    .task_spec
                    .as_ref()
                    .map(|spec| spec.to_prompt_string())
                    .unwrap_or_default();
                let repo_str = repo_map.to_prompt_string();

                let fname = filename.clone();
                let file_content = content;
                let description = step.description.clone();
                write_with_verification(client, state, &fname, |extra| {
                    format!(
                        "{}\n\n{}\n\n{}\n\nFile: {}\n\nContent:\n```\n{}\n```\n\nInstruction: {}\n{}\nReturn only the COMPLETE modified file content inside a single code block.",
                        CoderPrompt::system(),
                        repo_str,
                        contract_str,
                        fname,
                        file_content,
                        description,
                        extra
                    )
                }, "Edited", hooks).await;
            }
        }
        "read_file" => {
            if let Some(filename) = step
                .filename
                .clone()
                .or_else(|| extract_path(&step.description))
            {
                match state.files.read_file(&filename) {
                    Some(content) => {
                        let compressed = compress_output(&content, "file", hooks);
                        let truncated: String = compressed.chars().take(3000).collect();
                        hooks.note(&truncated);
                        if content.len() > 3000 {
                            hooks.note(&format!("  ...({} more chars)", content.len() - 3000));
                        }
                    }
                    None => hooks.warn(&format!("  File {} not found", filename)),
                }
            } else {
                let results = search_code(state, &step.description);
                hooks.note(&compress_output(&results, "search", hooks));
            }
        }
        "search_code" => {
            let pattern = step.pattern.as_deref().unwrap_or(&step.description);
            let results = search_code(state, pattern);
            let compressed = compress_output(&results, "search", hooks);
            hooks.note(&if compressed.is_empty() {
                "  No results".into()
            } else {
                compressed
            });
        }
        "run_command" => {
            let cmd = step
                .command
                .clone()
                .unwrap_or_else(|| step.description.clone());
            if !cmd.is_empty() {
                if let Err(message) = hooks.require_approval(
                    state.config.command_tool_policy,
                    "run_command",
                    &cmd,
                    "runs an allowlisted process in the workspace",
                ) {
                    hooks.warn(&format!("  ✗ {message}"));
                    state.record_blocked_action(format!("run_command {cmd}: {message}"));
                    return;
                }
                hooks.note(&format!("  Running: {}", cmd));
                let result = shell::run_command(&cmd, &state.config);
                let compressed = compress_output(&result, "command", hooks);
                let truncated: String = compressed.chars().take(2000).collect();
                hooks.note(&truncated);
            }
        }
        "run_tests" => {
            let command = step.command.as_deref().unwrap_or("");
            let verification = match hooks.require_approval(
                state.config.command_tool_policy,
                "run_tests",
                if command.is_empty() {
                    "auto-detected test runner"
                } else {
                    command
                },
                "runs the project test suite",
            ) {
                Err(message) => {
                    state.record_blocked_action(format!("run_tests: {message}"));
                    test::VerificationResult::unavailable(message)
                }
                Ok(()) => test::run_tests(command, &state.config),
            };
            let output = verification.output.clone();
            state.record_verification(verification);
            let compressed = compress_output(&output, "test", hooks);
            let truncated: String = compressed.chars().take(2000).collect();
            hooks.note(&truncated);
        }
        "answer" => {
            let context = grep_context(state);
            let system = CoderPrompt::system();
            let prompt = format!(
                "{}\n\nContext:\n{}\n\nTask:\n{}",
                system, context, step.description
            );
            let result = client
                .stream(
                    &state.config.coder_model,
                    &prompt,
                    None,
                    None,
                    &mut |tok| {
                        hooks.stream_text(tok);
                    },
                    &mut |_, _, _| {},
                )
                .await;
            hooks.stream_text("\n");
            if let Err(e) = result {
                hooks.warn(&format!("  ✗ answer failed: {e}"));
            }
        }
        "git_commit" => {
            if let Err(message) = hooks.require_approval(
                state.config.write_tool_policy,
                "git_commit",
                &format!("commit staged changes: {}", step.description),
                "repository mutation (not revertible by the turn rollback)",
            ) {
                hooks.warn(&format!("  ✗ {message}"));
                state.record_blocked_action(format!("git_commit: {message}"));
                return;
            }
            state.git.add(".");
            let result = state.git.commit(&step.description);
            hooks.note(&format!("  {}", result));
        }
        "git_status" => {
            hooks.note(&state.git.status());
        }
        "done" => {
            hooks.note(&format!("  Done: {}", step.description));
        }
        _ => hooks.warn(&format!("  Unknown step type: {}", step.step_type)),
    }
}

fn search_code(state: &AgentState, pattern: &str) -> String {
    let result = std::process::Command::new("rg")
        .args(["-n", "--max-count", "10", pattern])
        .current_dir(&state.config.workspace_dir)
        .output();
    match result {
        Ok(out) => {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if s.is_empty() {
                format!("No matches for: {}", pattern)
            } else {
                s
            }
        }
        Err(_) => "ripgrep not installed".into(),
    }
}

fn grep_context(state: &AgentState) -> String {
    let task = state.session.get_context();
    let result = std::process::Command::new("rg")
        .args(["-n", "--max-count", "5", &task])
        .current_dir(&state.config.workspace_dir)
        .output();
    match result {
        Ok(out) => {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if s.is_empty() {
                "No relevant context found.".into()
            } else {
                s
            }
        }
        Err(_) => "No relevant context found.".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::extract_code_block;

    #[test]
    fn extracts_fenced_block() {
        let out = extract_code_block("Here is the code:\n```rust\nfn main() {}\n```\nDone");
        assert_eq!(out, "fn main() {}");
    }

    #[test]
    fn handles_block_without_language_tag() {
        let out = extract_code_block("```\nhello\nworld\n```");
        assert_eq!(out, "hello\nworld");
    }

    #[test]
    fn falls_back_without_fence() {
        let out = extract_code_block("just plain text");
        assert_eq!(out, "just plain text");
    }

    #[test]
    fn keeps_single_line_code() {
        let out = extract_code_block("```rust\nfn main() {}\n```");
        assert_eq!(out, "fn main() {}");
    }

    #[test]
    fn extract_path_requires_dot_or_slash() {
        use super::extract_path;
        assert_eq!(
            extract_path("create src/lib.rs with helper"),
            Some("src/lib.rs".into())
        );
        assert_eq!(extract_path("create main.py file"), Some("main.py".into()));
        assert_eq!(extract_path("run R script"), None);
    }
}
