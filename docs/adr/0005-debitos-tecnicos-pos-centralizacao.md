# ADR-0005 — Débitos técnicos pós-centralização

**Status:** Aceito (débitos abertos)
**Data:** 2026-09-23

## Contexto

O `ai` consolidou `cli`, `desktop` e a IA do ecossistema (rotas de proxy/chat,
`NvidiaAiSidebar`, `AIInsightsWidget` movidos do platform em 2026-09-23). A
centralização expôs débitos herdados dos monorepos de origem e das ilhas
recebidas.

## Decisão

Registrar e priorizar os débitos técnicos:

1. **LLM providers desacoplados** (extends ADR-0002): re-adicionar os 17
   providers sem `kairos/plugin-sdk` (padrão validado no piloto `groq` via shim
   `_sdk/`); providers pesados (google, github-copilot, ollama, deepinfra)
   exigem reimplementar runtime de image/video/speech/oauth/embeddings atrás de
   portas.
2. **Backend RAG**: `src/server/rag` (Express) portar para Next API routes e
   incluir no typecheck.
3. **UI**: shell/navegação e tokens herdados migrar para
   `@chronokairo/platform/ui`; não duplicar componentes locais (porta visual +
   promoção ao platform quando genérico).
4. **Wiring Tauri**: `src-tauri/shell` conectar comandos ao núcleo `ckc`
   (zero-lib), incremental.
5. **Rotas de IA recém-recebidas** (`src/app/api/ai/*`, credenciais NVIDIA):
   cobertura de testes de integração e validação de auth/CORS nos caminhos
   públicos.

## Consequências

- Typecheck e testes verdes com o RAG no barramento padrão do Next.
- Providers voltam a ser adicionáveis sem publicar o `plugin-sdk`.
- UI do produto 100% no design system da plataforma.