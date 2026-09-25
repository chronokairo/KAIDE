# Clamp

> **Make small models behave.**
>
> Reliability layer for small language models.

`Clamp` is part of [Anamnesic](https://github.com/anamnesic). It is a
tool-calling harness for local LLMs that **keeps small models inside the
contract** — schema, tools and specification.

---

## O problema

Ferramentas como Claude Code, GitHub Copilot e opencode são otimizadas para
**modelos cloud** (Claude 3.5, GPT-4o) — modelos que seguem instruções e fazem
tool calling confiável.

Quando você usa **modelos locais** (Llama, Qwen, Mistral, Nemotron via
Ollama/LM Studio/vLLM), essas ferramentas não funcionam bem. Os modelos locais:

- Produzem JSON malformado nos tool calls
- Não respeitam schemas de parâmetros
- Se perdem em tarefas multi-step
- Têm context windows menores
- Seguem instruções de forma inconsistente

**Nenhuma ferramenta existente resolve isso.** O mercado de "local LLM agent
harness" tem 10 projetos no GitHub, nenhum com adoção real.

---

## O que o Clamp faz

> model wants freedom → Clamp keeps execution inside the contract.

```text
SLM
 │
 ▼
Clamp
 │
 ├── schema
 ├── spec lock
 ├── JSON repair
 ├── tool validation
 ├── retry
 ├── verification
 └── rollback
```

Clamp é um agente CLI que **compensa as fraquezas de modelos locais** com um
harness de tool calling elaborado:

- **Schema enforcement** — valida todo input de tool com Zod antes de executar
- **Tool call repair** — corrige JSON malformado automaticamente (aspas, chaves, escaping)
- **Multi-step orchestration** — o SDK orquestra turns automaticamente, executando tools e alimentando resultados de volta
- **Context management** — (planejado) compaction e priorização para janelas pequenas
- **Multi-pass verification** — (planejado) modelos locais são grátis, então pode-se rodar verificações extras sem custo

---

## Status

O harness foi reconstruído a partir dos módulos extraídos do histórico do git e
passa em `tsc --noEmit`. A inferência ponta-a-ponta foi validada contra Ollama
local com `gemma4:e2b`: chamadas `list` e `read` foram executadas no workspace
real. O parser aceita blocos de tools com texto de planejamento e fechamento
implícito no fim da resposta, variações emitidas por esse modelo.

Compatível com qualquer endpoint OpenAI-compatible:
- **Ollama**, **LM Studio**, **vLLM**, **SGLang**

Tools disponíveis: `read`, `write`, `bash`, `list`, `edit`, `glob`, `grep`, `web_fetch`

```bash
# checar tipos
bun run typecheck   # ou: npx tsc --noEmit
```

---

## Quick start

```bash
# Dependências
bun install

# LM Studio (já com modelo carregado)
CLAMP_BASE_URL=http://localhost:1234/v1 \
CLAMP_MODEL=nvidia/nemotron-3-nano-4b \
bun src/cli.ts "list files in this directory"

# Ollama
CLAMP_BASE_URL=http://localhost:11434/v1 \
CLAMP_MODEL=qwen2.5-coder:14b \
bun src/cli.ts

# vLLM / SGLang
CLAMP_BASE_URL=http://localhost:8000/v1 \
CLAMP_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct \
bun src/cli.ts "explain the architecture of this project"
```

---

## Configuração

| Variável | Default | Descrição |
|---|---|---|
| `CLAMP_BASE_URL` | `http://localhost:11434/v1` | URL do servidor (Ollama, LM Studio, vLLM, SGLang) |
| `CLAMP_MODEL` | `qwen2.5-coder:14b` | ID do modelo no servidor |
| `CLAMP_API_KEY` | (none) | API key se o servidor exigir |

Flags: `--model <name>`, `--base-url <url>`

---

## Estrutura

```
clamp/
├── src/
│   ├── cli.ts              # Entry point + REPL interativo (query única ou sessão)
│   ├── harness.ts          # Core: orquestra loop LLM → parse → tools → resultado de volta
│   ├── registry.ts         # Tool registry + Zod validation + JSON repair
│   ├── providers/
│   │   └── local.ts        # Conector OpenAI-compatible (Ollama, LM Studio, vLLM, SGLang)
│   ├── tools/
│   │   └── builtin.ts      # read, write, bash, list, edit, glob, grep, web_fetch
│   └── lib/
│       ├── balanced-json.ts        # Extrai JSON balanceado de saída ruidosa
│       ├── plain-text-tool-calls.ts# Parser de tool calls em texto puro (SLMs)
│       ├── tool-call-args.ts       # Repair de argumentos (preserve/repaired + HTML decode)
│       ├── apply-patch.ts          # Engine de edição por hunks (extraído p/ tool `edit`)
│       └── glob-pattern.ts         # Matcher de glob (extraído p/ tool `glob`)
├── package.json            # ai (Vercel AI SDK) + zod
└── tsconfig.json
```

> **Provenance:** `balanced-json.ts` e `plain-text-tool-calls.ts` foram extraídos
> e adaptados de código maduro encontrado no histórico do git deste repositório
> (runtime de agente "Kairos"), e `tool-call-args.ts` adapta a lógica de repair
> de argumentos da mesma origem — o custo de reescrever esse tipo de parser
> robusto é alto, então reaproveitamos o que já estava testado em produção.

---

## Roadmap

### Pronto (implementado neste repo)
- [x] CLI com query única e REPL
- [x] Conector OpenAI-compatible (Ollama, LM Studio, vLLM, SGLang)
- [x] Tools: read, write, bash, list, edit, glob, grep, web_fetch
- [x] Tool call repair (JSON malformado) — extraído do histórico do git
- [x] Plain-text tool call parsing para SLMs — extraído do histórico do git
- [x] Edição por hunks (`edit`) — extraído do histórico do git
- [x] Glob matching (`glob`) — extraído do histórico do git
- [x] Schema enforcement com Zod (valida antes de executar)
- [x] Loop multi-step automático (executa tools e alimenta resultados de volta)

### Próximo
- [ ] **Planner externo** — divide tarefas em steps (LLM não planeja sozinho)
- [ ] **Tool Router** — filtra tools por intenção (reduz erros em modelos 4B)
- [ ] **Context Cache** — envia só arquivos relevantes (economiza tokens)
- [ ] Validator — verifica resultado de cada step antes de continuar
- [ ] Model-adaptive prompting (ajustar strategy por modelo)
- [ ] Context window management (compaction para janelas pequenas)
- [ ] web_search com provedor configurável (Firecrawl, etc.)

### Futuro
- [ ] MCP client (conectar servidores MCP)
- [ ] Checkpointing (salvar/resumir sessões)
- [ ] Frontend app (Next.js)
- [ ] Plugin system
