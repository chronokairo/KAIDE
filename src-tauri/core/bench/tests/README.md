# H-Battery Fixtures (v0.9.5 Acceptance)

Bateria de regressão **fixa e versionada** para as tarefas multi-arquivo H1–H3.
Cada diretório é um mini-projeto Cargo autônomo com:

| Item | Papel |
|------|-------|
| `src/` | Código baseline (estado inicial do repo-tarefa) |
| `tests/baseline_test.rs` | Comportamento que já funciona hoje (regressão) |
| `tests/acceptance_test.rs` | **Teste de aceitação fixo** — trava a API exigida pela tarefa. Faz parte da especificação; o agente NÃO pode modificá-lo |
| `TASK.md` | Prompt verbatim passado ao agente via `chronokairo exec` |

## Estado RED intencional

No estado baseline os fixtures **não compilam os testes de aceitação** de propósito
(`E0433` variante inexistente / `E0061` aridade / `E0599` método inexistente).
Esse é o oráculo: a tarefa só está correta quando `cargo test` fica 100% verde
sem tocar em `tests/`.

## Protocolo

1. Copiar o fixture para um workspace temporário (`robocopy` — nunca construir in-place).
2. Rodar `chronokairo exec "<conteúdo de TASK.md>" --yes --dir <cópia> --model <modelo>`.
3. Classificar:
   - **PASS** — `cargo test` verde na cópia + nenhum arquivo em `tests/` modificado.
   - **DRIFT-BLOCKED** — o gate v0.9.5 rejeitou drift de assinatura antes da escrita.
   - **FAIL(rollback)** — transação revertida com segurança.
4. Registrar em `bench/results/` com modelo, iterações de repair e telemetria.

## Runner

```powershell
pwsh bench/run_hbattery.ps1 -Model qwen2.5-coder:3b
```
