# cki-lite — Architecture Decision Log

Este log registra as decisões que fecham o escopo definido em `TODO.md`.
Todas as decisões abaixo estão aceitas e devem ser reavaliadas antes de ampliar
o projeto.

## ADR-001 — Guardrails por risco de comando

- **Decisão:** classificar comandos como `read`, `mutate` ou `destroy`.
- **Motivo:** reduzir execuções acidentais sem introduzir uma sandbox pesada.
- **Consequência:** comandos desconhecidos pedem confirmação; a proteção não é
  isolamento de privilégios.

## ADR-002 — Leitura automática

- **Decisão:** executar automaticamente apenas comandos reconhecidos como
  somente leitura.
- **Motivo:** preservar a fluidez do agente Unix.
- **Consequência:** a lista é conservadora e pode pedir confirmação em casos
  legítimos não reconhecidos.

## ADR-003 — Confirmação de mutações

- **Decisão:** mutações exigem confirmação interativa `y/N` e são bloqueadas sem
  terminal interativo.
- **Motivo:** evitar que prompts não interativos alterem o host sem aprovação.
- **Consequência:** automações mutáveis precisam de uma integração futura
  explícita, caso entrem no escopo.

## ADR-004 — Confirmação forte de destruição

- **Decisão:** comandos destrutivos exigem digitar `yes, I understand`.
- **Motivo:** diferenciar operações de alto impacto de mutações comuns.
- **Consequência:** não há garantia contra comandos destrutivos desconhecidos;
  o classificador continua heurístico.

## ADR-005 — Um único shell como ferramenta

- **Decisão:** manter `/bin/sh` como a única ferramenta do modelo.
- **Motivo:** Unix já fornece `cat`, `sed`, `grep`, `find`, `git` e similares.
- **Consequência:** não serão adicionadas ferramentas artificiais por arquivo ou
  domínio.

## ADR-006 — Streaming SSE

- **Decisão:** consumir respostas `stream=true` do endpoint de chat via SSE,
  acumulando texto e tool calls.
- **Motivo:** reduzir a latência percebida sem SDK externo.
- **Consequência:** providers precisam implementar o formato OpenAI-compatible;
  respostas não compatíveis falham normalmente e entram no fallback.

## ADR-007 — Limite de saída

- **Decisão:** limitar stdout e stderr a 12.000 caracteres, preservando início e
  fim e informando o trecho omitido.
- **Motivo:** impedir que uma ferramenta domine o contexto e o terminal.
- **Consequência:** saídas gigantes não são mantidas integralmente na sessão.

## ADR-008 — Limite de histórico

- **Decisão:** limitar o histórico serializado a 60.000 caracteres, removendo as
  mensagens mais antigas.
- **Motivo:** manter requisições previsíveis em máquinas e providers mínimos.
- **Consequência:** sessões longas perdem contexto antigo deliberadamente.

## ADR-009 — Execução one-shot

- **Decisão:** oferecer `--prompt` para uma tarefa e encerramento automático.
- **Motivo:** permitir uso em SSH, scripts e recuperação de sistemas.
- **Consequência:** confirmações de mutação continuam bloqueadas sem TTY.

## ADR-010 — Exit codes mínimos

- **Decisão:** retornar zero em sucesso e não-zero quando nenhum modelo conclui
  a tarefa.
- **Motivo:** tornar o agente componível em scripts sem inventar uma taxonomia
  extensa de erros.
- **Consequência:** detalhes continuam disponíveis no stderr/trace e na sessão.

## ADR-011 — Identidade versionada

- **Decisão:** expor `--version` com versão mantida no próprio script.
- **Motivo:** facilitar diagnóstico em instalações single-file.
- **Consequência:** a versão não depende de pacote ou metadata externa.

## ADR-012 — Instalação Unix direta

- **Decisão:** `--install` copia o script para `~/.local/bin/cki-lite` e aplica
  permissão executável.
- **Motivo:** instalação compatível com Alpine e ambientes sem gerenciador.
- **Consequência:** atualização é uma nova cópia do arquivo; não há instalador
  ou daemon.

## ADR-013 — Descoberta e cache de modelos

- **Decisão:** consultar `/models` e cachear o catálogo sob `~/.cki-lite/cache`.
- **Motivo:** reduzir latência e chamadas repetidas.
- **Consequência:** `--refresh-models` é necessário quando o catálogo muda.

## ADR-014 — Shortlist local

- **Decisão:** aceitar `selected.json` como shortlist e ordem local de modelos.
- **Motivo:** permitir seleção medida pelo usuário sem banco de dados ou serviço.
- **Consequência:** modelos fora do catálogo atual são descartados.

## ADR-015 — Fallback com histórico preservado

- **Decisão:** tentar outro modelo visível quando o atual falha, mantendo o
  histórico da tarefa.
- **Motivo:** tratar modelos como recursos fungíveis.
- **Consequência:** uma tarefa pode trocar de modelo no meio do loop.

## ADR-016 — Benchmark opcional

- **Decisão:** `--benchmark-models` mede uma chamada curta por modelo e grava a
  ordem de latência em `selected.json`.
- **Motivo:** transformar disponibilidade e latência em dados locais simples.
- **Consequência:** o benchmark mede resposta básica, não qualidade geral nem
  segurança do modelo.

## ADR-017 — Providers OpenAI-compatible

- **Decisão:** suportar NVIDIA NIM, Ollama, OpenRouter, Groq e Gemini por
  `--provider`, usando endpoints compatíveis e variáveis de ambiente próprias.
- **Motivo:** ampliar utilidade mantendo uma única implementação HTTP stdlib.
- **Consequência:** NVIDIA continua padrão; recursos específicos de cada API
  ficam fora do escopo.

## ADR-018 — Testes unitários stdlib

- **Decisão:** usar `unittest` em `test_cki_lite.py`, sem pytest ou dependências.
- **Motivo:** testar o núcleo em qualquer Python mínimo.
- **Consequência:** testes de rede usam mocks futuros, não credenciais reais.

## ADR-019 — Teste reproduzível em Alpine

- **Decisão:** fornecer `test-alpine.sh` executando a suíte com `python3`.
- **Motivo:** preservar a promessa de portabilidade Unix.
- **Consequência:** a execução exige uma imagem/host Alpine com Python instalado;
  o script não instala dependências.

## ADR-020 — Documentação operacional

- **Decisão:** manter instalação, providers, segurança e comandos no README, e
  decisões arquiteturais neste arquivo.
- **Motivo:** tornar o single-file utilizável sem contexto externo.
- **Consequência:** mudanças de escopo devem atualizar README, TODO e ADR log.

## ADR-021 — Zero dependências externas

- **Decisão:** limitar runtime e testes à Python standard library.
- **Motivo:** Alpine, SSH, recovery environments e máquinas antigas são cenários
  de primeira classe.
- **Consequência:** HTTP, parsing, CLI, streaming e persistência permanecem
  implementações locais pequenas.

## ADR-022 — Retomada por seleção de sessão

- **Decisão:** `--resume` e `--session` sem ID listam as dez sessões mais
  recentes com data, modelo e último pedido; `--session ID` permanece disponível.
- **Motivo:** IDs internos não são uma interface humana adequada para retomar
  conversas.
- **Consequência:** seleção por menu exige terminal interativo; automações podem
  continuar usando o ID explícito.

## ADR-023 — Troca de provider e modelo no chat

- **Decisão:** oferecer `/model`, `/models` e `/provider`, preservando o histórico
  e salvando imediatamente a nova seleção na sessão.
- **Motivo:** trocar de modelo é uma operação frequente e não justifica uma TUI.
- **Consequência:** trocar provider consulta seu catálogo e pode solicitar a chave.

## ADR-024 — Renderer adaptativo

- **Decisão:** `--renderer auto` usa Markdown/LaTeX ANSI em TTY UTF-8 e plain com
  streaming em pipes ou terminais limitados; `/renderer` permite troca dinâmica.
- **Motivo:** oferecer saída legível sem dependência ou interface de tela inteira.
- **Consequência:** formatação exige acumular a resposta; plain mantém streaming.

## ADR-025 — Identidade visual do modelo

- **Decisão:** rotular cada resposta com o nome do modelo ativo.
- **Motivo:** fallback e troca dinâmica tornam o rótulo fixo `NIM` ambíguo.
- **Consequência:** o usuário vê imediatamente qual modelo produziu cada resposta.
