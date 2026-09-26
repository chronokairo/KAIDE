// Experimental subsystems (GPU inference kernels, bench, hardware detection) expose
// API that is not yet wired into the CLI — keep them compiling without dead-code noise.
#![allow(dead_code)]

mod cli_args;
mod error;
mod base64;
mod random;
mod password;
mod json;
mod serde_json;
mod editor;
mod agent;
mod app_server;
mod bench;
pub mod async_rt;
pub use async_rt as tokio;
mod compressor;
mod config;
pub mod http;
mod hw_recommend;
mod llm;
mod logger;
mod mcp;
mod memory;
mod protocol;
mod providers;
mod repo;
mod skills;
mod tools;
mod types;
mod ui;

use agent::agent_loop::run_agent_loop;
use agent::state::AgentState;
use crate::error::Result;
use app_server::AppServer;
use cli_args::{Cli, Commands, ProvidersAction};
use config::settings::Config;
use llm::client::LlmClient;
use llm::infer::engine::InferenceEngine;
use llm::infer::gguf::GgufReader;
use llm::infer::model::Model;
use llm::infer::tokenizer::Tokenizer;
use llm::model_resolver;
use llm::router::{LlmRouter, DEFAULT_CLOUD_MODEL};
use mcp::server::McpServer;
use std::io::IsTerminal;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

fn init_file_logger() -> crate::error::Result<()> {
    logger::CkiLogger::init_file("chronokairo.log", logger::Level::Info)
        .map_err(|e| crate::error::anyhow!("{e}"))?;
    Ok(())
}

/// Default model for cloud inference.  Plain-name providers (Ollama Cloud)
/// use their own default; provider-qualified ids like NVIDIA's use `nvidia/…`.
const OLLAMA_CLOUD_DEFAULT_MODEL: &str = "nemotron-3-nano:30b";

/// Build the LLM router: a local backend (Ollama or local GGUF) plus, when
/// `--cloud` is given, a cloud backend for the selected provider.
async fn build_router(cli: &Cli, cfg: &mut Config) -> Result<LlmRouter> {
    if let Some(ref m) = cli.model {
        cfg.coder_model = m.clone();
        cfg.planner_model = m.clone();
        cfg.summarizer_model = m.clone();
    }
    let local = if !cli.cloud {
        let model_name = if let Some(ref m) = cli.model {
            m.clone()
        } else {
            let available = model_resolver::list_models(&cfg.models_dir);
            if let Some(first) = available.into_iter().next() {
                eprintln!("No --model specified; auto-detected local GGUF: '{first}'");
                cfg.coder_model = first.clone();
                cfg.planner_model = first.clone();
                cfg.summarizer_model = first.clone();
                first
            } else {
                let ollama_models = providers::catalog::fetch_ollama_models().unwrap_or_default();
                if let Some((first, _)) = ollama_models.into_iter().next() {
                    eprintln!("No local GGUF specified; auto-detected Ollama model: '{first}'");
                    cfg.coder_model = first.clone();
                    cfg.planner_model = first.clone();
                    cfg.summarizer_model = first.clone();
                    first
                } else {
                    "qwen3.5:2b".to_string()
                }
            }
        };

        match model_resolver::resolve_model(&model_name, &cfg.models_dir) {
            Ok(blob_path) => {
                eprintln!("Loading {} from {}...", model_name, blob_path.display());
                let model = Model::load(&blob_path.to_string_lossy())?;
                let reader = GgufReader::load(&blob_path.to_string_lossy())?;
                let tokenizer = Tokenizer::load_from_gguf(&reader)?;
                let mut engine = InferenceEngine::new(model, tokenizer, cfg.max_seq_len);
                if cli.no_gpu {
                    engine.disable_gpu();
                    println!("GPU acceleration disabled by flag (--no-gpu); running on CPU.");
                } else if engine.gpu_active() {
                    println!("GPU acceleration active (OpenCL).");
                } else if cli.gpu {
                    #[cfg(feature = "gpu")]
                    println!("Notice: OpenCL GPU not available; running on CPU.");
                    #[cfg(not(feature = "gpu"))]
                    println!("Notice: Built without --features gpu; running on CPU.");
                }
                LlmClient::local(engine)
            }
            Err(e) => {
                if cli.local {
                    return Err(e);
                }
                eprintln!("No local GGUF found for '{model_name}'. Using Ollama at {}...", cfg.ollama_host);
                cfg.coder_model = model_name.clone();
                cfg.planner_model = model_name.clone();
                cfg.summarizer_model = model_name;
                LlmClient::ollama(&cfg.ollama_host)
            }
        }
    } else {
        LlmClient::ollama(&cfg.ollama_host)
    };
    let router = LlmRouter::new(local);

    if cli.cloud {
        let base = router.set_provider(&cli.provider)?;
        let model = cli
            .cloud_model
            .clone()
            .or_else(|| std::env::var("CLOUD_MODEL").ok())
            .unwrap_or_else(|| {
                if cli.provider == "ollama-cloud" {
                    OLLAMA_CLOUD_DEFAULT_MODEL.to_string()
                } else {
                    DEFAULT_CLOUD_MODEL.to_string()
                }
            });
        cfg.planner_model = std::env::var("PLANNER_MODEL")
            .ok()
            .unwrap_or_else(|| model.clone());
        cfg.coder_model = std::env::var("CODER_MODEL")
            .ok()
            .unwrap_or_else(|| model.clone());
        cfg.summarizer_model = std::env::var("SUMMARIZER_MODEL")
            .ok()
            .unwrap_or_else(|| model.clone());
        // Plain-name cloud models (e.g. Ollama Cloud) have no `/` prefix, so
        // mark them explicitly so the router sends them to the cloud backend.
        router.mark_cloud(&model);
        eprintln!(
            "Cloud inference: provider='{}' base={} model={}",
            cli.provider, base, model
        );
    }
    Ok(router)
}

fn main() -> Result<()> {
    crate::async_rt::block_on(async_main())
}

async fn async_main() -> Result<()> {
    let cli = Cli::parse();
    // The TUI owns the alternate screen, so route all log output to a file
    // instead of stdout. Otherwise retry warnings (HTTP 429/5xx backoff) from
    // the LLM client interleave with the rendered frames and corrupt the UI.
    let tui_mode = matches!(cli.command, Some(Commands::Tui))
        || (cli.command.is_none()
            && cli.task.is_none()
            && std::io::stdin().is_terminal()
            && std::io::stdout().is_terminal());
    let protocol_mode = matches!(cli.command, Some(Commands::AppServer | Commands::McpServer))
        || matches!(cli.command, Some(Commands::Exec { jsonl: true, .. }));
    if tui_mode || protocol_mode {
        init_file_logger()?;
    } else {
        logger::CkiLogger::init_stderr(logger::Level::Info);
    }
    if cli.no_gpu {
        std::env::set_var("CKC_NO_GPU", "1");
    }
    providers::load_dotenv();
    llm::infer::ops::init_thread_pool();
    let mut cfg = Config {
        workspace_dir: crate::tools::fs::normalize_workspace_path(&PathBuf::from(&cli.dir)),
        use_local: cli.local,
        ..Config::default()
    };
    if cli.download_embedding_model {
        // Run the blocking download on a plain thread so reqwest's internal
        // runtime is dropped off the async main runtime (which would panic).
        let handle = std::thread::spawn(llm::embedder::download_embedding_model);
        let path = match handle.join() {
            Ok(Ok(path)) => path,
            Ok(Err(error)) => return Err(error),
            Err(_) => crate::error::bail!("embedding model download thread panicked"),
        };
        println!(
            "Embedding model ready at {} (global config dir — found automatically by memory_search from any project).",
            path.display()
        );
        return Ok(());
    }

    if let Some(Commands::Translate {
        file,
        model,
        to,
        gpu,
        out,
    }) = cli.command
    {
        return crate::tools::pdf_translator::translate_pdf_cli(
            &file,
            &model,
            &to,
            out.as_deref(),
            &cfg.ollama_host,
            gpu.as_deref(),
        )
        .await;
    }

    if let Some(Commands::Context { task, budget }) = &cli.command {
        let pack = crate::repo::ChronoContextEngine::build_context_pack(
            &cfg.workspace_dir,
            task.as_deref(),
            *budget,
        );
        println!("{pack}");
        return Ok(());
    }

    match &cli.command {
        Some(Commands::Check) => return hw_check().await,
        Some(Commands::Cloud { query }) => {
            let catalog = providers::ProviderCatalog::load();
            catalog.print_list(query);
            return Ok(());
        }
        Some(Commands::Providers { action }) => {
            return handle_providers(action.clone()).await;
        }
        Some(Commands::Pull { model }) => return crate::llm::pull::pull_model(model).map(|_| ()),
        Some(Commands::Rm { model }) => return crate::llm::manage::rm_model(model),
        Some(Commands::Show { model }) => return crate::llm::manage::show_model(model),
        Some(Commands::Cp { source, target }) => return crate::llm::manage::cp_model(source, target),
        Some(Commands::Ps) => return crate::llm::manage::ps_status(),
        Some(Commands::Run { model, prompt, no_gpu }) => {
            return crate::llm::manage::run_direct(model, prompt.as_deref(), *no_gpu || cli.no_gpu);
        }
        Some(Commands::Models) => {
            return crate::llm::manage::list_models_detailed(&cfg.models_dir);
        }
        _ => {}
    }

    let client = build_router(&cli, &mut cfg).await?;
    let mut state = AgentState::new(cfg)?;
    if cli.cont || cli.resume {
        continue_latest_session(&mut state)?;
    }

    match cli.command {
        Some(Commands::Check) => unreachable!(),
        Some(Commands::Cloud { .. }) => unreachable!(),
        Some(Commands::Providers { .. }) => unreachable!(),
        Some(Commands::Bench {
            category,
            output,
            cloud,
        }) => {
            let results = bench::model_bench::rank_models(&state.config.models_dir, &category);
            bench::model_bench::save_ranking(&results, std::path::Path::new(&output))?;
            bench::display::show_ranking_table(&results)?;
            if cloud {
                let cloud_results =
                    bench::model_bench::rank_cloud_models(&get_cloud_models()).await;
                bench::model_bench::save_ranking(&cloud_results, std::path::Path::new(&output))?;
                bench::display::show_ranking_table(&cloud_results)?;
            }
        }
        Some(Commands::Models) => unreachable!(),
        Some(Commands::Tui) => {
            if cli.cloud {
                if let Ok(_base) = client.set_provider(&cli.provider) {
                    let model = cli.cloud_model.clone().unwrap_or_else(|| DEFAULT_CLOUD_MODEL.to_string());
                    state.config.coder_model = model.clone();
                    state.config.planner_model = model.clone();
                    state.config.summarizer_model = model.clone();
                    client.mark_cloud(&model);
                }
            }
            ui::run_ui(client, state).map_err(|e| crate::error::anyhow!(e.to_string()))?;
        }
        Some(Commands::Repl) => {
            repl(&client, &mut state).await?;
        }
        Some(Commands::Exec {
            task,
            plan,
            jsonl,
            yes,
        }) => {
            let hooks = build_exec_hooks(jsonl, yes);
            crate::agent::agent_loop::run_agent_loop_with_hooks(
                &client,
                &mut state,
                &task,
                &hooks,
                if plan {
                    crate::ui::AgentMode::Plan
                } else {
                    crate::ui::AgentMode::Agent
                },
            )
            .await;
        }
        Some(Commands::AppServer) => {
            let server = AppServer::new(client, state);
            server.run_stdio()?;
        }
        Some(Commands::McpServer) => {
            let server = McpServer::new(client, state);
            server.run_stdio()?;
        }
        Some(Commands::Translate {
            file,
            model,
            to,
            gpu,
            out,
        }) => {
            crate::tools::pdf_translator::translate_pdf_cli(
                &file,
                &model,
                &to,
                out.as_deref(),
                &state.config.ollama_host,
                gpu.as_deref(),
            )
            .await?;
        }
        Some(Commands::Context { .. }) => unreachable!(),
        Some(Commands::Pull { .. }) => unreachable!(),
        Some(Commands::Rm { .. }) => unreachable!(),
        Some(Commands::Show { .. }) => unreachable!(),
        Some(Commands::Cp { .. }) => unreachable!(),
        Some(Commands::Ps) => unreachable!(),
        Some(Commands::Run { .. }) => unreachable!(),
        None => {
            if let Some(task) = cli.task {
                run_agent_loop(&client, &mut state, &task).await;
            } else if std::io::stdin().is_terminal() && std::io::stdout().is_terminal() {
                if cli.cloud {
                    if let Ok(_base) = client.set_provider(&cli.provider) {
                        let model = cli.cloud_model.clone().unwrap_or_else(|| DEFAULT_CLOUD_MODEL.to_string());
                        state.config.coder_model = model.clone();
                        state.config.planner_model = model.clone();
                        state.config.summarizer_model = model.clone();
                        client.mark_cloud(&model);
                    }
                }
                ui::run_ui(client, state).map_err(|e| crate::error::anyhow!(e.to_string()))?;
            } else {
                crate::error::bail!("no task or subcommand supplied; use --help for usage");
            }
        }
    }
    Ok(())
}

async fn repl(client: &LlmRouter, state: &mut AgentState) -> Result<()> {
    use std::io::Write;
    let interactive = std::io::stdin().is_terminal() && std::io::stdout().is_terminal();
    loop {
        if interactive {
            let prompt = "\n[you] ";
            print!("{}", prompt);
            std::io::stdout().flush()?;
        }
        let mut input = String::new();
        if std::io::stdin().read_line(&mut input)? == 0 {
            if interactive {
                println!();
            }
            break;
        }
        let input = input.trim();
        if input.is_empty() {
            continue;
        }

        if input.starts_with("/caveman") {
            println!("/caveman was removed — no longer supported (see TODO.md R1)");
            continue;
        }

        match input {
            "/exit" | "/quit" => break,
            "/reset" => {
                state.reset();
                println!("Session reset.");
            }
            "/help" => {
                println!("  /help        Help");
                println!("  /reset       Reset session");
                println!("  /exit        Exit");
                println!("  /check       Hardware check");
                println!("  /models      List available models");
            }
            "/check" => hw_check().await?,
            "/models" => {
                let models = model_resolver::list_models(&state.config.models_dir);
                if models.is_empty() {
                    println!("  No models found in {}", state.config.models_dir.display());
                } else {
                    println!("  Available models:");
                    for m in models {
                        println!("    {}", m);
                    }
                }
            }
            _ => run_agent_loop(client, state, input).await,
        }
    }
    Ok(())
}

/// List saved sessions and (optionally) restore one into the session context.
/// Resume/continue the most recent session for this workspace without prompting.
fn resume_session(state: &mut AgentState) -> Result<()> {
    continue_latest_session(state)
}

/// Continue/resume the most recent session for this workspace without prompting.
fn continue_latest_session(state: &mut AgentState) -> Result<()> {
    let workspace = state.config.workspace_dir.display().to_string();
    match state.long_memory.latest_session(&workspace)? {
        Some(id) => {
            let count = state.load_session_into_state(id)?;
            println!("  ✓ Resumed session {id} ({count} messages restored)");
        }
        None => {
            println!("  No previous session found for this workspace.");
        }
    }
    Ok(())
}

async fn hw_check() -> Result<()> {
    let hw = hw_recommend::detector::detect_hardware();
    hw_recommend::recommender::print_recommendations(&hw, "general");
    println!("═══ Category-specific ═══");
    for cat in &["coding", "reasoning", "chat"] {
        let recs = hw_recommend::recommender::recommend(&hw, cat);
        if let Some(top) = recs.first() {
            println!(
                "  Best for {:>10}: {:<30} ({:.1})",
                cat, top.model.name, top.score.total
            );
        }
    }
    Ok(())
}

fn build_exec_hooks(jsonl: bool, yes: bool) -> crate::agent::agent_loop::AgentHooks {
    use crate::agent::agent_loop::{AgentEvent, AgentHooks, ApprovalDecision, ApprovalRequest};
    let interrupt = Arc::new(AtomicBool::new(false));

    AgentHooks {
        on_event: Some(Arc::new(move |ev: AgentEvent| {
            if jsonl {
                let event_json = match ev {
                    AgentEvent::Status(text) => crate::json_expr!({"type": "note", "text": text}),
                    AgentEvent::ToolCall { id, name, summary } => {
                        crate::json_expr!({"type": "tool_call", "id": id, "name": name, "summary": summary})
                    }
                    AgentEvent::ToolCallDelta {
                        id,
                        index,
                        name,
                        args_delta,
                    } => {
                        crate::json_expr!({"type": "tool_call_delta", "id": id, "index": index, "name": name, "args_delta": args_delta})
                    }
                    AgentEvent::ToolResult { id, name, output, exit_code, timed_out, duration_ms } => {
                        crate::json_expr!({"type": "tool_result", "id": id, "name": name, "output": output, "exit_code": exit_code, "timed_out": timed_out, "duration_ms": duration_ms})
                    }
                    AgentEvent::PlanStep {
                        index,
                        total,
                        description,
                    } => {
                        crate::json_expr!({"type": "plan_step", "index": index, "total": total, "description": description})
                    }
                    AgentEvent::FileChanged { path } => {
                        crate::json_expr!({"type": "file_changed", "path": path})
                    }
                    AgentEvent::Verification {
                        status,
                        command,
                        summary,
                    } => {
                        crate::json_expr!({"type": "verification", "status": status, "command": command, "summary": summary})
                    }
                    AgentEvent::CompletionAudit { passed, evidence } => {
                        crate::json_expr!({"type": "completion_audit", "passed": passed, "evidence": evidence})
                    }
                    AgentEvent::Transaction { action, summary } => {
                        crate::json_expr!({"type": "transaction", "action": action, "summary": summary})
                    }
                    AgentEvent::TextDelta { text } => {
                        crate::json_expr!({"type": "text_delta", "text": text})
                    }
                    AgentEvent::TokenUsage {
                        prompt_tokens,
                        completion_tokens,
                        reasoning_tokens,
                        total_tokens,
                    } => {
                        crate::json_expr!({"type": "token_usage", "prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens, "reasoning_tokens": reasoning_tokens, "total_tokens": total_tokens})
                    }
                    AgentEvent::ReasoningDelta { text } => {
                        crate::json_expr!({"type": "reasoning_delta", "text": text})
                    }
                    AgentEvent::ResetReasoning => crate::json!({"type": "reset_reasoning"}),
                    AgentEvent::Routing { summary } => {
                        crate::json_expr!({"type": "routing", "summary": summary})
                    }
                    AgentEvent::Done { message } => {
                        crate::json_expr!({"type": "done", "message": message})
                    }
                    AgentEvent::Failed { message } => {
                        crate::json_expr!({"type": "failed", "message": message})
                    }
                    AgentEvent::Interrupted => crate::json!({"type": "interrupted"}),
                };
                println!("{}", crate::json::to_string(&event_json));
            } else {
                match ev {
                    AgentEvent::Status(text) => println!("  {}", text),
                    AgentEvent::ToolCall { name, summary, .. } => println!("  → {}: {}", name, summary),
                    AgentEvent::PlanStep {
                        index,
                        total,
                        description,
                    } => println!("  [{}/{}] {}", index, total, description),
                    AgentEvent::FileChanged { path } => println!("  Δ {}", path),
                    AgentEvent::Verification {
                        status,
                        command,
                        summary,
                    } => {
                        let cmd = command.unwrap_or_else(|| "auto-detect".into());
                        println!("  ✓ verify [{}]: {} — {}", status, cmd, summary);
                    }
                    AgentEvent::Transaction { action, summary } => {
                        println!("  ↺ transaction [{}]: {}", action, summary)
                    }
                    AgentEvent::Done { message } => {
                        if !message.trim().is_empty() {
                            println!("\n[agent] {}", message.trim());
                        }
                    }
                    AgentEvent::Failed { message } => {
                        eprintln!("\n[agent failed] {}", message.trim())
                    }
                    AgentEvent::Interrupted => eprintln!("\n[interrupted]"),
                    _ => {}
                }
            }
        })),
        on_approval: Some(Arc::new(move |req: ApprovalRequest| {
            if yes {
                println!("  [auto-approve] {} — {}", req.tool, req.summary);
                return ApprovalDecision::AllowOnce;
            }
            // Non-interactive: deny by default
            eprintln!(
                "  [denied] {} — {} (use --yes to auto-approve)",
                req.tool, req.summary
            );
            ApprovalDecision::Deny
        })),
        interrupt: Some(interrupt),
        ..Default::default()
    }
}

/// Returns the list of cloud models to benchmark, all via NVIDIA NIM.
fn get_cloud_models() -> Vec<(String, String, String, String, f64)> {
    let api_key = std::env::var("NVIDIA_API_KEY").unwrap_or_default();
    vec![
        (
            "nvidia/nvidia-nemotron-nano-9b-v2".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            40.0,
        ),
        (
            "deepseek-ai/deepseek-v4-flash".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            20.0,
        ),
        (
            "nvidia/llama-3.3-nemotron-super-49b-v1.5".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            20.0,
        ),
        (
            "minimaxai/minimax-m3".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            10.0,
        ),
        (
            "z-ai/glm-5.2".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            10.0,
        ),
        (
            "deepseek-ai/deepseek-v4-pro".into(),
            "nvidia".into(),
            api_key.clone(),
            "https://integrate.api.nvidia.com".into(),
            5.0,
        ),
    ]
}

async fn handle_providers(action: ProvidersAction) -> Result<()> {
    use providers::{print_store, test_provider, ProviderEntry, ProviderStore};
    let catalog_client = crate::async_rt::task::spawn_blocking(providers::ProviderCatalog::load)
        .await
        .map_err(|_| crate::error::message("failed to load catalog"))?;
    let catalog = &catalog_client.catalog;

    match action {
        ProvidersAction::List => {
            let mut ids: Vec<&str> = catalog.keys().map(|s| s.as_str()).collect();
            ids.sort();
            println!("\n  Available providers (from provider APIs)");
            println!("{}", "─".repeat(80));
            println!(
                "  {:<20} {:<40} {:<15}",
                "Provider ID", "API base", "Env var"
            );
            println!("{}", "─".repeat(80));
            for id in ids {
                let p = &catalog[id];
                let env = p.env.first().map(|s| s.as_str()).unwrap_or("—");
                println!("  {:<20} {:<40} {:<15}", id, p.api, env);
            }
            println!("\n  Use: rust-agent providers set <id> <api-key>");
        }
        ProvidersAction::Show => {
            let store = ProviderStore::load();
            print_store(&store, catalog);
        }
        ProvidersAction::Set {
            provider,
            api_key,
            base,
        } => {
            let key = match api_key {
                Some(k) => k,
                None => {
                    // Read from stdin without echoing
                    eprint!("  API key for '{}' (input hidden): ", provider);
                    crate::password::read_password()?
                }
            };
            if key.is_empty() {
                crate::error::bail!("API key cannot be empty");
            }
            let mut store = ProviderStore::load();
            store.set_key(&provider, &key);
            if let Some(b) = base {
                store.set_base(&provider, &b);
            }
            store.save()?;
            // Also persist into the global `~/.chronokairo/settings.json` env block
            // (Claude Code-style), so the key is available to every workspace.
            let env_name = catalog
                .get(&provider)
                .and_then(|p| p.env.first().map(|s| s.as_str()))
                .map(|s| s.to_string())
                .unwrap_or_else(|| {
                    format!("{}_API_KEY", provider.to_uppercase().replace('-', "_"))
                });
            let mut globals = config::GlobalSettings::load();
            globals.set_env(&env_name, &key);
            globals.save().ok();
            println!(
                "  ✓ API key saved for '{}' ({})",
                provider,
                ProviderStore::config_path_display()
            );
        }
        ProvidersAction::Remove { provider } => {
            let mut store = ProviderStore::load();
            store.remove(&provider);
            store.save()?;
            println!("  ✓ Removed config for '{}'", provider);
        }
        ProvidersAction::Enable { provider, enabled } => {
            let mut store = ProviderStore::load();
            store.set_enabled(&provider, enabled);
            store.save()?;
            println!(
                "  ✓ '{}' is now {}",
                provider,
                if enabled { "enabled" } else { "disabled" }
            );
        }
        ProvidersAction::Test { provider } => {
            print!("  Testing '{}' ... ", provider);
            std::io::Write::flush(&mut std::io::stdout()).ok();

            match ProviderStore::resolve_cloud_credentials(&provider, catalog) {
                Ok((base, api_key)) => {
                    let entry = ProviderEntry {
                        api_key: Some(api_key),
                        api_base: Some(base),
                        enabled: true,
                    };
                    match test_provider(&provider, &entry).await {
                        Ok(msg) => println!("✓ {msg}"),
                        Err(e) => println!("✗ {e}"),
                    }
                }
                Err(e) => println!("✗ {e}"),
            }
        }
        ProvidersAction::Import => match ProviderStore::import_from_env(catalog) {
            Ok(imported) if imported.is_empty() => {
                println!("  No new API keys found in environment.");
                println!("  Set env vars like OPENAI_API_KEY, GROQ_API_KEY, etc. before running.");
            }
            Ok(imported) => {
                println!("  ✓ Imported {} provider(s):", imported.len());
                for s in &imported {
                    println!("    • {s}");
                }
                println!("  Saved to: {}", ProviderStore::config_path_display());
            }
            Err(e) => eprintln!("  ✗ Import failed: {e}"),
        },
    }
    Ok(())
}
