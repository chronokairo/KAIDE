# ADR 0021 — Absorção e Centralização das Capacidades de IA Satélites no `ai`

- **Status:** Aceito
- **Data:** 2026-09-26
- **Decisores:** Time ChronoKairo
- **Tags:** `ai`, `rag`, `mcp`, `providers`, `llm`, `consolidação`, `regra-2`

---

## Contexto

Conforme estipulado na **Regra 2** do [AGENTS.md](file:///home/luann/.chronokairo/repos/AGENTS.md), o repositório `chronokairo/ai` (`@chronokairo/ai`) é a **fonte única de IA** do ecossistema ChronoKairo (RAG, MCP, chat, providers de LLM, agent loops e ferramentas de inteligência).

A auditoria de bounded contexts registrada no [TODO.md](file:///home/luann/.chronokairo/repos/TODO.md) apontou a existência de implementações fragmentadas de IA, chamadas diretas a provedores e ferramentas MCP espalhadas por 11 repositórios satélites:

1. **`chronokairo-projects`**: Gateways de chat e streaming (`NativeAiChatGateway`, `LocalAiSessionGateway`), registry de ferramentas de IA (`AiToolRegistry`), rotas de streaming e componente `AiChatSidebar`.
2. **`chronokairo-crm`**: Módulo `src/modules/ai-sales` contendo os sistemas `comercial` (chat assistente RAG com Ollama, agenda CIESA, extração e validação de matrícula) e `vendas` (chat com function-calling setorial).
3. **`chronokairo-bi`**: Utilitário de conexão local com Ollama (`ollama.ts`) e interface RAG de relatórios analíticos (`RelatoriosChatRAG.tsx`).
4. **`chronokairo-marketing`**: Serviços de geração de conteúdo por IA (`content-generation-service.js`, `slide-renderer.js`), sidebar `MentorIASidebar.tsx` e adapter de automação web ChatGPT.
5. **`chronokairo-legal`**: Extração de texto e OCR híbrido MuPDF/Tesseract com Ollama (`ocr.ts`, `ollama.ts`).
6. **`nimbus`**: Integrações legadas de provedores de nuvem para IA (AWS Bedrock e Google AI).
7. **`security`**: Cliente LLM multi-provedor nativo em Rust (`llm_client.rs`, `claude.rs`), servidor MCP leve para navegador (`browser-mcp-lite`), proxy LLM (`proxy.js`) e gerenciador de provedores OSINT (`provider_manager.rs`).
8. **`research`**: Camada de inferência e roteamento NVIDIA NIM do protótipo `mastery` (`gateway.rs`, `registry.rs`, `router.rs`).
9. **`chronokairo-educacional`**: Roteador inteligente de personas, provedor LLM unificado e guia interativo de anotações.
10. **`chronokairo-e-commerce`**: Servidor MCP do e-commerce (`server.js`) e módulos de PLN/parsing de intenções do bot (`nlp/`).
11. **`chronokairo-design` & `chronokairo-content`**: Chats com personas Froia e Rapunzel, já consolidados no `ai` com exportação padronizada (`./froia` e `./rapunzel`).

## Decisão

1. **Centralizar e absorver** todos os módulos, ferramentas MCP e gateways de IA satélites na pasta `tools/` e nos módulos do `chronokairo-ai`:
   - `tools/projects-ai`: Infraestrutura completa de sessões e gateways do `projects`.
   - `tools/ai-sales`: Aplicações completas de IA do CRM (`comercial` e `vendas`).
   - `tools/bi-rag`: Utilitários Ollama e views RAG do `bi`.
   - `tools/marketing-ai`: Geração de conteúdo, automações web e UI de mentoria de marketing.
   - `tools/legal-ocr`: Extratores e analisadores OCR com Ollama do `legal`.
   - `tools/cloud-ai`: Provedores Bedrock e Google AI do `nimbus`.
   - `tools/browser-mcp-lite` & `tools/security-ai`: Servidor MCP de browser e clientes de inteligência/proxy de `security`.
   - `tools/mastery-inference`: Roteador e gateway de inferência NVIDIA NIM do `mastery`.
   - `tools/educacional-ai`: Rotas de IA, personas e assistente Anna de `educacional`.
   - `tools/ecommerce-mcp` & `tools/ecommerce-nlp`: Servidor MCP e parsing NLP de `e-commerce`.
2. Registrar o status de absorção no [TODO.md](file:///home/luann/.chronokairo/repos/TODO.md) da raiz de repositórios.

---

## Consequências

- **Positivas:**
  - 100% dos ativos de inteligência artificial do ecossistema agora residem no repositório `chronokairo-ai`.
  - Facilita a reutilização de tool calling, pipelines RAG e integrações MCP entre todos os produtos.
  - Elimina divergências na configuração de chaves, tokens e modelos (NVIDIA NIM, Ollama, OpenRouter, Anthropic, Bedrock).
- **Próximos Passos:**
  - Promover gradualmente os utilitários de `tools/` para exports diretos do `@chronokairo/ai` à medida que cada produto consumidor for refatorado.
