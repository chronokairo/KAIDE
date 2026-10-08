# Telas legadas do agent kairos (fork de vendas/crm)

Telas extraídas do fork `laciels` (kairos-code, fork do Claude Code) antes do
descarte do fork em `chronokairo/crm` (2026-09-23).

Material de referência/port — **não estão wired** e não compilam fora do runtime
do fork (dependem de `bun:bundle`, Ink TUI próprio (`ink.js`), `bootstrap/state`
e `react/compiler-runtime`):

- `REPL.tsx` (4807 ln) — chat/terminal principal do agent (modelo p/ a UI de
  chat do ai em Next).
- `Doctor.tsx` (574 ln) — diagnóstico/health do agent (modelo p/ `/health` do
  agent e diagnósticos de integrações).
- `ResumeConversation.tsx` (398 ln) — retomada de sessões/conversas.

## Débito

- Portar o design de interação (chat, transcript, keybindings, busca) para a UI
  Next de chat do ai (`apps/web/src/modules/ai`), completando a reimplementação que já
  tem núcleo Rust (crate `kaide`/binário `ck` do repo `chronokairo/cli`).
- Não reintroduzir código derivado de Anthropic/Claude Code: reescrever do zero
  (regra AGENTS #8).
- O fork original permanece no histórico do crm (`legacy/merged/sales/laciels`).