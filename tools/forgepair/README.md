# Forgepair

**Dois modelos, um terminal, um projeto.**

Forgepair é um orquestrador de agentes escrito em Common Lisp e sem bibliotecas
de terceiros. Dois modelos de IA de providers distintos trabalham juntos: um
**executor** faz o que o usuário pediu e um **improver** (meta-agente) observa
como o executor atende os pedidos e identifica melhorias no próprio coding agent.
Você acompanha tudo em um TUI e pode enviar observações sem interromper a conversa.

## Como funciona

1. O **executor** recebe o *prompt do usuário* e realiza a tarefa, usando no
   máximo um comando de terminal por turno.
2. O comando é executado dentro de um sandbox Bubblewrap.
3. O **improver** recebe o prompt do usuário e o resultado do executor.
4. O improver identifica uma melhoria concreta no coding agent (prompts, regras,
   config ou comportamento). Se for pequena e verificável, aplica com um comando;
   senão apenas descreve.
5. O ciclo executor/improver se repete pelo número de turnos configurado, e as
   melhorias identificadas são resumidas no fim.

O modo sempre usa dois providers distintos, escolhidos automaticamente.

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
executor e o improver a partir de **dois providers distintos**, o melhor para
cada papel.

O `config.sexp` guarda só a quantidade de turnos:

```lisp
(:mode :pipeline
 :turns 6)
```

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
será entregue no próximo turno sem cancelar o modelo que já estiver trabalhando.
Use `Ctrl+C` para encerrar.

Para acompanhar como logs simples, sem TUI:

```bash
./bin/forgepair --cli --prompt "..."
```

Use `--turns N` para sobrescrever a quantidade de turnos. Para testar offline a
execução no sandbox sem chamar providers:

```bash
./bin/forgepair --mock --turns 3 --prompt "qualquer pedido"
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

A função `telegram-send` (em `src/adapters.lisp`) envia mensagens via
`sendMessage` e pode ser usada para notificar um chat sobre a sessão.

## Autonomia experimental

O orquestrador não manda os agentes lerem uma lista de arquivos. Cada agente
escolhe sua própria ação a partir do prompt do usuário, do histórico e das regras
de segurança. Se decidir alterar algo, a constituição exige leitura prévia e uma
mudança pequena e verificável.

Depois da sessão, revise tudo:

```bash
git status
git diff
```

## Segurança

Os comandos gerados pelos modelos são executados com:

- somente este repositório gravável, **exceto** `src/`, `config.sexp`,
  `config.example.sexp`, `forgepair.asd`, `bin/` e `.forgepair/RULES.md`, que são
  montados como somente leitura para o agente não reescrever a própria máquina;
- ferramentas e bibliotecas do sistema somente para leitura;
- ambiente limpo, sem credenciais herdadas;
- todos os `.env*` mascarados por `/dev/null`;
- `.git` somente para leitura;
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
src/application.lisp      caso de uso da sessão executor/improver
src/domain.lisp           protocolo JSON, prompts e decisões puras
src/ports.lisp            contratos dos adapters (inclui prompt-port)
src/providers.lisp        catálogo, tier Akita e auto-seleção
src/adapters.lisp         dotenv, curl, Bubblewrap, Telegram, verify-models
src/forgepair.lisp        implementação legada mantida como referência
config.sexp               quantidade de turnos
.forgepair/RULES.md       constituição dos agentes (executor + improver)
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
