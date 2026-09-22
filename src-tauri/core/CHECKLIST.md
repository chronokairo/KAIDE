# ChronoKairo Coder v1.0 — Release Checklist

> Diferença entre "componentes existem" e "o goal é cumprido em uso real".
> Esta checklist mede o segundo, não o primeiro.

---

## 0. Princípio

V1 está pronto quando o loop `plan → act → verify` fecha **de ponta a ponta numa tarefa real**, sem intervenção humana no meio, em hardware-alvo.

- [x] Unitários/integrados (339+) ainda passam após qualquer mudança
- [x] Nenhuma regressão de isolamento de ambiente
- [x] CLI responde em todos os subcomandos (`exec`, `tui`, `repl`, `serve`, `bench`, ...)

---

## 1. E2E Acceptance — Suíte de Tarefas Reais

Rodar **5–10 repos pequenos/reais** via `chronokairo exec`, sem tocar no meio.

### Banco de tarefas (mínimo 5)

- [x] Corrigir um bug existente num repo real (T1 — fix em `add`)
- [x] Adicionar uma rota/API nova (T2 — `multiply` e `test_multiply`)
- [x] Adicionar validação (input/form) preservando contratos (T3 — `divide` com `Result` e erro de divisão por zero)
- [x] Refatorar uma função preservando comportamento (T4 — refatoração de `divide` para `match b`)
- [x] Criar testes para código existente (T2/T3/T5/T6)
- [x] Implementar feature atravessando 3–5 arquivos (T6 — `transfer` em `src/storage.rs`, `src/service.rs` e `tests/integration_test.rs`)
- [x] Receber implementação que quebra teste e se autocorrigir (T5 — `power` com `base.pow(exp)`)
- [ ] (extra) Migrar dependência preservando API pública
- [ ] (extra) Aplicar patch de segurança documentado
- [ ] (extra) Atualizar docs junto com mudança de código

### Critérios medidos por tarefa

| Critério | Obrigatório? | Validado |
|---|---|:---:|
| Entendeu e planejou sem destruir escopo | sim | [x] |
| Produziu patch válido (aplicável, compila) | sim | [x] |
| Build/test/lint final passou | sim quando aplicável | [x] |
| Detectou falha e tentou corrigir | sim | [x] |
| Rollback funcionou em falha | sim | [x] |
| Não escreveu fora do workspace | sim | [x] |
| Rodou 100% local (sem chamadas externas) | sim | [x] |
| Terminou no hardware-alvo 16 GB RAM / 4 GB VRAM | sim | [x] |
| Terminou **sem intervenção humana** | medir taxa | [x] (100% autônomo) |

### Métrica central

> **Task Completion Rate = tarefas corretamente concluídas / tarefas executadas**

- [x] **TCR ≥ 80%** na suíte definida (gate de release: **100% alcançado — 5/5**)
- [x] TCR medido e registrado em `bench/results/e2e-20260823.md`

---

## 2. Observabilidade do Loop (medir, não estimar)

Para cada uma das tarefas acima, registrar:

- [x] **1. Concluiu com diff aplicável e correto?** (Sim — 5/5)
- [x] **2. Precisou de correção manual minha no meio?** (Não — 0 intervenções)
- [x] **3. Entrou em loop de repair sem convergir?** (Não — convergiu em ≤ 2 iterações de repair)
- [x] **4. Pico de VRAM medido** na tarefa mais pesada (< 3.6 GB)
- [x] **5. Pico de RAM medido** durante a execução (< 4.2 GB)
- [x] **6. Tempo total de execução** (~15s–35s por tarefa)
- [x] **7. Nº de chamadas de inferência** realizadas (5 a 17 por tarefa)
- [x] **8. Tamanho do contexto no pior momento** (< 5.5k tokens, dentro do budget de 4 GB)

### Critério de "V1 de verdade"

- [x] **≥ 3 de 5** tarefas passam limpo (5 de 5 passaram limpo)
- [x] Nenhuma tarefa entra em loop infinito de repair (watchdog e max_iterations ativos)
- [x] Nenhuma tarefa violou isolamento de filesystem/shell

---

## 3. Stress do Budget de Contexto (4 GB VRAM)

339 testes unitários rodando em ~1.12s **não** testam isto. Tarefas reais, sim.

- [x] Tarefa de refactor termina sem OOM
- [x] Compactação de contexto é exercitada de verdade (`maybe_compact` ativo)
- [x] Modelo cabe no budget com contexto cheio (< 3.6 GB VRAM)
- [x] Rollback de compressão não corrompe estado

---

## 4. Self-Correction Loop

- [x] Receber patch propositalmente ruim → agent detecta falha de verify (T5)
- [x] Agent tenta corrigir (não devolve tarefa ao humano) (T5)
- [x] Converge em ≤ N iterações (convergiu em 2 iterações)
- [x] Não entra em loop infinito (watchdog/timeout ativo)
- [x] Rollback é acionado quando N é estourado

---

## 5. Feature Freeze (NÃO fazer antes de v1.0.0)

Tudo abaixo está **congelado** até v1.0.0 sair.

- [x] **Não** adicionar memória longa / persistente cross-session
- [x] **Não** adicionar RAG complexo (vector store, embeddings próprios)
- [x] **Não** adicionar mais interfaces (TUI extra, GUI, etc.)
- [x] **Não** adicionar mais providers
- [x] **Não** adicionar multi-agent sofisticado (sub-orchestrators, debates)
- [x] **Não** adicionar IDE extension (LSP/VSCode/JetBrains)
- [x] **Não** adicionar GitHub automation (PR bot, review bot)
- [x] **Não** adicionar web search / browsing
- [x] **Não** adicionar mais linguagens além das já suportadas
- [x] **Não** adicionar novos backends de inferência

> Se uma feature acima parece "óbvia", ela continua congelada. v1.0.0 primeiro.

---

## 6. Dogfooding

Antes de declarar v1.0.0, usar o próprio Coder em:

- [x] 1 tarefa real no próprio `chronokairo-coder` (correção em `model_resolver` e parsing de JSON em tool calls)
- [x] 1 tarefa real em repositório de teste E2E (bateria T1–T5)
- [x] Registrar resultado no mesmo formato da seção 2 (`bench/results/e2e-20260823.md`)

---

## 7. Safety

- [x] Nenhuma falha crítica de filesystem safety em toda a suíte E2E
- [x] Nenhuma falha crítica de shell safety em toda a suíte E2E
- [x] Sandbox/path-containment comprovado por teste adversarial
- [x] Rollback deixa o repo no estado exato anterior (verificado por `git status` limpo ou hash idêntico)

---

## 8. Definition of Done (copiar para `GOAL.md`)

> **ChronoKairo Coder v1 is complete when it can autonomously inspect, plan, modify, and verify a real software repository using only local compute, producing a validated patch or safely rolling back when it cannot complete the task.**

---

## 9. Release Gate

```
339+ unit/integration tests passing
        +
E2E benchmark suite passing  (TCR >= 80%, >=3/5 tarefas limpas)
        +
Runs on target 16 GB RAM / 4 GB VRAM machine  (medido, não estimado)
        +
No critical filesystem/shell safety failure
        +
Documentation + install path completos
        ↓
     v1.0.0
```

- [x] **Gate 1** — `cargo test` (ou equivalente) verde, 339+ testes
- [x] **Gate 2** — Suíte E2E rodada, TCR ≥ 80% registrado em arquivo (`bench/results/e2e-20260823.md`)
- [x] **Gate 3** — Execução documentada em hardware 16 GB RAM / 4 GB VRAM
- [x] **Gate 4** — Zero falha crítica de safety reportada
- [x] **Gate 5** — `README.md` + `INSTALL.md` (ou seção) cobrindo install path
- [ ] **Tag** — `git tag -a v1.0.0 -m "..."` e push

---

## 10. Pós-v1.0.0 (NÃO escopo deste checklist)

Apenas referência. Tudo aqui é **próximo componente** ou **v1.1+**:

- Memória longa
- RAG
- Multi-agent
- IDE extension
- Mais providers/linguagens
- Web search
- Próximo componente da org

---

## Estado atual

- [x] Componentes do loop existem no código
- [x] 339+ testes unitários/integrados passando
- [x] Isolamento de ambiente corrigido
- [x] CLI responde nos subcomandos
- [x] **Single-file E2E 100% autônomo em SLM 1.5B local** (T1–T4 passam 100% com `cargo test` verde e `keep` transacional)
- [x] **Segurança transacional & Rollback comprovados** (Rollback determinístico e limpo em 100% dos cenários de falha nos modelos de 1.5B, 3B e 4B)
- [x] **Pico de VRAM medido fisicamente com `nvidia-smi`** (GTX 1650 4GB: 2091 MiB no 1.5B, 2335 MiB no 3B, 2295 MiB no 4B — 100% local, zero tráfego de rede)
- [x] **v0.9.1 Structural Repository Awareness (`RepoMap`) implementado e validado** (Hipótese H1 suportada: eliminou 100% das alucinações de módulos em 1.5B e 3B)
- [x] **v0.9.2 Guided Decomposition & Diagnostic-Constrained Repair implementado e validado** (Diagnósticos estruturados transformaram erros do rustc em restrições operacionais)
- [x] **v0.9.3 Symbol-Grounded Editing & Pre-Mutation Semantic Guard implementado e validado** (Extração de campos e tipos no RepoMap + `SemanticGuard` interceptando métodos inexistentes antes da escrita no disco)
- [ ] **E2E multi-arquivo autônomo em SLM local ≤3B** (SLM 3B progrediu até a camada de tipos primitivos `u64` vs `f64`)
- [ ] **v1.0.0 taggeado** (Classificado como **v0.9.3** até a conclusão do benchmark multi-arquivo local)
