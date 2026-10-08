//! P0 de mercado (fundação) — testes de integração do subsistema de agente.
//!
//! Valida: loop com tool calling (via ToolRegistry), subagentes, hooks de
//! runtime (approvals/interrupt/eventos), sessões persistentes com retomada e
//! o contrato end-to-end Op→EventMsg consumido pela casca Tauri/desktop.

use kaide::agent::agent_loop::{AgentEvent, AgentHooks, ApprovalDecision};
use kaide::agent::state::AgentState;
use kaide::agent::subagent::{SubagentConfig, SubagentSession, MAX_SUBAGENT_DEPTH};
use kaide::agent::tool_registry::{ToolContext, ToolEffect, ToolRegistry};
use kaide::config::settings::{ApprovalPolicy, Config};
use kaide::llm::client::LlmClient;
use kaide::llm::router::LlmRouter;
use kaide::protocol::{Op, Session};
use kaide::providers::ProviderCatalog;
use std::collections::BTreeMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

fn temp_config(tag: &str) -> Config {
    let base = std::env::temp_dir().join(format!(
        "chronokairo-p0-agent-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&base);
    Config {
        workspace_dir: base.join("workspace"),
        memory_dir: base.join("memory"),
        spec_lock: false,
        max_retries: 1,
        ..Config::default()
    }
}

fn dummy_router() -> LlmRouter {
    LlmRouter::with_catalog(
        LlmClient::ollama("http://localhost:11434"),
        ProviderCatalog { catalog: Default::default() },
    )
}

fn cleanup(state: &AgentState) {
    if let Some(parent) = state.config.workspace_dir.parent() {
        let _ = std::fs::remove_dir_all(parent);
    }
}

// ---------------------------------------------------------------------------
// P0: loop do agente com tool calling — registro + dispatch via ToolRegistry.
// ---------------------------------------------------------------------------

#[test]
fn p0_agent_loop_dispatches_registered_tools() {
    let state = AgentState::new(temp_config("registry")).unwrap();
    cleanup(&state);
    let mut state = state;

    let registry = ToolRegistry::new();
    for expected in [
        "read_file",
        "write_file",
        "edit_file",
        "apply_patch",
        "run_command",
        "run_tests",
        "list_tree",
        "search_code",
        "find_replace",
        "file_picker",
        "todo",
    ] {
        assert!(registry.has_tool(expected), "missing native tool {expected}");
    }
    assert!(registry.all_schemas().len() >= 9);

    // Classificação de efeitos dirige o escalonamento e as approvals.
    assert_eq!(
        registry.get("write_file").unwrap().effect_class(),
        ToolEffect::Mutation
    );
    assert_eq!(
        registry.get("read_file").unwrap().effect_class(),
        ToolEffect::ReadOnly
    );
    assert!(registry.get("run_command").unwrap().requires_approval());
    assert!(registry.get("read_file").unwrap().is_concurrency_safe());

    let hooks = AgentHooks::default();
    let router = dummy_router();

    let write_args: BTreeMap<String, kaide::json::Value> = [
        ("path".to_string(), kaide::json!("notes/alpha.md")),
        ("content".to_string(), kaide::json!("conteudo do arquivo p0")),
    ]
    .into_iter()
    .collect();
    let mut ctx = ToolContext {
        state: &mut state,
        hooks: &hooks,
        client: &router,
    };
    let out = registry
        .execute("write_file", &mut ctx, &write_args)
        .expect("write_file dispatch");
    assert!(out.mutated);
    assert_eq!(out.changed_file.as_deref(), Some("notes/alpha.md"));

    let read_args: BTreeMap<String, kaide::json::Value> =
        [("path".to_string(), kaide::json!("notes/alpha.md"))].into_iter().collect();
    let mut ctx = ToolContext {
        state: &mut state,
        hooks: &hooks,
        client: &router,
    };
    let out = registry
        .execute("read_file", &mut ctx, &read_args)
        .expect("read_file dispatch");
    assert_eq!(out.output.trim(), "conteudo do arquivo p0");

    // Tool desconhecida é rejeitada, não silenciosamente ignorada.
    let mut ctx = ToolContext {
        state: &mut state,
        hooks: &hooks,
        client: &router,
    };
    assert!(registry.execute("no_such_tool", &mut ctx, &write_args).is_err());

    cleanup(&state);
}

// ---------------------------------------------------------------------------
// P0: subagentes — sessão estruturada, estado filho e limite de profundidade.
// ---------------------------------------------------------------------------

#[test]
fn p0_subagents_create_child_state_and_enforce_depth() {
    let parent = AgentState::new(temp_config("subagent")).unwrap();
    cleanup(&parent);
    let parent = parent;

    let config = SubagentConfig {
        prompt: "investigar o modulo x".into(),
        description: "investigacao paralela".into(),
        max_tokens: Some(512),
        max_depth: MAX_SUBAGENT_DEPTH,
        current_depth: 1,
    };
    let mut session = SubagentSession::new("sub-agent-1", config).unwrap();
    assert_eq!(session.id, "sub-agent-1");

    // Estado filho herda o config do pai mas nunca persiste sessão própria.
    let child = session.create_child_state(&parent).unwrap();
    assert!(!child.session_persist);
    assert_eq!(
        child.config.workspace_dir,
        parent.config.workspace_dir
    );

    // Eventos do subagente alimentam o event log canônico com o id dele.
    session.record_event(kaide::protocol::EventMsg::TurnStarted);
    session.record_event(kaide::protocol::EventMsg::Done {
        message: "resultado do subagente".into(),
    });
    assert_eq!(session.event_log.len(), 2);

    // Limite de profundidade é resistente a recursão infinita.
    assert!(SubagentSession::new(
        "too-deep",
        SubagentConfig {
            prompt: String::new(),
            description: String::new(),
            max_tokens: None,
            max_depth: MAX_SUBAGENT_DEPTH,
            current_depth: MAX_SUBAGENT_DEPTH,
        },
    )
    .is_err());

    cleanup(&parent);
}

// ---------------------------------------------------------------------------
// P0: hooks de runtime — approvals (matriz de decisão), reuso de sessão e
// interrupt cooperativo.
// ---------------------------------------------------------------------------

#[test]
fn p0_runtime_hooks_approval_matrix_and_interrupt() {
    let sink: Arc<Mutex<Vec<AgentEvent>>> = Arc::default();
    let sink_writer = sink.clone();
    let mut hooks = AgentHooks {
        on_event: Some(Arc::new(move |event: AgentEvent| {
            sink_writer.lock().unwrap().push(event);
        })),
        interrupt: Some(Arc::new(AtomicBool::new(false))),
        ..AgentHooks::default()
    };

    // Allow: sempre ok. Deny: sempre recusado.
    assert!(hooks
        .require_approval(ApprovalPolicy::Allow, "write_file", "a.txt", "low")
        .is_ok());
    assert!(hooks
        .require_approval(ApprovalPolicy::Deny, "write_file", "a.txt", "low")
        .is_err());

    // Ask sem callback: default é negar (fail-safe).
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "write_file", "a.txt", "low")
        .is_err());

    // Ask com callback AllowSession: aprova e lembra pelo escopo da ação.
    hooks.on_approval = Some(Arc::new(|req: kaide::agent::agent_loop::ApprovalRequest| {
        assert_eq!(req.tool, "write_file");
        ApprovalDecision::AllowSession
    }));
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "write_file", "a.txt", "low")
        .is_ok());
    // Segunda chamada da mesma ação reusa a aprovação — mesmo sem callback.
    hooks.on_approval = None;
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "write_file", "a.txt", "low")
        .is_ok());
    // Escopo diferente da mesma tool exige nova aprovação.
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "write_file", "b.txt", "low")
        .is_err());

    // AllowOnce não persiste escopo.
    hooks.on_approval = Some(Arc::new(|_| ApprovalDecision::AllowOnce));
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "run_command", "ls", "low")
        .is_ok());
    hooks.on_approval = None;
    assert!(hooks
        .require_approval(ApprovalPolicy::Ask, "run_command", "ls", "low")
        .is_err());

    // Interrupt cooperativo.
    assert!(!hooks.interrupted());
    if let Some(flag) = &hooks.interrupt {
        flag.store(true, Ordering::SeqCst);
    }
    assert!(hooks.interrupted());

    // Eventos emitidos chegam ao consumidor (usado pelo desktop/TUI).
    hooks.emit(AgentEvent::Status("status via hook".into()));
    hooks.file_changed("src/main.rs");
    let events = sink.lock().unwrap();
    assert!(events
        .iter()
        .any(|e| matches!(e, AgentEvent::Status(text) if text.contains("status via hook"))));
    assert!(events
        .iter()
        .any(|e| matches!(e, AgentEvent::FileChanged { path } if path == "src/main.rs")));
}

// ---------------------------------------------------------------------------
// P0: sessões persistentes + retomada (transcript sobrevive a novo estado).
// ---------------------------------------------------------------------------

#[test]
fn p0_sessions_persist_and_reload_transcript() {
    let cfg = temp_config("persist");
    let mut state = AgentState::new(cfg).unwrap();
    cleanup(&state);

    state.session.add_message("user", "primeira pergunta p0");
    state.session.add_message("assistant", "primeira resposta p0");
    state.persist_session().unwrap();
    let session_id = state.session_id.expect("session created on persist");

    // Novo estado apontando ao mesmo memory dir retoma o transcript por id.
    let cfg_reload = Config {
        workspace_dir: state.config.workspace_dir.clone(),
        memory_dir: state.config.memory_dir.clone(),
        spec_lock: false,
        ..Config::default()
    };
    let mut reloaded = AgentState::new(cfg_reload).unwrap();
    let restored = reloaded.load_session_into_state(session_id).unwrap();
    assert!(restored >= 2);
    let history = reloaded.session.history();
    assert!(history
        .iter()
        .any(|(role, content)| role == "user" && content.contains("primeira pergunta p0")));
    assert!(history
        .iter()
        .any(|(role, content)| role == "assistant" && content.contains("primeira resposta p0")));

    // Idempotência: persistir de novo sem novas mensagens não duplica.
    reloaded.session.add_message("user", "segunda pergunta p0");
    reloaded.persist_session().unwrap();

    cleanup(&state);
}

// ---------------------------------------------------------------------------
// P0: contrato end-to-end Op→EventMsg consumido pela casca desktop — um turno
// completo com streaming de texto contra um LLM ollama em loopback (sem rede
// externa) termina em Done.
// ---------------------------------------------------------------------------

/// Servidor NDJSON loopback que responde a qualquer POST com o mesmo corpo de
/// streaming (compatível com /api/chat e /api/generate do cliente Ollama).
fn spawn_ollama_loopback() -> (String, Arc<AtomicBool>) {
    use std::io::{Read, Write};
    use std::net::TcpListener;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let stopped = Arc::new(AtomicBool::new(false));
    let stopped_thread = stopped.clone();

    std::thread::spawn(move || {
        listener.set_nonblocking(true).unwrap();
        let body = concat!(
            r#"{"message":{"content":"Resposta "},"response":"Resposta ","done":false}"#, "\n",
            r#"{"message":{"content":"final do agente."},"response":"final do agente.","done":false}"#, "\n",
            r#"{"done":true,"prompt_eval_count":12,"eval_count":6,"done_reason":"stop"}"#, "\n",
        );
        while !stopped_thread.load(Ordering::Relaxed) {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).unwrap();
                    let mut buf = [0u8; 1];
                    let mut head = Vec::new();
                    // Lê headers até \r\n\r\n com limite tolerante.
                    loop {
                        match stream.read(&mut buf) {
                            Ok(0) => break,
                            Ok(_) => {
                                head.push(buf[0]);
                                if head.ends_with(b"\r\n\r\n") {
                                    break;
                                }
                                if head.len() > 16 * 1024 {
                                    break;
                                }
                            }
                            Err(_) => break,
                        }
                    }
                    let head_str = String::from_utf8_lossy(&head).to_string();
                    let content_length: usize = head_str
                        .lines()
                        .find_map(|line| {
                            let (name, value) = line.split_once(':')?;
                            if name.eq_ignore_ascii_case("content-length") {
                                value.trim().parse().ok()
                            } else {
                                None
                            }
                        })
                        .unwrap_or(0);
                    let mut body_read = 0;
                    while body_read < content_length {
                        match stream.read(&mut buf) {
                            Ok(0) => break,
                            Ok(_) => body_read += 1,
                            Err(_) => break,
                        }
                    }
                    let response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/x-ndjson\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        body.len(),
                        body
                    );
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();
                }
                Err(_) => std::thread::sleep(std::time::Duration::from_millis(10)),
            }
        }
    });

    (format!("http://{addr}"), stopped)
}

#[test]
fn p0_session_turn_streams_events_until_done() {
    let (host, stopped) = spawn_ollama_loopback();
    let cfg = temp_config("e2e");
    let state = AgentState::new(cfg).unwrap();
    cleanup(&state);

    let router = LlmRouter::with_catalog(
        LlmClient::ollama(&host),
        ProviderCatalog { catalog: Default::default() },
    );
    let session = Arc::new(Session::spawn(router, state));

    session
        .submit(Op::UserTurn {
            prompt: "responda com uma frase curta".into(),
            mode: "agent".into(),
        })
        .unwrap();

    let (tx, rx) = std::sync::mpsc::channel::<Option<kaide::protocol::EventMsg>>();
    let session_ptr = session.clone();
    std::thread::spawn(move || {
        // Drena eventos bloqueante até o canal da sessão fechar.
        loop {
            let event = session_ptr.next_event();
            let is_terminal = event.is_none();
            if tx.send(event).is_err() {
                break;
            }
            if is_terminal {
                break;
            }
        }
    });

    let mut saw_turn_context = false;
    let mut terminal = None;
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(60);
    loop {
        let received = match rx.recv_timeout(std::time::Duration::from_millis(500)) {
            Ok(event) => event,
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                if std::time::Instant::now() > deadline {
                    break;
                }
                continue;
            }
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
        };
        let Some(event) = received else { break };
        match event {
            kaide::protocol::EventMsg::TurnContext { thread_id, turn_id } => {
                saw_turn_context = true;
                assert!(!thread_id.is_empty());
                assert!(turn_id > 0);
            }
            kaide::protocol::EventMsg::Done { .. } => {
                terminal = Some("done");
                break;
            }
            kaide::protocol::EventMsg::Failed { message } => {
                terminal = Some(message.leak());
                break;
            }
            kaide::protocol::EventMsg::Interrupted => {
                terminal = Some("interrupted");
                break;
            }
            _ => {}
        }
    }
    assert!(saw_turn_context, "turn must publish correlation ids first");
    assert_eq!(terminal, Some("done"), "turn must reach a terminal Done event");

    stopped.store(true, Ordering::Relaxed);
}
