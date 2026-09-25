# Análise Comparativa: Athena vs. Apps de RAG do Mercado

> Pesquisa realizada em 08/06/2026

---

## Apps de RAG do Mercado

| App | Stars | Destaque Principal |
|---|---|---|
| **Open WebUI** | 141k | RAG completo, 9 vector DBs, multi-modal, voz, RBAC, LDAP |
| **AnythingLLM** | 61k | Multi-usuário, 30+ LLM providers, agentes, browser extension |
| **LobeHub** | 78k | Agent teams, memória persistente, MCP, agendamento de tarefas |
| **Flowise** | 53k | Visual no-code agent builder, pipelines visuais |

---

## O Que Falta no Athena

### 🔴 Gaps Críticos para Qualidade do RAG

| Feature | Mercado | Athena |
|---|---|---|
| **Busca híbrida** (BM25 + vector) | ✅ padrão | ❌ só vector |
| **Reranking** dos chunks recuperados | ✅ (Cross-Encoder, Cohere) | ❌ |
| **Avaliação de respostas** (thumbs up/down, RAGAS) | ✅ | ❌ |
| **Ingestão de documentos** via UI (PDF, DOCX, TXT) | ✅ | ❌ só TOTVS API |
| **Gerenciamento de context window** (truncation/summary) | ✅ | ❌ |
| **Troca de modelo na UI** | ✅ | ❌ hard-coded `gemma3:1b` |
| **Web search** como fonte RAG | ✅ Open WebUI: 15+ providers | ❌ |

### 🟡 Gaps de Produto

| Feature | Mercado | Athena |
|---|---|---|
| **Multi-usuário + RBAC** | ✅ AnythingLLM, Open WebUI | ❌ single-user |
| **Upload de arquivos no chat** | ✅ | ❌ |
| **Multi-modal** (imagens no contexto) | ✅ AnythingLLM, LobeHub | ❌ OCR parcial |
| **Voz** (STT/TTS) | ✅ Open WebUI: Whisper + ElevenLabs | ❌ |
| **Prompt templates editáveis na UI** | ✅ | ❌ fixo no código |
| **Preview das fontes** com highlight do trecho | ✅ | ❌ só badge com link |
| **Múltiplos workspaces / knowledge bases** | ✅ | ❌ |
| **Tarefas agendadas** (cron) | ✅ AnythingLLM, LobeHub | ❌ |

### 🟢 Gaps de Infraestrutura

| Feature | Mercado | Athena |
|---|---|---|
| **Docker Compose pronto** | ✅ todos | ❌ |
| **OpenTelemetry / Prometheus** | ✅ Open WebUI | ❌ |
| **API docs (Swagger/OpenAPI)** | ✅ Flowise | ❌ |
| **Testes automatizados** | ✅ todos | ❌ |
| **Multi-provider LLM** | ✅ AnythingLLM: 30+, Open WebUI | ❌ só Ollama |
| **Horizontal scaling** (Redis sessions) | ✅ Open WebUI | ❌ single-instance |

---

## Prioridade Recomendada

Dado o foco em **domínio educacional TOTVS** (nicho específico), as melhorias com maior ROI são:

### Alta Prioridade
1. **Busca híbrida + reranking** — melhora diretamente a qualidade das respostas
2. **Feedback de respostas** (thumbs up/down) — gera dados para medir e iterar
3. **Ingestão de documentos** (PDF/DOCX) — expande base de conhecimento além das APIs

### Média Prioridade
4. **Troca de modelo na UI** — desbloqueia modelos mais capazes sem redeploy
5. **Docker Compose** — facilita deploy em produção e onboarding
6. **Prompt templates editáveis** — permite ajuste sem código

### Baixa Prioridade
7. **Multi-usuário + RBAC** — necessário ao escalar para mais atendentes
8. **Voz (STT/TTS)** — diferencial UX, mas não essencial para o caso de uso
9. **Web search** — útil para informações fora do escopo TOTVS

---

## Vantagens Competitivas do Athena

O Athena tem diferenciais que os apps genéricos não possuem:

- **Integração nativa TOTVS** — APIs de ofertas, grade curricular, atendentes, etc.
- **Privacidade total** — 100% local via Ollama, sem dados para nuvem
- **MCP server** — integração com AI assistants (Claude Desktop, etc.)
- **Domínio educacional** — prompts e contexto otimizados para o setor
- **KPI dashboard** — visualizações específicas do negócio acadêmico
