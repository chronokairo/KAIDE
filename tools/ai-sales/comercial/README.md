# Anna — IA de Matricula do CIESA

Anna e a assistente de IA do CIESA voltada para o time **Comercial** e para **clientes/futuros alunos**. Ela funciona como um novo "Matricule-se" via linguagem natural (NLP): o candidato conversa com a Anna e ela conduz todo o fluxo de matricula — descoberta de curso, coleta de dados, validacao e inscricao.

## Publico-alvo

- **Atendentes do Comercial**: usam a Anna como copiloto de atendimento para consultar cursos, cadastrar candidatos e acompanhar inscricoes.
- **Clientes / futuros alunos**: interagem diretamente com a Anna para se matricular sem preencher formularios tradicionais.

## O que a Anna faz

- conduz o fluxo de matricula por conversa (intencao, curso, turno, modalidade, dados pessoais);
- extrai e valida dados do candidato (CPF, e-mail, telefone, data de nascimento);
- consulta o Calendario Academico Oficial do CIESA via tool calling + RAG;
- recebe documentos (historico escolar em PDF, CSV de candidatos em lote) com roteamento automatico de intencao;
- mantem historico de conversas e fontes de conhecimento por sessao.

## Estrutura

- `src/`: runtime compartilhado da persona, contratos e roteamento (ver [src/index.md](src/index.md));
- `src/app/`: aplicacao Next.js (chat, historico, configuracoes, campus) e rotas de API;
- `src/lib/matricula/`: extracao, normalizacao e validacao do rascunho de matricula;
- `src/features/`: catalogo das capacidades arquiteturais da Anna (ver [src/features/index.md](src/features/index.md)).

## Como rodar

```bash
bun install
bun dev        # http://localhost:3000
```

A Anna usa provedores locais de LLM (Ollama em `http://localhost:11434/v1` ou LM Studio em `http://127.0.0.1:1234/v1`) selecionaveis na interface.

## Documentacao

- [AGENTS.md](AGENTS.md): indice central da documentacao estrutural;
- [CLAUDE.md](CLAUDE.md): contexto para agentes de IA que trabalham neste repositorio.
