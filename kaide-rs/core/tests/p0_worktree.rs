//! P0 de mercado NOVO — worktree por task + checkpoints/recuperação durável.
//!
//! Valida: criação/listagem/remoção de worktree dedicado por task, checkpoint
//! git-backed com manifest persistido, restauração pós-crash, integração no
//! ToolRegistry e exposição via runtime_api (IPC do desktop).

use kaide::agent::checkpoint::{Checkpoint, CheckpointStore};
use kaide::agent::state::AgentState;
use kaide::agent::tool_registry::{ToolContext, ToolEffect, ToolRegistry};
use kaide::agent::agent_loop::AgentHooks;
use kaide::app_server::runtime_api;
use kaide::config::settings::Config;
use kaide::llm::client::LlmClient;
use kaide::llm::router::LlmRouter;
use kaide::providers::ProviderCatalog;
use kaide::tools::worktree::{branch_for_task, sanitize_id, WorktreeManager};
use std::collections::BTreeMap;

fn temp_git_workspace(tag: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "chronokairo-p0-wt-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    let run = |args: &[&str]| {
        let output = std::process::Command::new("git")
            .args(args)
            .current_dir(&dir)
            .output()
            .unwrap_or_else(|error| {
                panic!(
                    "git {} in {} (exists={}): {error:?}",
                    args.join(" "),
                    dir.display(),
                    dir.exists()
                );
            });
        if !output.status.success() {
            panic!(
                "git {} failed: {}",
                args.join(" "),
                String::from_utf8_lossy(&output.stderr)
            );
        }
    };
    run(&["init", "-q"]);
    run(&["config", "user.email", "p0@test"]);
    run(&["config", "user.name", "p0"]);
    std::fs::write(dir.join("README.md"), "# repo p0\n").unwrap();
    run(&["add", "."]);
    run(&["commit", "-q", "-m", "base"]);
    dir
}

fn cleanup(dir: &std::path::Path) {
    let _ = std::fs::remove_dir_all(dir);
}

// ---------------------------------------------------------------------------
// P0: worktree por task.
// ---------------------------------------------------------------------------

#[test]
fn p0_worktree_lifecycle_per_task() {
    let repo = temp_git_workspace("lifecycle");
    let manager = WorktreeManager::new(repo.clone());

    // Branch determinístico e id sanitizado.
    assert_eq!(sanitize_id("Fix Login!"), "Fix-Login");
    assert_eq!(branch_for_task("Fix Login!"), "ck/task/Fix-Login");

    let info = manager.create("fix login bug").unwrap();
    assert_eq!(info.id, "fix-login-bug");
    assert_eq!(info.branch, "ck/task/fix-login-bug");
    assert!(info.path.contains(".chronokairo-worktrees"));
    assert!(info.path.contains("fix-login-bug"));
    assert!(std::path::Path::new(&info.path).exists());
    assert!(!info.head.is_empty());

    // Idempotência: criar de novo devolve o mesmo worktree.
    let again = manager.create("fix login bug").unwrap();
    assert_eq!(again.path, info.path);
    assert_eq!(again.branch, info.branch);

    // O worktree é um checkout git funcional e isolado do repo principal.
    std::fs::write(
        std::path::Path::new(&info.path).join("task-file.txt"),
        "escrito no worktree",
    )
    .unwrap();
    assert!(!repo.join("task-file.txt").exists(), "main checkout untouched");
    let status = std::process::Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(&info.path)
        .output()
        .unwrap();
    assert!(String::from_utf8_lossy(&status.stdout).contains("task-file.txt"));

    // Listagem mostra só os worktrees de task (não o checkout principal).
    let list = manager.list().unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].id, "fix-login-bug");

    // Segunda task ganha worktree próprio sem conflito.
    manager.create("second task").unwrap();
    assert_eq!(manager.list().unwrap().len(), 2);

    // Remoção limpa worktree + branch.
    manager.remove("fix login bug", true).unwrap();
    assert!(!manager.exists("fix login bug"));
    assert_eq!(manager.list().unwrap().len(), 1);
    let branches = std::process::Command::new("git")
        .args(["branch", "--list", "ck/task/fix-login-bug"])
        .current_dir(&repo)
        .output()
        .unwrap();
    assert!(
        String::from_utf8_lossy(&branches.stdout).trim().is_empty(),
        "task branch must be deleted"
    );

    // Remoção de worktree inexistente é erro explícito.
    assert!(manager.remove("no such task", false).is_err());

    cleanup(&repo);
}

// ---------------------------------------------------------------------------
// P0: checkpoints duráveis — criar, persistir, restaurar pós-crash.
// ---------------------------------------------------------------------------

#[test]
fn p0_checkpoints_snapshot_and_restore_after_corruption() {
    let repo = temp_git_workspace("checkpoints");
    let store = CheckpointStore::for_workspace(&repo);

    std::fs::write(repo.join("work.rs"), "v1 do trabalho\n").unwrap();
    let first = store.create("task-alpha", "primeiro marco", Some(42), 3, 17).unwrap();
    assert!(first.id.starts_with("ckp-"));
    assert_eq!(first.task_id, "task-alpha");
    assert_eq!(first.session_id, Some(42));
    assert_eq!(first.turn_id, 3);
    assert_eq!(first.event_seq, 17);
    assert_eq!(first.message, "primeiro marco");
    assert!(!first.commit.is_empty());
    assert!(!first.created_at.is_empty());

    // Segundo checkpoint com mudanças adicionais.
    std::fs::write(repo.join("work.rs"), "v2 do trabalho\n").unwrap();
    let second = store
        .create("task-alpha", "segundo marco", Some(42), 4, 31)
        .unwrap();

    // Manifest persistido no workspace e recarregável (recuperação durável).
    let reloaded_store = CheckpointStore::for_workspace(&repo);
    let all: Vec<Checkpoint> = reloaded_store.list(Some("task-alpha")).unwrap();
    assert_eq!(all.len(), 2);
    assert_eq!(all[0].id, first.id);
    assert_eq!(all[1].id, second.id);

    // Simula crash/corrupção: trabalho "perdido" além do último checkpoint.
    std::fs::write(repo.join("work.rs"), "trabalho corrompido sem commit\n").unwrap();
    std::fs::write(repo.join("stray.txt"), "arquivo perdido\n").unwrap();

    // Restaurar o primeiro checkpoint volta o conteúdo congelado.
    let restored = reloaded_store.restore(&first.id).unwrap();
    assert_eq!(restored.commit, first.commit);
    assert_eq!(
        std::fs::read_to_string(repo.join("work.rs")).unwrap(),
        "v1 do trabalho\n"
    );

    // Restaurar o segundo checkpoint recupera o estado mais recente.
    reloaded_store.restore(&second.id).unwrap();
    assert_eq!(
        std::fs::read_to_string(repo.join("work.rs")).unwrap(),
        "v2 do trabalho\n"
    );

    // Checkpoint inexistente é erro explícito.
    assert!(reloaded_store.restore("ckp-9999").is_err());

    // Filtro por task: outra task não vê os checkpoints da task-alpha.
    assert!(reloaded_store.list(Some("task-beta")).unwrap().is_empty());
    assert_eq!(reloaded_store.list(None).unwrap().len(), 2);

    cleanup(&repo);
}

// ---------------------------------------------------------------------------
// Integração: tools registradas no ToolRegistry do agente.
// ---------------------------------------------------------------------------

fn registry_context(tag: &str) -> (AgentState, LlmRouter) {
    // Base dedicada com subpastas: o parent da workspace é a base da test,
    // nunca a raiz do temp do sistema.
    let base = std::env::temp_dir().join(format!(
        "chronokairo-p0-wt-ctx-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&base);
    let cfg = Config {
        workspace_dir: base.join("workspace"),
        memory_dir: base.join("memory"),
        spec_lock: false,
        max_retries: 1,
        ..Config::default()
    };
    let state = AgentState::new(cfg).unwrap();
    let router = LlmRouter::with_catalog(
        LlmClient::ollama("http://localhost:11434"),
        ProviderCatalog {
            catalog: Default::default(),
        },
    );
    (state, router)
}

#[test]
fn p0_worktree_and_checkpoint_registered_as_tools() {
    let registry = ToolRegistry::new();
    assert!(registry.has_tool("worktree"));
    assert!(registry.has_tool("checkpoint"));
    // Ambas exigem approval (efeito Command — mutam estado global do repo).
    assert_eq!(registry.get("worktree").unwrap().effect_class(), ToolEffect::Command);
    assert!(registry.get("checkpoint").unwrap().requires_approval());
    assert!(registry.all_schemas().len() >= 14);

    let (mut state, router) = registry_context("tools");
    let hooks = AgentHooks::default();
    let workspace = state.config.workspace_dir.clone();

    let args: BTreeMap<String, kaide::json::Value> = [
        ("op".to_string(), kaide::json!("create")),
        ("task_id".to_string(), kaide::json!("supervision-demo")),
    ]
    .into_iter()
    .collect();
    let mut ctx = ToolContext {
        state: &mut state,
        hooks: &hooks,
        client: &router,
    };
    let out = registry.execute("worktree", &mut ctx, &args).unwrap();
    // Sem git init o comando falha — mas degrada em mensagem útil, não panic.
    assert!(
        out.output.contains("failed") || out.output.contains("worktree"),
        "tool must report status: {}",
        out.output
    );

    let _ = std::fs::remove_dir_all(workspace.parent().unwrap());
}

// ---------------------------------------------------------------------------
// Integração: exposição via runtime_api (o que a casca Tauri consome).
// ---------------------------------------------------------------------------

#[test]
fn p0_runtime_api_exposes_worktrees_and_checkpoints() {
    let repo = temp_git_workspace("runtime-api");

    // Discovery
    for method in [
        "create_task_worktree",
        "list_task_worktrees",
        "remove_task_worktree",
        "create_checkpoint",
        "restore_checkpoint",
        "list_checkpoints",
    ] {
        assert!(runtime_api::supports(method), "missing {method}");
    }

    // create_task_worktree
    let params = serde_json::json!({ "taskId": "api-task" });
    let info = runtime_api::call("create_task_worktree", Some(&params), &repo, "qwen3:1.7b").unwrap();
    assert!(info.get("path").and_then(|v| v.as_str()).unwrap_or("").contains("api-task"));
    assert_eq!(
        info.get("branch").and_then(|v| v.as_str()),
        Some("ck/task/api-task")
    );

    // list_task_worktrees
    let listed = runtime_api::call("list_task_worktrees", None, &repo, "qwen3:1.7b").unwrap();
    let worktrees = listed.get("worktrees").and_then(|v| v.as_array()).unwrap();
    assert_eq!(worktrees.len(), 1);

    // create_checkpoint (com ids de correlação de sessão/event log)
    let params = serde_json::json!({
        "taskId": "api-task",
        "message": "marco via api",
        "sessionId": 7,
        "turnId": 2,
        "eventSeq": 99
    });
    let checkpoint = runtime_api::call("create_checkpoint", Some(&params), &repo, "qwen3:1.7b").unwrap();
    let checkpoint_id = checkpoint.get("id").and_then(|v| v.as_str()).unwrap().to_string();
    assert!(checkpoint_id.starts_with("ckp-"));
    assert_eq!(checkpoint.get("session_id").and_then(|v| v.as_i64()), Some(7));
    assert_eq!(checkpoint.get("event_seq").and_then(|v| v.as_u64()), Some(99));

    // list_checkpoints
    let listed = runtime_api::call("list_checkpoints", None, &repo, "qwen3:1.7b").unwrap();
    assert_eq!(
        listed
            .get("checkpoints")
            .and_then(|v| v.as_array())
            .map(Vec::len),
        Some(1)
    );

    // restore_checkpoint
    let params = serde_json::json!({ "checkpointId": checkpoint_id });
    let restored = runtime_api::call("restore_checkpoint", Some(&params), &repo, "qwen3:1.7b").unwrap();
    assert_eq!(
        restored.get("id").and_then(|v| v.as_str()),
        Some(checkpoint_id.as_str())
    );

    // remove_task_worktree
    let params = serde_json::json!({ "taskId": "api-task", "force": true });
    let removed = runtime_api::call("remove_task_worktree", Some(&params), &repo, "qwen3:1.7b").unwrap();
    assert_eq!(removed.get("removed").and_then(|v| v.as_bool()), Some(true));
    let listed = runtime_api::call("list_task_worktrees", None, &repo, "qwen3:1.7b").unwrap();
    assert_eq!(
        listed.get("worktrees").and_then(|v| v.as_array()).map(Vec::len),
        Some(0)
    );

    // taskId ausente é erro explícito.
    let error = runtime_api::call("create_task_worktree", Some(&serde_json::json!({})), &repo, "qwen3:1.7b");
    assert!(error.unwrap_err().contains("taskId"));

    cleanup(&repo);
}
