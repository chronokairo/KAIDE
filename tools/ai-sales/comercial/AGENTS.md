# AGENTS

Este repositorio contem a base da IA Anna, a assistente de matricula do CIESA. O projeto e voltado para **atendentes do Comercial** (copiloto de atendimento) e para **clientes/futuros alunos** (matricula conversacional via NLP, substituindo o "Matricule-se" tradicional).

Este arquivo centraliza a navegacao da documentacao por pasta. Cada diretorio relevante possui um `index.md` descrevendo seu papel no projeto.

## Visao Geral

- [README.md](README.md): apresentacao do projeto, publico-alvo e como rodar.
- [CLAUDE.md](CLAUDE.md): contexto para agentes de IA que trabalham neste repositorio.
- [index.md](index.md): visao geral da Anna e da estrutura principal do repositorio.
- [src/index.md](src/index.md): papel da pasta `src` como base de desenvolvimento.
- [src/features/index.md](src/features/index.md): catalogo das capacidades arquiteturais da Anna.

## Features

- [src/features/agent/index.md](src/features/agent/index.md): uso da Anna como agente autonomo.
- [src/features/atendimento-ao-cliente/index.md](src/features/atendimento-ao-cliente/index.md): aplicacao da Anna em atendimento.
- [src/features/function-calling/index.md](src/features/function-calling/index.md): chamadas de ferramentas externas.
- [src/features/hibrida/index.md](src/features/hibrida/index.md): combinacao de memoria, RAG, tools e workflow.
- [src/features/mcp/index.md](src/features/mcp/index.md): integracoes via Model Context Protocol.
- [src/features/memoria-persistente/index.md](src/features/memoria-persistente/index.md): continuidade de contexto entre sessoes.
- [src/features/multiagente/index.md](src/features/multiagente/index.md): cooperacao entre agentes especializados.
- [src/features/orquestrador-de-ferramentas/index.md](src/features/orquestrador-de-ferramentas/index.md): execucao encadeada de ferramentas.
- [src/features/rag/index.md](src/features/rag/index.md): recuperacao de conhecimento institucional.
- [src/features/workflow-deterministico/index.md](src/features/workflow-deterministico/index.md): fluxos previsiveis e controlados.

## Diretrizes

- mantenha este arquivo como indice central da documentacao estrutural;
- use os `index.md` das pastas para explicar responsabilidade, escopo e objetivo;
- evite criar novos `AGENTS.md` fora da raiz, salvo mudanca explicita de padrao.