//! P0 de mercado (fundação) — testes de integração das tools do coding agent.
//!
//! Valida: fs (contenção + transacional), find/replace, shell (gates de
//! segurança), exec_policy persistente, sandbox declarativo, patch
//! (create/preview/apply + rollback transacional), git e picker (sub-sistema
//! de busca da TUI).

use ckc::config::settings::Config;
use ckc::tools::exec_policy::{Decision, ExecPolicy, ExecRule};
use ckc::tools::find_replace::{find_all, replace_all, FindOptions};
use ckc::tools::fs::FileTools;
use ckc::tools::git::GitTools;
use ckc::tools::patch::{apply_patch, create_patch, preview_patch};
use ckc::tools::picker::autocomplete_prefix;
use ckc::tools::picker::pick;
use ckc::tools::sandbox::SandboxPolicy;
use ckc::tools::shell::{is_allowed, run_command, run_command_raw};
use ckc::tools::transaction::WorkspaceTransaction;

fn temp_workspace(tag: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "chronokairo-p0-tools-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

// ---------------------------------------------------------------------------
// P0: ferramentas básicas — fs com contenção de workspace.
// ---------------------------------------------------------------------------

#[test]
fn p0_fs_tool_roundtrip_and_containment() {
    let ws = temp_workspace("fs");
    let tools = FileTools::new(ws.clone());

    tools.write_file("docs/readme.md", "linha 1\nlinha 2\n").unwrap();
    assert_eq!(
        tools.read_file("docs/readme.md").as_deref(),
        Some("linha 1\nlinha 2\n")
    );

    // Leitura com goto e intervalo de linhas.
    let (path, line, _col) = FileTools::parse_goto("docs/readme.md:2");
    assert_eq!(path, "docs/readme.md");
    assert_eq!(line, Some(2));
    let ranged = tools.read_file_range("docs/readme.md", 1, 1).unwrap();
    assert!(ranged.contains("linha 1"));

    // Escapes são rejeitados sem tocar o disco.
    assert!(tools.read_file("../fora.txt").is_none());
    assert!(tools.resolve("../fora.txt").is_none());
    assert!(tools.resolve("/etc/passwd").is_none());

    // replace_exact exige correspondência única.
    tools.write_file("single.txt", "alpha beta\n").unwrap();
    tools.replace_exact("single.txt", "beta", "gamma").unwrap();
    assert_eq!(tools.read_file("single.txt").as_deref(), Some("alpha gamma\n"));
    tools.write_file("dup.txt", "x x\n").unwrap();
    assert!(tools.replace_exact("dup.txt", "x", "y").is_err());

    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: find/replace (busca de código — funções puras).
// ---------------------------------------------------------------------------

#[test]
fn p0_find_replace_searches_and_rewrites() {
    let text = "fn alpha() {}\nfn beta() {}\nconst ALPHA: u8 = 1;\n";
    let matches = find_all(text, "alpha", FindOptions { match_case: false, ..FindOptions::default() });
    assert_eq!(matches.len(), 2);
    assert_eq!(matches[0].line, 1);

    let (rewritten, count) = replace_all(
        text,
        "ALPHA",
        "OMEGA",
        FindOptions { match_case: true, ..FindOptions::default() },
    );
    assert_eq!(count, 1);
    assert!(rewritten.contains("OMEGA: u8"));
    assert!(!rewritten.contains("fn OMEGA"));

    // Whole word não substitui dentro de identificadores.
    let (rewritten, count) = replace_all(
        "value values\n",
        "value",
        "x",
        FindOptions { whole_word: true, ..FindOptions::default() },
    );
    assert_eq!(count, 1);
    assert_eq!(rewritten, "x values\n");
}

// ---------------------------------------------------------------------------
// P0: shell com gates de segurança — comandos perigosos nunca executam.
// ---------------------------------------------------------------------------

#[test]
fn p0_shell_gates_block_dangerous_and_allow_benign() {
    let ws = temp_workspace("shell");
    let config = Config {
        workspace_dir: ws.clone(),
        ..Config::default()
    };

    // Bloqueados antes de spawnar processo algum.
    for dangerous in ["rm -rf /", "sudo rm x", "format c: drive", "reboot now"] {
        assert!(!is_allowed(dangerous, &config), "must block: {dangerous}");
    }
    assert!(!is_allowed("", &config));

    // Fuga de workspace com executável mutante é recusada sem execução.
    let escape = format!("rm {}/outside.txt", std::env::temp_dir().display());
    let refused = run_command(&escape, &config);
    assert!(
        refused.contains("outside the workspace") || refused.contains("rejected") || refused.contains("forbidden"),
        "escape must be refused, got: {refused}"
    );

    // Comando benigno allowlistado roda e devolve stdout.
    let out = run_command_raw("echo ck-p0-shell-ok", &config);
    assert!(out.stdout.contains("ck-p0-shell-ok"));
    assert_eq!(out.code, Some(0));
    assert!(!out.timed_out);
    assert!(out.combined().contains("ck-p0-shell-ok"));

    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: exec_policy persistente — roundtrip TOML e decisão mais restritiva.
// ---------------------------------------------------------------------------

#[test]
fn p0_exec_policy_persists_and_takes_most_restrictive_decision() {
    let dir = temp_workspace("exec-policy");
    let path = dir.join("exec_policy.toml");

    let policy = ExecPolicy {
        rules: vec![
            ExecRule {
                command: "cargo *".into(),
                decision: Decision::Allow,
                scope: None,
                justification: Some("build tool".into()),
            },
            ExecRule {
                command: "cargo *".into(),
                decision: Decision::Forbidden,
                scope: None,
                justification: None,
            },
        ],
    };
    policy.save(&path).unwrap();
    let loaded = ExecPolicy::load(&path).unwrap();
    assert_eq!(loaded.rules.len(), 2);

    let (decision, rule) = loaded.check(
        &["cargo".to_string(), "build".to_string()],
        Some(&dir),
    );
    assert_eq!(decision, Decision::Forbidden);
    assert!(rule.unwrap().command.starts_with("cargo"));

    // Sem match: Prompt (denúncia explícita, nunca silencioso).
    let (decision, rule) = loaded.check(&["python3".to_string()], Some(&dir));
    assert_eq!(decision, Decision::Prompt);
    assert!(rule.is_none());

    // Arquivo inexistente → política vazia, não erro.
    let missing = ExecPolicy::load(&dir.join("nope.toml")).unwrap();
    assert!(missing.rules.is_empty());

    let _ = std::fs::remove_dir_all(&dir);
}

// ---------------------------------------------------------------------------
// P0: sandbox declarativo — path traversal, patterns e comandos.
// ---------------------------------------------------------------------------

#[test]
fn p0_sandbox_policy_checks_paths_commands_and_network() {
    let ws = temp_workspace("sandbox");
    std::fs::create_dir_all(ws.join("src")).unwrap();
    std::fs::write(ws.join("src/main.rs"), "fn main() {}\n").unwrap();
    let policy = SandboxPolicy::new(ws.clone());

    // Dentro do workspace ok.
    assert!(policy.check_read_path("src/main.rs").is_ok());
    // Traversal fora é rejeitado com violação legível.
    let violation = policy.check_read_path("../../etc/passwd").unwrap_err();
    assert!(format!("{violation}").to_lowercase().contains("traversal"));
    // Padrões negados por padrão (.env, .git, id_rsa).
    assert!(policy.check_read_path(".env").is_err());
    assert!(policy.check_write_path("id_rsa").is_err());
    // Escrita fora do workspace sem allowlist.
    let outside = ws.parent().unwrap().join("p0-sandbox-outside.txt");
    let violation = policy.check_write_path(&outside).unwrap_err();
    assert!(format!("{violation}").to_lowercase().contains("workspace"));

    // Comandos: rm -rf / negado; allowlist em branco libera benignos.
    assert!(policy.check_command("rm -rf /").is_err());
    assert!(policy.check_command("echo hi").is_ok());

    // Rede bloqueada quando desligada; liberada por padrão.
    assert!(policy.check_network("http://example.com").is_ok());
    let no_net = SandboxPolicy {
        allow_network: false,
        ..SandboxPolicy::new(ws.clone())
    };
    assert!(no_net.check_network("http://example.com").is_err());

    // scrub de variáveis de ambiente sensíveis.
    let scrubbed = policy.clean_env_vars();
    assert!(scrubbed.iter().all(|(key, _)| {
        !key.ends_with("_KEY") && !key.ends_with("_TOKEN") && key != "AWS_SECRET_ACCESS_KEY"
    }));

    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: patch unificado — create → preview (dry-run) → apply + rollback
// transacional do turno.
// ---------------------------------------------------------------------------

#[test]
fn p0_patch_preview_apply_and_transactional_rollback() {
    let ws = temp_workspace("patch");
    std::fs::write(ws.join("app.txt"), "um\ndois\ntres\nquatro\n").unwrap();

    let hunk = create_patch("um\ndois\ntres\nquatro\n", "um\ndois\ntres\nQUATRO\ncinco\n");
    assert!(hunk.contains("@@"));
    let patch = format!("--- a/app.txt\n+++ b/app.txt\n{hunk}");

    // Preview não escreve.
    let results = preview_patch(&ws, &patch).unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].file_path, "app.txt");
    assert_eq!(
        std::fs::read_to_string(ws.join("app.txt")).unwrap(),
        "um\ndois\ntres\nquatro\n"
    );

    // Transação do turno: baseline, mutação via patch, diff, rollback.
    let txn = WorkspaceTransaction::begin(ws.clone(), 1024 * 1024).unwrap();
    let applied = apply_patch(&ws, &patch).unwrap();
    assert_eq!(applied.len(), 1);
    assert!(applied[0].lines_added >= 1);
    let mutated = std::fs::read_to_string(ws.join("app.txt")).unwrap();
    assert!(mutated.contains("QUATRO"));

    let diff = txn.diff().unwrap();
    assert!(diff.paths().iter().any(|p| p.contains("app.txt")));

    let restored = txn.rollback().unwrap();
    assert_eq!(
        std::fs::read_to_string(ws.join("app.txt")).unwrap(),
        "um\ndois\ntres\nquatro\n"
    );
    assert!(restored.paths().iter().any(|p| p.contains("app.txt")));

    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: git integrado — init, commit, branch, log, stash.
// ---------------------------------------------------------------------------

#[test]
fn p0_git_tool_commits_branches_and_reports() {
    let ws = temp_workspace("git");
    let repo = ws.to_string_lossy().to_string();
    let git = GitTools::new(repo.clone());

    assert!(!git.is_git_repo());
    git.init();
    assert!(git.is_git_repo());

    // Identidade local para commit funcionar em sandbox/CI.
    let _ = run_command_raw(
        "git config user.email p0@test && git config user.name p0",
        &Config {
            workspace_dir: ws.clone(),
            ..Config::default()
        },
    );

    std::fs::write(ws.join("main.rs"), "fn main() {}\n").unwrap();
    git.add(".");
    assert!(git.commit("commit p0").contains("main") || git.commit("commit p0").contains("root"));
    let log = git.log(5);
    assert!(log.contains("commit p0"));

    // Diff da working tree reflete mutação pendente.
    std::fs::write(ws.join("main.rs"), "fn main() { changed }\n").unwrap();
    let diff = git.diff("HEAD");
    assert!(diff.contains("changed"));

    // Branch + checkout volta ao estado anterior.
    git.branch("p0-base");
    assert!(git.list_branches().contains("p0-base"));
    git.branch("p0-branch");
    git.checkout_branch("p0-base");
    assert!(git.status().contains("main.rs"));

    // Stash e pop restauram a working tree.
    git.stash("p0 wip");
    assert!(!git.diff("HEAD").contains("changed"));
    git.stash_pop();
    assert!(git.diff("HEAD").contains("changed"));

    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: TUI — sub-sistema de busca de arquivos (picker fuzzy + autocomplete).
// ---------------------------------------------------------------------------

#[test]
fn p0_tui_file_search_ranks_prefix_and_autocompletes() {
    let files: Vec<String> = vec![
        "src/agent/agent_loop.rs".into(),
        "src/agent/state.rs".into(),
        "src/llm/client.rs".into(),
        "src/tools/fs.rs".into(),
    ];
    let matches = pick("agent", &files, 3);
    assert!(!matches.is_empty());
    // Prefixo no nome do arquivo pontua mais que subsequência.
    assert!(matches[0].path.contains("agent"));
    assert!(matches.iter().all(|m| m.score > 0));

    let completions = autocomplete_prefix("src/llm/", &files);
    assert_eq!(completions, vec!["src/llm/client.rs".to_string()]);
}
