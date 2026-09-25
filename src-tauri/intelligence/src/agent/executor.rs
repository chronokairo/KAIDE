use crate::agent::agent_loop::AgentHooks;
use crate::agent::state::AgentState;
use crate::compressor::layer1;
use crate::llm::prompt::CoderPrompt;
use crate::llm::router::LlmRouter;
use crate::tools::shell;
use crate::tools::test;
use crate::types::plan::PlanStep;
use std::io::Write;

/// How many fix rounds to run after a `.rs` file fails `cargo check`.
const MAX_FILE_FIX_ATTEMPTS: usize = 2;

fn compress_output(output: &str, label: &str) -> String {
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
            eprintln!(
                "  [NTK-L1: {} lines ({}% saved)]",
                result.output.lines().count(),
                pct
            );
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
        eprintln!("  ✗ {message}");
        state.record_blocked_action(format!("write {filename}: {message}"));
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
            eprintln!("  ✗ model returned empty content for {}", filename);
            return;
        }
        if let Err(e) = state.files.write_file(filename, &code) {
            eprintln!("  ✗ write failed for {}: {e}", filename);
            return;
        }
        state.mark_changed(filename);
        println!("  {} {}", verbose_label, filename);

        if filename.ends_with(".rs") {
            if let Err(message) = hooks.require_approval(
                state.config.command_tool_policy,
                "cargo check",
                "cargo check --message-format short",
                "compiles the workspace",
            ) {
                eprintln!("  ! {message}");
                return;
            }
            match verify_cargo(state) {
                None => {
                    println!("  ✓ cargo check passed");
                    return;
                }
                Some(err) if attempt < MAX_FILE_FIX_ATTEMPTS => {
                    eprintln!("  cargo check failed (attempt {}); fixing...", attempt + 1);
                    extra = format!(
                        "Your previous output failed `cargo check`. Fix the errors below and return the COMPLETE corrected file in a single code block:\n```\n{}\n```",
                        err
                    );
                }
                Some(err) => {
                    eprintln!("  ✗ cargo check still failing after retries:\n{}", err);
                    return;
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
    let caveman = state.caveman;
    execute_step_inner(client, state, step, caveman, hooks).await
}

async fn execute_step_inner(
    client: &LlmRouter,
    state: &mut AgentState,
    step: &PlanStep,
    caveman: crate::compressor::caveman::CavemanLevel,
    hooks: &AgentHooks,
) {
    match step.step_type.as_str() {
        "create_file" => {
            if let Some(filename) = step
                .filename
                .clone()
                .or_else(|| extract_path(&step.description))
            {
                println!("  Generating [{}]...", filename);
                let context = grep_context(state);
                let fname = filename.clone();
                let description = step.description.clone();
                write_with_verification(client, state, &fname, |extra| {
                    format!(
                        "{}\n\nContext:\n{}\n\nTask:\nCreate file '{}': {}\nReturn only the COMPLETE file content inside a single code block.\n{}",
                        CoderPrompt::with_caveman(&caveman),
                        context,
                        fname,
                        description,
                        extra
                    )
                }, "Created", hooks).await;
            } else {
                println!("  ✗ create_file step is missing a filename");
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
                    println!("  File {} not found", filename);
                    return;
                }
                println!("  Editing [{}]...", filename);
                let fname = filename.clone();
                let file_content = content;
                let description = step.description.clone();
                write_with_verification(client, state, &fname, |extra| {
                    format!(
                        "{}\n\nFile: {}\n\nContent:\n```\n{}\n```\n\nInstruction: {}\n{}\nReturn only the COMPLETE modified file content inside a single code block.",
                        CoderPrompt::with_caveman(&caveman),
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
                        let compressed = compress_output(&content, "file");
                        let truncated: String = compressed.chars().take(3000).collect();
                        println!("{}", truncated);
                        if content.len() > 3000 {
                            println!("  ...({} more chars)", content.len() - 3000);
                        }
                    }
                    None => println!("  File {} not found", filename),
                }
            } else {
                let results = search_code(state, &step.description);
                println!("{}", compress_output(&results, "search"));
            }
        }
        "search_code" => {
            let pattern = step.pattern.as_deref().unwrap_or(&step.description);
            let results = search_code(state, pattern);
            let compressed = compress_output(&results, "search");
            println!(
                "{}",
                if compressed.is_empty() {
                    "  No results".into()
                } else {
                    compressed
                }
            );
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
                    eprintln!("  ✗ {message}");
                    state.record_blocked_action(format!("run_command {cmd}: {message}"));
                    return;
                }
                println!("  Running: {}", cmd);
                let result = shell::run_command(&cmd, &state.config);
                let compressed = compress_output(&result, "command");
                let truncated: String = compressed.chars().take(2000).collect();
                println!("{}", truncated);
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
            let compressed = compress_output(&output, "test");
            let truncated: String = compressed.chars().take(2000).collect();
            println!("{}", truncated);
        }
        "answer" => {
            let context = grep_context(state);
            let system = CoderPrompt::with_caveman(&caveman);
            let prompt = format!(
                "{}\n\nContext:\n{}\n\nTask:\n{}",
                system, context, step.description
            );
            let mut out = std::io::stdout();
            let result = client
                .stream(&state.config.coder_model, &prompt, None, None, &mut |tok| {
                    let _ = write!(out, "{}", tok);
                    let _ = out.flush();
                }, &mut |_, _, _| {})
                .await;
            println!();
            if let Err(e) = result {
                eprintln!("  ✗ answer failed: {e}");
            }
        }
        "git_init" => {
            if let Err(message) = hooks.require_approval(
                state.config.write_tool_policy,
                "git_init",
                "initialize a git repository and stage all files",
                "repository mutation",
            ) {
                eprintln!("  ✗ {message}");
                state.record_blocked_action(format!("git_init: {message}"));
                return;
            }
            if !state.git.is_git_repo() {
                state.git.init();
                state.git.branch("main");
                state.git.add(".");
                println!("  Git repo initialized");
            } else {
                println!("  Git repo already exists");
            }
        }
        "git_commit" => {
            if let Err(message) = hooks.require_approval(
                state.config.write_tool_policy,
                "git_commit",
                &format!("commit staged changes: {}", step.description),
                "repository mutation (not revertible by the turn rollback)",
            ) {
                eprintln!("  ✗ {message}");
                state.record_blocked_action(format!("git_commit: {message}"));
                return;
            }
            state.git.add(".");
            let result = state.git.commit(&step.description);
            println!("  {}", result);
        }
        "git_status" => {
            println!("{}", state.git.status());
        }
        "done" => {
            println!("  Done: {}", step.description);
        }
        _ => println!("  Unknown step type: {}", step.step_type),
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
        assert_eq!(extract_path("create src/lib.rs with helper"), Some("src/lib.rs".into()));
        assert_eq!(extract_path("create main.py file"), Some("main.py".into()));
        assert_eq!(extract_path("run R script"), None);
    }
}
