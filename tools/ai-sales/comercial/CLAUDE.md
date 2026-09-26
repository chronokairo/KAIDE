# CLAUDE.md

Contexto para agentes de IA (Claude, Copilot etc.) trabalhando neste repositorio.

## Proposito do projeto

Este projeto e a **Anna**, a IA de matricula do CIESA. Ela substitui o fluxo tradicional "Matricule-se" por uma experiencia conversacional (NLP) e atende dois publicos:

1. **Atendentes do Comercial** — copiloto de atendimento: consulta de cursos, cadastro de candidatos, acompanhamento de inscricoes.
2. **Clientes / futuros alunos** — se matriculam conversando com a Anna, sem formularios tradicionais.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS;
- runtime: Bun (`bun install`, `bun dev`);
- LLMs locais via API compativel com OpenAI (Ollama, LM Studio) com function calling;
- Postgres (ver `src/lib/postgres.ts` e `docker-compose.yml`).

## Mapa do codigo

- `src/index.ts` / `src/contracts.ts` / `src/shared.ts`: runtime compartilhado da Anna (persona, contratos, helpers);
- `src/app/chat/`: interface principal de conversa;
- `src/app/api/chat/`: orquestracao do LLM — function calling (Estrategia 1) com fallback de RAG estrito (Estrategia 2);
- `src/app/api/matricula/`: rotas do fluxo de matricula;
- `src/lib/matricula/`: extracao (`extract.ts`), tipos (`types.ts`) e validacao (`validation.ts`) do rascunho de matricula;
- `src/lib/totvs/`: integracao TOTVS copiada do site — `config.ts` (env/auth), `rest-client.ts` (E.OFERTAS), `soap-client.ts` (cadastro de pessoa, consulta por CPF, inscricao) e `tools.ts` (tools de function calling: `consultar_cursos`, `buscar_candidato_por_cpf`, `cadastrar_candidato`, `realizar_inscricao`);
- `src/lib/calendar-rag.ts`: busca no Calendario Academico (tool `buscar_calendario`);
- `src/features/`: documentacao das capacidades arquiteturais (agent, RAG, function calling, multiagente etc.).

## Convencoes

- documentacao em portugues, sem acentos nos arquivos `index.md` (padrao do repositorio);
- cada pasta relevante tem um `index.md` descrevendo seu papel; o [AGENTS.md](AGENTS.md) e o indice central;
- tools de LLM seguem o formato OpenAI function-calling e sao executadas no servidor (`src/app/api/chat/route.ts`) — o LLM nunca recebe acesso direto a banco ou SOAP;
- validacoes de dados do candidato (CPF, e-mail, telefone) ficam em `src/lib/matricula/validation.ts` e devem ser reutilizadas pelas tools.

## Integracao com o site institucional

O repositorio irmao `/home/luan/GitHub/site` contem as APIs de inscricao do CIESA (TOTVS SOAP: cadastro de pessoa, inscricao, consulta por CPF; REST: ofertas de cursos). Essas capacidades ja foram copiadas para `src/lib/totvs/` e expostas como **tools de function calling** na rota `src/app/api/chat/route.ts`, permitindo que a Anna execute a matricula de ponta a ponta. Credenciais via `.env.local` (`TOTVS_BASE_URL`, `TOTVS_USER`, `TOTVS_PASSWORD`).
