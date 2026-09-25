# cki-lite — escopo fechado

> Tiny zero-dependency NVIDIA NIM terminal agent for Unix.

Este arquivo define o limite do projeto. O `lite` é uma restrição arquitetural,
não apenas uma versão reduzida de outro coding agent.

As decisões correspondentes a cada entrega estão registradas em [ADR.md](ADR.md).

## Contrato permanente

- Um único script Python executável (`cki-lite.py`).
- Somente Python standard library; nenhuma dependência externa.
- NVIDIA NIM via endpoints OpenAI-compatible (`/models` e `/chat/completions`).
- Providers OpenAI-compatible opcionais: Ollama, OpenRouter, Groq e Gemini.
- `/bin/sh` como a única ferramenta do agente: Unix is the tool API.
- Compatível com Alpine, SSH, containers mínimos e ambientes de recuperação.
- Menos de 1.000 linhas no script principal.
- Sem múltiplos backends, MCP, browser, editor estruturado ou framework de agente.

## Entregas do projeto

### Segurança mínima

- [x] Classificar comandos em leitura, mutação e destruição.
- [x] Executar automaticamente apenas comandos reconhecidos como somente leitura.
- [x] Pedir confirmação para mutações e negar por padrão em entrada não interativa.
- [x] Exigir confirmação textual forte para comandos destrutivos.
- [x] Documentar claramente os limites: isto não é sandbox nem isolamento de privilégios.

### Experiência do terminal

- [x] Adicionar streaming de respostas do NIM.
- [x] Implementar truncamento inteligente de stdout/stderr.
- [x] Aplicar limite explícito ao tamanho do histórico/contexto.
- [x] Adicionar `--prompt` para execução não interativa.
- [x] Definir exit code zero para sucesso e não-zero quando nenhum modelo conclui a tarefa.
- [x] Adicionar `--version`.
- [x] Oferecer instalação simples em `~/.local/bin`.
- [x] Listar sessões recentes e selecionar por número com `--resume` ou `--session`.
- [x] Alternar provider/modelo dentro do chat preservando o histórico.
- [x] Formatar Markdown, tabelas e LaTeX comum quando o terminal suporta UTF-8/ANSI.
- [x] Exibir o nome do modelo ativo no lugar do rótulo fixo `NIM`.

### Modelos

- [x] Descobrir e cachear o catálogo NVIDIA.
- [x] Permitir shortlist local de modelos.
- [x] Fazer fallback automático preservando o histórico.
- [x] Incorporar benchmark local opcional.
- [x] Ordenar modelos por resultado do benchmark e disponibilidade.

### Qualidade

- [x] Criar testes unitários mínimos para classificação, confirmação, cache e fallback.
- [x] Fornecer teste reproduzível em ambiente Unix mínimo/Alpine (`test-alpine.sh`).
- [x] Manter documentação de instalação, segurança e comandos suportados.
- [x] Verificar por inspeção de imports que o script continua sem dependências externas.

## Fora de escopo

- Ferramentas separadas como `read_file`, `write_file`, `grep`, `git` ou `browser`.
- Edição estruturada de arquivos, indexação completa de projeto ou sistema de planos.
- Backend Anthropic, Ollama, OpenAI genérico ou abstração multi-provider.
- Sandbox complexo, containerização automática, policy engine ou ACL própria.
- Interface TUI rica, servidor web, plugins e telemetria.
- Tornar o projeto um clone de Claude Code, Codex CLI ou outro agente completo.

## Critério de conclusão

O projeto está concluído quando as entregas acima estiverem implementadas e
verificadas sem quebrar o contrato permanente. Novas ideias devem ser avaliadas
contra este escopo antes de entrarem no código.
