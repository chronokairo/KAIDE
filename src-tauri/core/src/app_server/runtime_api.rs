//! Read/query API used by supervisory clients such as ChronoKairo Desktop.
//! All coding-runtime data is owned here; clients only render the result.

use serde_json::{json, Value};

use std::path::{Path, PathBuf};
use std::process::Command;

const METHODS: &[&str] = &[
    "get_harness_overview",
    "get_harness_skills",
    "get_harness_memory_sessions",
    "get_harness_session_messages",
    "create_harness_session",
    "get_harness_context_files",
    "read_harness_file",
    "write_harness_file",
    "get_harness_automations",
    "get_harness_git_scan",
    "get_harness_git_status",
    "get_context_fragments",
    "assemble_context_fragments",
    "preview_context_for_prompt",
    "search_files",
    "get_file_watch_snapshot",
    "apply_patch_dry_run",
    "apply_patch_commit",
    "apply_patch_commit_with_backup",
    "revert_patch",
    "get_exec_policy",
    "set_exec_policy",
    "check_command_policy",
    "allow_command_always",
    "remove_exec_policy_rule",
    "search_memories",
    "collect_git_info",
    "detect_fsmonitor",
    "get_default_branch",
    "get_attribution_policy",
    "get_git_user_info",
    "format_commit_attribution",
];

pub fn supports(method: &str) -> bool {
    METHODS.contains(&method)
}

pub fn call(
    method: &str,
    params: Option<&Value>,
    default_workspace: &Path,
    default_model: &str,
) -> Result<Value, String> {
    let params = params.cloned().unwrap_or_else(|| json!({}));
    let workspace = params
        .get("workspace")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| default_workspace.to_path_buf());

    match method {
        "get_harness_overview" => overview(&workspace, default_model),
        "get_harness_skills" => skills(&workspace),
        "get_harness_memory_sessions" => memory_sessions(
            &workspace,
            params.get("limit").and_then(Value::as_u64).unwrap_or(50) as usize,
        ),
        "get_harness_session_messages" => session_messages(
            params
                .get("sessionId")
                .or_else(|| params.get("session_id"))
                .and_then(Value::as_i64)
                .ok_or("sessionId is required")?,
        ),
        "create_harness_session" => create_session(&workspace, default_model, &params),
        "get_harness_context_files" => context_files(&workspace),
        "read_harness_file" => read_file(&workspace, &params),
        "write_harness_file" => write_file(&workspace, &params),
        "get_harness_automations" => automations(&workspace),
        "get_harness_git_scan" => git_scan(&workspace),
        "get_harness_git_status" => {
            let repository = params
                .get("path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
                .map(PathBuf::from)
                .unwrap_or_else(|| workspace.clone());
            git_status(&repository)
        }
        "get_context_fragments" => context_fragments(&workspace),
        "assemble_context_fragments" => assembled_context(&workspace),
        "preview_context_for_prompt" => assembled_context(&workspace).map(|value| {
            value
                .get("promptContext")
                .cloned()
                .unwrap_or(Value::String(String::new()))
        }),
        "search_files" => search_files(&workspace, &params),
        "get_file_watch_snapshot" => file_watch_snapshot(&workspace, &params),
        "apply_patch_dry_run" => patch_dry_run(&workspace, &params),
        "apply_patch_commit" => patch_commit(&workspace, &params, false),
        "apply_patch_commit_with_backup" => patch_commit(&workspace, &params, true),
        "revert_patch" => revert_patch(&workspace, &params),
        "get_exec_policy" => get_exec_policy(),
        "set_exec_policy" => set_exec_policy(&params),
        "check_command_policy" => check_command_policy(&workspace, &params),
        "allow_command_always" => allow_command_always(&params),
        "remove_exec_policy_rule" => remove_exec_policy_rule(&params),
        "search_memories" => search_memories(&params),
        "collect_git_info" => collect_git_info(&workspace),
        "detect_fsmonitor" => detect_fsmonitor(&workspace),
        "get_default_branch" => Ok(Value::String(default_branch(&workspace))),
        "get_attribution_policy" => Ok(attribution_policy(&workspace)),
        "get_git_user_info" => Ok(git_user_info(&workspace)),
        "format_commit_attribution" => format_commit_attribution(&workspace, &params),
        _ => Err(format!("unsupported runtime method: {method}")),
    }
}

fn attribution_policy(workspace: &Path) -> Value {
    let name = git_output(workspace, &["config", "--get", "chronokairo.agent.name"]);
    let email = git_output(workspace, &["config", "--get", "chronokairo.agent.email"]);
    json!({
        "co_authored_by": true,
        "include_human": false,
        "agent_name": if name.is_empty() { "ChronoKairo Agent" } else { &name },
        "agent_email": if email.is_empty() { "agent@chronokairo.local" } else { &email },
        "trailer_format": "Co-authored-by: {name} <{email}>"
    })
}

fn git_user_info(workspace: &Path) -> Value {
    json!({"name": git_output(workspace, &["config", "--get", "user.name"]),
        "email": git_output(workspace, &["config", "--get", "user.email"])})
}

fn format_commit_attribution(workspace: &Path, params: &Value) -> Result<Value, String> {
    let message = params.get("message").and_then(Value::as_str).ok_or("message is required")?;
    let policy = attribution_policy(workspace);
    if !policy.get("co_authored_by").and_then(Value::as_bool).unwrap_or(true) { return Ok(Value::String(message.to_string())); }
    let name = policy.get("agent_name").and_then(Value::as_str).unwrap_or("ChronoKairo Agent");
    let email = policy.get("agent_email").and_then(Value::as_str).unwrap_or("agent@chronokairo.local");
    let trailer = format!("Co-authored-by: {name} <{email}>");
    if message.contains(&trailer) { Ok(Value::String(message.to_string())) }
    else { Ok(Value::String(format!("{}\n\n{trailer}\n", message.trim_end()))) }
}

fn collect_git_info(workspace: &Path) -> Result<Value, String> {
    let root = git_output(workspace, &["rev-parse", "--show-toplevel"]);
    if root.is_empty() {
        return Ok(json!({"repoRoot": "", "branch": "", "isRepo": false, "remotes": [], "status": ""}));
    }
    let remotes = git_output(workspace, &["remote", "-v"])
        .lines()
        .filter_map(|line| {
            let mut fields = line.split_whitespace();
            let name = fields.next()?;
            let url = fields.next()?;
            (line.ends_with("(fetch)")).then(|| json!({"name": name, "url": url}))
        }).collect::<Vec<_>>();
    Ok(json!({
        "repoRoot": root,
        "branch": git_output(workspace, &["branch", "--show-current"]),
        "isRepo": true,
        "remotes": remotes,
        "status": git_output(workspace, &["status", "--short"]),
    }))
}

fn detect_fsmonitor(workspace: &Path) -> Result<Value, String> {
    let value = git_output(workspace, &["config", "--get", "core.fsmonitor"]);
    Ok(json!({"enabled": !value.is_empty() && value != "false", "reason": if value.is_empty() { "not configured" } else { "git core.fsmonitor" }}))
}

fn default_branch(workspace: &Path) -> String {
    let remote_head = git_output(workspace, &["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
    if let Some(branch) = remote_head.strip_prefix("origin/") { return branch.to_string(); }
    for candidate in ["main", "master"] {
        let exists = Command::new("git").args(["show-ref", "--verify", "--quiet", &format!("refs/heads/{candidate}")])
            .current_dir(workspace).status().is_ok_and(|status| status.success());
        if exists { return candidate.to_string(); }
    }
    let current = git_output(workspace, &["branch", "--show-current"]);
    if current.is_empty() { "main".to_string() } else { current }
}

fn search_memories(params: &Value) -> Result<Value, String> {
    let query = params.get("query").and_then(Value::as_str).unwrap_or("").trim();
    if query.is_empty() { return Ok(json!([])); }
    let limit = params.get("limit").and_then(Value::as_u64).unwrap_or(10).clamp(1, 100) as usize;
    let memory = memory()?;
    let results = memory.search_memories(query, limit).map_err(|error| error.to_string())?;
    Ok(Value::Array(results))
}

fn get_exec_policy() -> Result<Value, String> {
    serde_json::to_value(crate::tools::exec_policy::load_default()).map_err(|error| error.to_string())
}

fn set_exec_policy(params: &Value) -> Result<Value, String> {
    let policy: crate::tools::exec_policy::ExecPolicy = serde_json::from_value(
        params.get("policy").cloned().ok_or("policy is required")?,
    ).map_err(|error| error.to_string())?;
    policy.save(&crate::tools::exec_policy::default_path())?;
    Ok(json!({"ok": true}))
}

fn check_command_policy(workspace: &Path, params: &Value) -> Result<Value, String> {
    let command = params.get("command").and_then(Value::as_array)
        .ok_or("command is required")?.iter().filter_map(Value::as_str)
        .map(str::to_string).collect::<Vec<_>>();
    let policy = crate::tools::exec_policy::load_default();
    let (decision, rule) = policy.check(&command, Some(workspace));
    let decision_name = match decision {
        crate::tools::exec_policy::Decision::Allow => "allow",
        crate::tools::exec_policy::Decision::Prompt => "prompt",
        crate::tools::exec_policy::Decision::Forbidden => "forbidden",
    };
    Ok(json!({"allowed": decision_name == "allow", "decision": decision_name, "rule": rule}))
}

fn allow_command_always(params: &Value) -> Result<Value, String> {
    let command = params.get("command").and_then(Value::as_str).ok_or("command is required")?;
    let mut policy = crate::tools::exec_policy::load_default();
    policy.rules.push(crate::tools::exec_policy::ExecRule {
        command: command.to_string(),
        decision: crate::tools::exec_policy::Decision::Allow,
        scope: params.get("scope").and_then(Value::as_str).map(str::to_string),
        justification: Some(format!("Allowed from runtime panel at {}", crate::types::time::now_utc_rfc3339())),
    });
    policy.save(&crate::tools::exec_policy::default_path())?;
    Ok(json!({"ok": true}))
}

fn remove_exec_policy_rule(params: &Value) -> Result<Value, String> {
    let command = params.get("command").and_then(Value::as_str).ok_or("command is required")?;
    let mut policy = crate::tools::exec_policy::load_default();
    policy.rules.retain(|rule| rule.command != command);
    policy.save(&crate::tools::exec_policy::default_path())?;
    Ok(json!({"ok": true}))
}

fn patch_text(params: &Value) -> Result<&str, String> {
    params
        .get("patch")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| "patch is required".to_string())
}

fn patch_result(results: Vec<crate::tools::patch::PatchResult>, patch_id: Option<u64>) -> Value {
    let modified_files = results.iter().map(|item| item.file_path.clone()).collect::<Vec<_>>();
    let summary = format!("applied {} file(s)", results.len());
    json!({
        "success": true,
        "patch_id": patch_id,
        "summary": summary,
        "modifiedFiles": modified_files,
        "applied": results,
    })
}

fn patch_dry_run(workspace: &Path, params: &Value) -> Result<Value, String> {
    let results = crate::tools::patch::preview_patch(workspace, patch_text(params)?)
        .map_err(|error| error.to_string())?;
    let changes = results
        .iter()
        .map(|item| json!({
            "path": item.file_path,
            "addedLines": item.lines_added,
            "deletedLines": item.lines_removed,
        }))
        .collect::<Vec<_>>();
    Ok(json!({
        "valid": true,
        "fileChanges": changes,
        "changes": changes,
        "conflicts": [],
        "summary": format!("{} file(s) would be changed", results.len()),
    }))
}

fn backup_directory() -> PathBuf {
    crate::config::home_dir().join(".chronokairo").join("patch-backups")
}

fn patch_commit(workspace: &Path, params: &Value, backup: bool) -> Result<Value, String> {
    let patch = patch_text(params)?;
    // Preview validates every hunk before any write begins.
    crate::tools::patch::preview_patch(workspace, patch).map_err(|error| error.to_string())?;
    let patch_id = crate::types::time::now_timestamp_millis();
    if backup {
        let canonical_workspace = workspace.canonicalize().map_err(|error| error.to_string())?;
        let entries = crate::tools::patch::affected_paths(patch)
            .map_err(|error| error.to_string())?
            .into_iter()
            .map(|relative| {
                let path = canonical_workspace.join(&relative);
                let parent = path.parent().unwrap_or(&canonical_workspace);
                let parent = parent.canonicalize().unwrap_or_else(|_| parent.to_path_buf());
                if !parent.starts_with(&canonical_workspace) {
                    return Err(format!("patch path escapes workspace: {relative}"));
                }
                let original = std::fs::read(&path).ok().map(|bytes| {
                    crate::base64::encode(bytes)
                });
                Ok(json!({"path": relative, "original": original}))
            })
            .collect::<Result<Vec<_>, String>>()?;
        let directory = backup_directory();
        std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
        let manifest = json!({
            "patchId": patch_id,
            "workspace": canonical_workspace.to_string_lossy(),
            "entries": entries,
        });
        std::fs::write(
            directory.join(format!("{patch_id}.json")),
            serde_json::to_vec_pretty(&manifest).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string())?;
    }
    let results = crate::tools::patch::apply_patch(workspace, patch)
        .map_err(|error| error.to_string())?;
    Ok(patch_result(results, backup.then_some(patch_id)))
}

fn revert_patch(workspace: &Path, params: &Value) -> Result<Value, String> {
    let patch_id = params
        .get("patchId")
        .or_else(|| params.get("patch_id"))
        .and_then(Value::as_u64)
        .ok_or_else(|| "patchId is required".to_string())?;
    let manifest_path = backup_directory().join(format!("{patch_id}.json"));
    let manifest: Value = serde_json::from_slice(
        &std::fs::read(&manifest_path).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    let canonical_workspace = workspace.canonicalize().map_err(|error| error.to_string())?;
    if manifest.get("workspace").and_then(Value::as_str)
        != Some(canonical_workspace.to_string_lossy().as_ref())
    {
        return Err("patch backup belongs to a different workspace".to_string());
    }
    let mut modified_files = Vec::new();
    for entry in manifest.get("entries").and_then(Value::as_array).into_iter().flatten() {
        let relative = entry.get("path").and_then(Value::as_str).ok_or("invalid backup path")?;
        let path = canonical_workspace.join(relative);
        let parent = path.parent().unwrap_or(&canonical_workspace);
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        if let Some(encoded) = entry.get("original").and_then(Value::as_str) {
            let bytes = crate::base64::decode(encoded)
                .map_err(|error| error.to_string())?;
            std::fs::write(&path, bytes).map_err(|error| error.to_string())?;
        } else if path.exists() {
            std::fs::remove_file(&path).map_err(|error| error.to_string())?;
        }
        modified_files.push(relative.to_string());
    }
    std::fs::remove_file(manifest_path).map_err(|error| error.to_string())?;
    Ok(json!({"success": true, "patch_id": patch_id, "modifiedFiles": modified_files, "summary": "patch reverted"}))
}

fn search_files(default_workspace: &Path, params: &Value) -> Result<Value, String> {
    let query = params.get("query").and_then(Value::as_str).unwrap_or("");
    let limit = params.get("limit").and_then(Value::as_u64).unwrap_or(20) as usize;
    let roots: Vec<PathBuf> = params
        .get("roots")
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(PathBuf::from)
                .collect()
        })
        .filter(|values: &Vec<PathBuf>| !values.is_empty())
        .unwrap_or_else(|| vec![default_workspace.to_path_buf()]);

    let mut all = Vec::new();
    for root in roots {
        let root = root.canonicalize().map_err(|error| error.to_string())?;
        for relative in crate::ui::file_search::walk_files(&root) {
            all.push(root.join(relative).to_string_lossy().to_string());
        }
    }
    let ranked = crate::ui::file_search::search_files(&all, query, usize::MAX);
    let total_matches = ranked.len();
    let results = ranked
        .into_iter()
        .take(limit)
        .map(|entry| {
            json!({
                "path": entry.path,
                "score": entry.score,
                "isExact": entry.path.eq_ignore_ascii_case(query),
            })
        })
        .collect::<Vec<_>>();
    Ok(json!({"results": results, "totalMatches": total_matches}))
}

fn file_watch_snapshot(workspace: &Path, params: &Value) -> Result<Value, String> {
    let since = params
        .get("since")
        .and_then(Value::as_str)
        .and_then(crate::types::time::parse_rfc3339_to_system_time)
        .unwrap_or_else(|| std::time::SystemTime::now() - std::time::Duration::from_secs(3600));
    let candidates = [
        "AGENTS.md", "CLAUDE.md", "package.json", "Cargo.toml", ".git/HEAD", ".git/index",
    ];
    let events = candidates
        .iter()
        .filter_map(|name| {
            let path = workspace.join(name);
            let modified = path.metadata().ok()?.modified().ok()?;
            (modified > since).then(|| {
                json!({"path": path.to_string_lossy(), "kind": "modify"})
            })
        })
        .collect::<Vec<_>>();
    Ok(json!({"events": events, "timestamp": crate::types::time::now_utc_rfc3339()}))
}

fn memory() -> Result<crate::memory::log::LongTermMemory, String> {
    let home = crate::config::home_dir();
    let primary = home.join(".chronokairo").join("memory.db");
    let path = if !primary.exists() && home.join(".anamnesic").join("memory.db").exists() {
        home.join(".anamnesic").join("memory.db")
    } else {
        primary
    };
    crate::memory::log::LongTermMemory::new(path).map_err(|error| error.to_string())
}

fn skills(workspace: &Path) -> Result<Value, String> {
    let mut registry = crate::skills::SkillRegistry::new();
    registry.load_from(crate::skills::default_skill_dirs(workspace));
    Ok(Value::Array(
        registry
            .list()
            .iter()
            .map(|skill| {
                json!({
                    "name": skill.name,
                    "description": skill.description,
                    "body": skill.body,
                    "source": skill.source.to_string_lossy(),
                })
            })
            .collect(),
    ))
}

fn memory_sessions(workspace: &Path, limit: usize) -> Result<Value, String> {
    let sessions = memory()?
        .list_sessions(&workspace.to_string_lossy(), limit)
        .map_err(|error| error.to_string())?;
    Ok(Value::Array(
        sessions
            .into_iter()
            .map(|session| {
                json!({
                    "id": session.id,
                    "timestamp": session.timestamp,
                    "updated_at": session.updated_at,
                    "summary": session.summary,
                    "message_count": session.message_count,
                    "model": session.model,
                })
            })
            .collect(),
    ))
}

fn session_messages(session_id: i64) -> Result<Value, String> {
    let messages = memory()?
        .load_session(session_id)
        .map_err(|error| error.to_string())?;
    Ok(Value::Array(
        messages
            .into_iter()
            .map(|(seq, role, content)| {
                json!({"id": seq, "sessionId": session_id, "role": role, "content": content, "timestamp": ""})
            })
            .collect(),
    ))
}

fn create_session(workspace: &Path, default_model: &str, params: &Value) -> Result<Value, String> {
    let memory = memory()?;
    let model = params
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or(default_model);
    let id = memory
        .start_session(&workspace.to_string_lossy(), model)
        .map_err(|error| error.to_string())?;
    let title = params
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("New session");
    if let Some(prompt) = params.get("initialPrompt").and_then(Value::as_str) {
        if !prompt.trim().is_empty() {
            memory
                .append_messages(id, &[(0, "user".to_string(), prompt.trim().to_string())])
                .map_err(|error| error.to_string())?;
        }
    }
    memory
        .update_session(id, title, "", model)
        .map_err(|error| error.to_string())?;
    Ok(json!(id))
}

fn context_files(workspace: &Path) -> Result<Value, String> {
    let candidates = [
        "AGENTS.md",
        "CLAUDE.md",
        "MEMORY.md",
        ".github/copilot-instructions.md",
    ];
    let mut files = Vec::new();
    for name in candidates {
        let path = workspace.join(name);
        if !path.is_file() {
            continue;
        }
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        let modified = path
            .metadata()
            .and_then(|metadata| metadata.modified())
            .ok()
            .map(crate::types::time::format_system_time_rfc3339)
            .unwrap_or_default();
        files.push(json!({
            "name": name,
            "path": path.to_string_lossy(),
            "lines": content.lines().count(),
            "modified": modified,
        }));
    }
    Ok(Value::Array(files))
}

fn resolve_file(workspace: &Path, params: &Value) -> Result<PathBuf, String> {
    let raw = params.get("path").and_then(Value::as_str).ok_or("path is required")?;
    let path = PathBuf::from(raw);
    let path = if path.is_absolute() { path } else { workspace.join(path) };
    let workspace = workspace.canonicalize().map_err(|error| error.to_string())?;
    let parent = path.parent().unwrap_or(&path);
    let resolved_parent = parent.canonicalize().unwrap_or_else(|_| parent.to_path_buf());
    if !resolved_parent.starts_with(&workspace) {
        return Err("path escapes the runtime workspace".to_string());
    }
    Ok(path)
}

fn read_file(workspace: &Path, params: &Value) -> Result<Value, String> {
    let path = resolve_file(workspace, params)?;
    std::fs::read_to_string(path)
        .map(Value::String)
        .map_err(|error| error.to_string())
}

fn write_file(workspace: &Path, params: &Value) -> Result<Value, String> {
    let path = resolve_file(workspace, params)?;
    let content = params.get("content").and_then(Value::as_str).ok_or("content is required")?;
    std::fs::write(path, content).map_err(|error| error.to_string())?;
    Ok(json!({"ok": true}))
}

fn automations(workspace: &Path) -> Result<Value, String> {
    let directory = workspace.join(".github").join("workflows");
    if !directory.is_dir() {
        return Ok(json!([]));
    }
    let mut items = Vec::new();
    for entry in std::fs::read_dir(directory).map_err(|error| error.to_string())?.flatten() {
        let path = entry.path();
        if !matches!(path.extension().and_then(|value| value.to_str()), Some("yml" | "yaml")) {
            continue;
        }
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        let file = path.file_name().unwrap_or_default().to_string_lossy().to_string();
        let name = content
            .lines()
            .find_map(|line| line.trim().strip_prefix("name:").map(str::trim))
            .filter(|value| !value.is_empty())
            .unwrap_or(&file)
            .trim_matches(['\'', '"'])
            .to_string();
        items.push(json!({"name": name, "file": file, "triggers": [], "jobs": [], "path": path.to_string_lossy()}));
    }
    Ok(Value::Array(items))
}

fn git_output(workspace: &Path, args: &[&str]) -> String {
    Command::new("git")
        .args(args)
        .current_dir(workspace)
        .output()
        .ok()
        .map(|output| String::from_utf8_lossy(&output.stdout).trim_end().to_string())
        .unwrap_or_default()
}

fn git_status(workspace: &Path) -> Result<Value, String> {
    let branch = git_output(workspace, &["branch", "--show-current"]);
    let porcelain = git_output(workspace, &["status", "--porcelain"]);
    let mut modified = Vec::new();
    let mut untracked = Vec::new();
    for line in porcelain.lines() {
        let path = line.get(3..).unwrap_or("").to_string();
        if line.starts_with("??") { untracked.push(path) } else { modified.push(path) }
    }
    Ok(json!({"branch": branch, "clean": modified.is_empty() && untracked.is_empty(), "modified": modified, "untracked": untracked}))
}

fn git_scan(workspace: &Path) -> Result<Value, String> {
    let status = git_status(workspace)?;
    let name = workspace.file_name().unwrap_or_default().to_string_lossy();
    let branch = status.get("branch").cloned().unwrap_or(Value::String(String::new()));
    let repo = json!({
        "path": workspace.to_string_lossy(), "name": name, "branch": branch,
        "ahead": 0, "behind": 0, "files": 0, "tech_stack": [],
        "build_status": if status.get("clean") == Some(&Value::Bool(true)) { "Clean" } else { "Modified" },
        "last_activity": crate::types::time::now_utc_rfc3339()
    });
    Ok(json!({"repos": [repo], "scanned_dir": workspace.to_string_lossy()}))
}

fn context_fragments(workspace: &Path) -> Result<Value, String> {
    let files = context_files(workspace)?;
    let fragments = files.as_array().into_iter().flatten().filter_map(|file| {
        let path = file.get("path")?.as_str()?;
        let content = std::fs::read_to_string(path).ok()?;
        let token_estimate = content.len() / 4;
        Some(json!({
            "category": "agent_guide", "title": file.get("name")?, "content": content,
            "tokenEstimate": token_estimate, "path": path
        }))
    }).collect();
    Ok(Value::Array(fragments))
}

fn assembled_context(workspace: &Path) -> Result<Value, String> {
    let fragments = context_fragments(workspace)?;
    let items = fragments.as_array().cloned().unwrap_or_default();
    let prompt = items.iter().filter_map(|item| item.get("content").and_then(Value::as_str)).collect::<Vec<_>>().join("\n\n");
    let used = items.iter().filter_map(|item| item.get("path").cloned()).collect::<Vec<_>>();
    let total_bytes = prompt.len();
    Ok(json!({"promptContext": prompt, "assembled": prompt, "fragmentsUsed": used, "totalBytes": total_bytes}))
}

fn overview(workspace: &Path, model: &str) -> Result<Value, String> {
    let skills_count = skills(workspace)?.as_array().map_or(0, Vec::len);
    let memory_sessions = memory_sessions(workspace, 500)?.as_array().map_or(0, Vec::len);
    let git = git_scan(workspace)?;
    Ok(json!({
        "node": null,
        "sync": {"status": "local", "connected": false},
        "providers": {"active_model": model},
        "skills_count": skills_count,
        "memory_sessions": memory_sessions,
        "repos": git.get("repos").cloned().unwrap_or_else(|| json!([])),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_workspace(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!(
            "chronokairo-runtime-api-{name}-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&path);
        std::fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn patch_dry_run_does_not_write_and_backup_can_revert() {
        let _profile = crate::config::global_settings::TestHome::new();
        let workspace = test_workspace("patch");
        let file = workspace.join("sample.txt");
        std::fs::write(&file, "old\n").unwrap();
        let params = json!({
            "patch": "--- a/sample.txt\n+++ b/sample.txt\n@@ -1,1 +1,1 @@\n-old\n+new"
        });

        let preview = patch_dry_run(&workspace, &params).unwrap();
        assert_eq!(preview.get("valid"), Some(&Value::Bool(true)));
        assert_eq!(std::fs::read_to_string(&file).unwrap(), "old\n");

        let applied = patch_commit(&workspace, &params, true).unwrap();
        assert_eq!(std::fs::read_to_string(&file).unwrap(), "new\n");
        let patch_id = applied.get("patch_id").and_then(Value::as_u64).unwrap();
        revert_patch(&workspace, &json!({"patchId": patch_id})).unwrap();
        assert_eq!(std::fs::read_to_string(&file).unwrap(), "old\n");
        std::fs::remove_dir_all(workspace).unwrap();
    }

    #[test]
    fn file_search_returns_frontend_contract() {
        let workspace = test_workspace("search");
        std::fs::write(workspace.join("runtime_boundary.md"), "boundary").unwrap();
        let result = search_files(
            &workspace,
            &json!({"query": "runtime", "roots": [workspace], "limit": 10}),
        )
        .unwrap();
        assert_eq!(result.get("totalMatches"), Some(&json!(1)));
        assert_eq!(result.get("results").and_then(Value::as_array).unwrap().len(), 1);
    }
}
