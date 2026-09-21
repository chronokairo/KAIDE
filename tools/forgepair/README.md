# Forgepair

**Dois modelos, um terminal, um projeto.**

Forgepair é um orquestrador de agentes escrito em Common Lisp e sem bibliotecas
de terceiros. Dois modelos de IA de providers distintos trabalham juntos: um
**executor** faz o que o usuário pediu e um **improver** (meta-agente) observa
como o executor atende os pedidos e identifica melhorias no próprio coding agent.
Você acompanha tudo em um terminal e pode enviar observações sem interromper a conversa.

## Como funciona

1. O **executor** recebe o *prompt do usuário* e trabalha como um agente de
   coding: chama ferramentas (`shell`, `read`, `list`) em sequência, vendo o
   resultado de cada uma, até concluir a tarefa.
2. Cada ferramenta é executada dentro de um sandbox Bubblewrap.
3. O **improver** recebe o prompt do usuário e o resultado do executor.
4. O improver identifica uma melhoria concreta no coding agent (prompts, regras,
   config ou comportamento) e, se pequena e verificável, aplica no repo Forgepair.
5. O **planner** (melhor modelo do tier) valida se o executor e o improver
   fizeram trabalho real. Se um falhou, o modelo daquele papel é trocado e a
   orientação do planner é devolvida ao substituto para corrigir. A sessão roda
   continuamente até a validação passar (limitada por segurança), sem contador
   de turnos. As melhorias identificadas são resumidas no fim.

A seleção dos modelos é automática (tier Akita, veja abaixo).

## Requisitos

- Linux;
- SBCL;
- curl;
- Git;
- Bubblewrap (`bwrap`);
- credenciais de pelo menos dois providers (veja abaixo).

Em Debian ou Ubuntu:

```bash
sudo apt install sbcl curl git bubblewrap
```

## Configuração

Coloque as credenciais no arquivo `.env`. Basta ter pelo menos duas para a
seleção automática funcionar:

```dotenv
GROQ_API_KEY=...
NVIDIA_API_KEY=...
GEMINI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
```

Todos os arquivos `.env*` são ignorados pelo Git e aparecem como `/dev/null`
dentro dos terminais dos agentes.

Não há mais `--provider`/`--model`. A seleção é **automática**: Forgepair
percorre um tier curado dos melhores modelos de coding de 2026 (veja abaixo),
mantém apenas os providers cuja credencial está presente no `.env` e escolhe o
executor (melhor custo-benefício) e o improver (melhor pontuação) a partir desse
tier. Nenhum provider é pré-excluído da seleção por "distintividade".

O `config.sexp` guarda o modo da sessão:

```lisp
(:mode :pipeline)
```

Não há mais configuração de turnos: a sessão roda até o planner validar o
trabalho, dentro de limites de segurança internos.

### Tier de modelos (benchmark do Akita, 2026)

O tier é derivado do benchmark de coding do Fábio Akita
([akitaonrails/llm-coding-benchmark](https://github.com/akitaonrails/llm-coding-benchmark)),
que usa uma rubrica holística 0-100 com validação de execução real (não só
contagem de arquivos/testes). A lista foi então **filtrada aos modelos que
respondem de fato** com as credenciais presentes — modelos que o Akita pontua
alto mas que estão indisponíveis nesta conta (limite de créditos, gating por
conta) são excluídos para que o agente nunca selecione um modelo que vai falhar.

Reaudite a disponibilidade real a qualquer momento:

```bash
./bin/forgepair --verify-models
```

Esse comando faz uma chamada mínima a cada modelo candidato e imprime quais
respondem, para você atualizar o tier em `src/providers.lisp` quando quiser.

## Executando

Passe o pedido do usuário com `--prompt` (ou por stdin):

```bash
./bin/forgepair --prompt "adicione paginação ao endpoint /users"
echo "refatore o parser JSON" | ./bin/forgepair
```

Durante a execução, digite no campo `voce>` para adicionar uma observação. Ela
será entregue ao executor sem cancelar o trabalho em andamento. Use `Ctrl+C`
para encerrar.

Para acompanhar como logs simples:

```bash
./bin/forgepair --cli --prompt "..."
```

Para testar offline a execução no sandbox sem chamar providers (o mock executa
de verdade uma ferramenta, vê o resultado e conclui):

```bash
./bin/forgepair --mock --prompt "qualquer pedido"
```

Para verificar o núcleo sem requisições externas:

```bash
./bin/forgepair --self-test
```

Para listar os catálogos de providers:

```bash
./bin/forgepair --list-providers
```

## Telegram

Forgepair integra com a Bot API do Telegram via curl (zero-lib). Coloque o token
em `.env` como `TELEGRAM_BOT_TOKEN`. Para validar o token sem enviar mensagens
(chama `getMe`):

```bash
./bin/forgepair --telegram-test
```

Com o token presente, Forgepair aguarda sua mensagem no Telegram e responde ali
mesmo: o pedido, a escolha dos modelos, cada mensagem e ferramenta do executor e
do improver, o veredito do planner e o resumo final aparecem **no mesmo chat**,
como uma conversa.

## Autonomia experimental

O orquestrador não manda os agentes lerem uma lista de arquivos. Cada agente
escolhe sua própria ação a partir do prompt do usuário, do histórico, das
ferramentas que chama e das regras de segurança. Se decidir alterar algo, a
constituição exige leitura prévia e uma mudança pequena e verificável.

Depois da sessão, revise tudo:

```bash
git status
git diff
```

## Segurança

Os comandos gerados pelos modelos são executados em sandboxes Bubblewrap:

- o **executor** trabalha somente na pasta de projeto onde o `bin/forgepair` foi
  aberto (`*work-dir*`, o `pwd` na inicialização): ele lê e escreve nela, com
  `.env*` mascarados por `/dev/null` e `.git` somente leitura;
- o **improver** trabalha somente no repositório Forgepair, onde `src/`,
  `config.sexp`, `config.example.sexp`, `forgepair.asd`, `bin/` e
  `AGENTS.md` são montados somente leitura para ele não reescrever a
  própria máquina;
- ferramentas e bibliotecas do sistema somente para leitura;
- ambiente limpo, sem credenciais herdadas;
- rede desativada;
- `/tmp` e namespaces privados.

As chamadas aos provedores acontecem fora do terminal dos agentes. O modelo recebe
somente a conversa e a saída limitada dos comandos. Ainda assim, trate o projeto
como software experimental e revise as mudanças antes de aceitá-las.

## Tolerância a falhas

Endpoints gratuitos podem responder com `429` ou `503`. Forgepair tenta novamente
erros transitórios. Respostas de modelos de raciocínio que deixam `content` vazio
usam o campo `reasoning` como fallback. Texto sem uma ação JSON válida entra
apenas como mensagem e não executa comandos.

## Estrutura principal

```text
bin/forgepair             launcher
src/entrypoint.lisp       composition root, CLI e seleção automática
src/application.lisp      caso de uso da sessão executor/improver (multi-tool)
src/domain.lisp           protocolo JSON, prompts e decisões puras
src/ports.lisp            contratos dos adapters (inclui prompt-port)
src/providers.lisp        catálogo, tier Akita e auto-seleção
src/adapters.lisp         dotenv, curl, Bubblewrap, Telegram, verify-models
src/forgepair.lisp        implementação legada mantida como referência
config.sexp               modo da sessão
AGENTS.md                 constituição dos agentes (regras + executor + improver)
.env                      credenciais locais, ignoradas pelo Git
```

O núcleo segue arquitetura hexagonal: `application.lisp` depende apenas das portas
de provider, execução de comandos, saída, observação e prompt do usuário. O
`entrypoint` conecta essas portas aos adaptadores POSIX e faz a seleção automática
de modelos. O caso de uso roda com os adapters reais ou com o fluxo mock sem
alterar suas decisões.

## Princípio zero-lib

Forgepair não usa Quicklisp, bibliotecas Lisp, SDKs de provedores, pacotes Python
ou dependências npm. Common Lisp, curl e as ferramentas básicas do sistema formam
toda a plataforma de execução — inclusive a integração com Telegram.
