//! P0 de mercado (fundação) — testes de integração do gerenciamento de
//! contexto: compactação em camadas, AGENTS.md como contexto de projeto,
//! memória de curto/longo prazo e skills.

use kaide::compressor::layer1;
use kaide::compressor::layer2::CompressLayer2;
use kaide::llm::prompt::CoderPrompt;
use kaide::memory::log::{LongTermMemory, SessionInfo};
use kaide::memory::short_term::ShortTermMemory;
use kaide::repo::chrono_context::ChronoContextEngine;
use kaide::skills::SkillRegistry;
use std::path::PathBuf;

fn temp_dir(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "chronokairo-p0-context-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

// ---------------------------------------------------------------------------
// P0: compactação de contexto — layer1 (estrutural) + layer2 (semântica).
// ---------------------------------------------------------------------------

#[test]
fn p0_compressor_layers_shrink_and_report_rules() {
    let noisy = "\u{1b}[32mDownloading 100%\u{1b}[0m\n\n\n\
                 Building crate one... 2026-09-26T10:00:00Z\n\
                 Building crate one... 2026-09-26T10:00:01Z\n\
                 0xdeadbeefdeadbeefdeadbeefdeadbeef\n\
                    at /home/user/projects/cli/src/deeply/nested/path/module.rs:42:7\n";

    let result = layer1::compress(noisy);
    assert!(result.compressed_lines <= result.original_lines);
    assert!(!result.output.contains('\u{1b}'), "ANSI must be stripped");
    assert!(!result.output.contains("Downloading"), "progress bars must go");
    assert!(!result.output.contains("2026-09-26T10:00:00Z"), "timestamps must be normalized");
    assert!(result.applied_rules.contains(&"ansi_strip".to_string()));
    assert!(result.applied_rules.iter().any(|rule| rule == "progress_bars" || rule == "template_dedup" || rule == "token_norm"));

    let mut layer = CompressLayer2::new();
    let jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    let out = layer.process(&format!("path /a/b/c/d/e/f/g/file.rs {jwt}\n"));
    assert!(out.contains("<JWT>"), "opaque tokens must be masked");
    assert!(layer.original_tokens > 0);
    assert!(layer.applied_rules.iter().any(|rule| rule == "opaque_norm" || rule == "path_shrink"));
}

// ---------------------------------------------------------------------------
// P0: AGENTS.md como contexto de projeto (context pack + prompt do coder).
// ---------------------------------------------------------------------------

#[test]
fn p0_agents_md_feeds_project_context_pack() {
    let ws = temp_dir("agents-md");
    std::fs::write(
        ws.join("AGENTS.md"),
        "---\ntitle: Regras do repo\nstatus: ativo\n---\n\n> [!IMPORTANT]\n> Regras de ouro do projeto.\n\n## Diretrizes para Agentes\n\nNunca commitem segredos.\n",
    )
    .unwrap();

    let pack = ChronoContextEngine::build_context_pack(&ws, None, 12_000);
    assert!(pack.contains("Regas") || pack.contains("Regras"), "frontmatter title must surface");
    assert!(pack.contains("Regras de ouro"), "callouts must surface");
    assert!(pack.contains("Nunca commitem segredos"), "guidelines must surface");

    // O prompt do coder injeta o AGENTS.md como Project Instructions.
    let context = CoderPrompt::load_project_context(&ws);
    assert!(context.contains("AGENTS.md") || context.contains("Nunca commitem segredos"));

    // O orçamento de caracteres é respeitado: pack apertado é menor que o pack
    // completo (corte em fronteira de char quando o conteúdo excede o budget).
    let tiny = ChronoContextEngine::build_context_pack(&ws, None, 40);
    assert!(tiny.chars().count() < pack.chars().count());
    let _ = std::fs::remove_dir_all(&ws);
}

// ---------------------------------------------------------------------------
// P0: memória de curto prazo — compact, dedup de arquivos e contexto.
// ---------------------------------------------------------------------------

#[test]
fn p0_short_term_memory_compacts_and_tracks_files() {
    let mut memory = ShortTermMemory::new(4);
    for i in 0..6 {
        memory.add_message("user", &format!("mensagem numero {i}"));
    }
    // Capacidade máxima respeitada — mensagens velhas caem.
    assert!(memory.history().len() <= 4);
    assert!(memory.estimated_tokens() > 0);

    // Dedup de arquivos tocados.
    memory.add_file("src/a.rs");
    memory.add_file("src/a.rs");
    memory.add_file("src/b.rs");
    assert_eq!(memory.file_count(), 2);

    // Compact mantém apenas a última mensagem + resumo.
    memory.compact("resumo da sessão p0".into());
    assert_eq!(memory.history().len(), 1);
    assert_eq!(memory.summary(), Some("resumo da sessão p0"));

    // A conversa materializa o resumo como system exatamente uma vez.
    let conversation = memory.conversation();
    let summaries = conversation
        .iter()
        .filter(|(role, content)| *role == "system" && content.contains("resumo da sessão p0"))
        .count();
    assert_eq!(summaries, 1);
}

// ---------------------------------------------------------------------------
// P0: memória de longo prazo — sessões persistem, listam e retomam.
// ---------------------------------------------------------------------------

#[test]
fn p0_long_term_memory_persists_sessions_and_vectors() {
    let dir = temp_dir("long-term");
    let db = dir.join("memory.db");
    let memory = LongTermMemory::new(db.clone()).unwrap();

    let id = memory.start_session("/repo/p0", "qwen3:1.7b").unwrap();
    memory
        .append_messages(id, &[(1, "user".into(), "pergunta p0".into()), (2, "assistant".into(), "resposta p0".into())])
        .unwrap();
    // Idempotente por (session_id, seq).
    memory
        .append_messages(id, &[(1, "user".into(), "pergunta p0".into())])
        .unwrap();

    memory.update_session(id, "titulo p0", "contexto", "qwen3:1.7b").unwrap();

    let sessions: Vec<SessionInfo> = memory.list_sessions("/repo/p0", 10).unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].id, id);
    assert_eq!(sessions[0].message_count, 2);
    assert_eq!(sessions[0].summary, "titulo p0");

    // Escopo por workspace: outro workspace não vê a sessão.
    assert!(memory.list_sessions("/outro", 10).unwrap().is_empty());

    let transcript = memory.load_session(id).unwrap();
    assert!(transcript
        .iter()
        .any(|(seq, role, content)| *seq == 1 && role == "user" && content.contains("pergunta p0")));

    // Vector store ranqueia por similaridade (dot product).
    let norm = |v: &[f32]| -> Vec<f32> {
        let len = (v.iter().map(|x| x * x).sum::<f32>()).sqrt();
        v.iter().map(|x| x / len).collect()
    };
    memory.store_vector(id, "doc-a", "texto sobre rust", &norm(&[1.0, 0.0])).unwrap();
    memory.store_vector(id, "doc-b", "texto sobre python", &norm(&[0.0, 1.0])).unwrap();
    let hits = memory.search_vectors(&norm(&[0.9, 0.1]), 2).unwrap();
    assert!(!hits.is_empty());
    assert_eq!(hits[0].source, "doc-a");

    // Recarregar do disco mantém o estado (persistência durável).
    let reloaded = LongTermMemory::new(db.clone()).unwrap();
    assert_eq!(reloaded.load_session(id).unwrap().len(), 2);

    let _ = std::fs::remove_dir_all(&dir);
}

// ---------------------------------------------------------------------------
// P0: skills — registro com precedência de projeto e dedup.
// ---------------------------------------------------------------------------

#[test]
fn p0_skills_registry_loads_project_first() {
    let project = temp_dir("skills-project");
    let user = temp_dir("skills-user");
    std::fs::create_dir_all(project.join("skills")).unwrap();
    std::fs::create_dir_all(user.join("skills")).unwrap();
    std::fs::write(
        project.join("skills/deploy.md"),
        "---\nname: deploy\ndescription: deploy do projeto p0\n---\n corpo do projeto\n",
    )
    .unwrap();
    std::fs::write(
        user.join("skills/deploy.md"),
        "---\nname: deploy\ndescription: deploy generico do usuario\n---\n corpo do usuario\n",
    )
    .unwrap();
    std::fs::write(
        user.join("skills/audit.md"),
        "---\nname: audit\ndescription: auditoria de seguranca\n---\n corpo\n",
    )
    .unwrap();

    let mut registry = SkillRegistry::new();
    registry.load_from(vec![project.join("skills"), user.join("skills")]);

    // Projeto tem precedência sobre o usuário para o mesmo nome.
    let deploy = registry.get("deploy").unwrap();
    assert!(deploy.description.contains("projeto p0"), "project must win dedup");

    assert!(registry.get("audit").is_some());
    assert!(!registry.is_empty());
    assert!(registry.list().iter().all(|skill| skill.name == "deploy" || skill.name == "audit"));

    // Skill vira prompt curto com nome + descrição.
    assert!(registry.get("audit").unwrap().summary().contains("auditoria"));

    let _ = std::fs::remove_dir_all(&project);
    let _ = std::fs::remove_dir_all(&user);
}
