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
3. O trabalho do executor é validado por **evidência real**: `git diff` no
   diretório do projeto e a cauda do transcript de ferramentas (que carrega os
   marcadores `[exit N]` de cada comando), não por um modelo narrando um
   veredito. Se um **decider local** estiver configurado (opcional — veja
   [Validação local (decider)](#validação-local-decider) abaixo), ele responde
   uma pergunta tipada sim/não em cima dessa evidência; sem ele, a sessão cai
   de volta numa checagem simples. Em falha, o executor recebe o feedback e
   tenta de novo, até 3 tentativas.

> Nota: versões anteriores deste README descreviam um terceiro papel
> (**planner**, validando por narrativa) e seleção automática entre um tier de
> modelos. Isso foi removido (ver `docs/adr/0009-remove-commodity-features-stay-radical.md`):
> é roteamento/validação por narrativa, que o projeto considera commodity —
> fora do escopo do que é único em Forgepair.

## Requisitos

- Linux;
- SBCL;
- curl;
- Git;
- Bubblewrap (`bwrap`);
- credenciais de pelo menos um provider (veja abaixo);
- opcional: `llama-server` (llama.cpp) local, para validação por decider.

Em Debian ou Ubuntu:

```bash
sudo apt install sbcl curl git bubblewrap
```

## Configuração

Coloque as credenciais no arquivo `.env`:

```dotenv
OPENROUTER_API_KEY=...
TELEGRAM_BOT_TOKEN=...
DECIDER_URL=http://127.0.0.1:8080/completion
```

Todos os arquivos `.env*` são ignorados pelo Git e aparecem como `/dev/null`
dentro dos terminais dos agentes.

O provider do executor vem de `config.sexp` (copie `config.example.sexp`):

```lisp
(:provider (:name "openrouter"
            :url "https://openrouter.ai/api/v1/chat/completions"
            :key-env "OPENROUTER_API_KEY"
            :model "deepseek/deepseek-v4.1-flash"
            :label "DeepSeek V4.1 Flash"))
```

Não há mais configuração de turnos: a sessão roda até a evidência validar,
dentro de limites de segurança internos (até 3 tentativas do executor).

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

## Telegram

Forgepair integra com a Bot API do Telegram via curl (zero-lib). Coloque o token
em `.env` como `TELEGRAM_BOT_TOKEN`. Para validar o token sem enviar mensagens
(chama `getMe`):

```bash
./bin/forgepair --telegram-test
```

Com o token presente, Forgepair aguarda sua mensagem no Telegram e responde ali
mesmo: o pedido, cada mensagem e ferramenta do executor e o veredito da
validação aparecem **no mesmo chat**, como uma conversa.

## Validação local (decider)

Além da checagem de evidência padrão, Forgepair pode consultar um modelo
**decider** local (família [Mapika/decider](https://huggingface.co/Mapika/decider-2b),
fine-tuned de Qwen3.5 para decisões tipadas de uma passagem só) para responder,
com probabilidade calibrada, se o `git diff` e o transcript mostram trabalho
real. É opcional e silencioso: sem `llama-server` respondendo em `DECIDER_URL`
(padrão `http://127.0.0.1:8080/completion`), a sessão usa a checagem simples de
sempre.

```bash
llama-server -hf Mapika/decider-2b-GGUF:Q8_0 --port 8080
```

Detalhes de escolha de modelo (recomendado: `decider-2b` Q8_0, 2 GB, para GPUs
de 4 GB) e como depurar o formato de resposta do seu `llama.cpp`:
`docs/decider.md`. Racional da decisão: `docs/adr/0010-local-decider-evidence-validation.md`.

## Autonomia experimental

O orquestrador não manda o agente ler uma lista de arquivos. O executor
escolhe sua própria ação a partir do prompt do usuário, do histórico, das
ferramentas que chama e das regras de segurança.

Depois da sessão, revise tudo:

```bash
git status
git diff
```

## Segurança

Os comandos gerados pelo modelo são executados em sandbox Bubblewrap:

- o **executor** trabalha somente na pasta de projeto onde o `bin/forgepair` foi
  aberto (`*work-dir*`, o `pwd` na inicialização): ele lê e escreve nela, com
  `.env*` mascarados por `/dev/null` e `.git` somente leitura;
- ferramentas e bibliotecas do sistema somente para leitura;
- ambiente limpo, sem credenciais herdadas;
- rede desativada dentro do sandbox do executor (o decider e os providers são
  chamados de fora do sandbox, como descrito acima);
- `/tmp` e namespaces privados.

As chamadas aos provedores e ao decider acontecem fora do terminal do agente. O
modelo recebe somente a conversa e a saída limitada dos comandos. Ainda assim,
trate o projeto como software experimental e revise as mudanças antes de aceitá-las.

## Tolerância a falhas

Endpoints gratuitos podem responder com `429` ou `503`. Forgepair tenta novamente
erros transitórios. Respostas de modelos de raciocínio que deixam `content` vazio
usam o campo `reasoning` como fallback. Texto sem uma ação JSON válida entra
apenas como mensagem e não executa comandos. O decider local nunca aborta a
sessão: qualquer falha (servidor fora do ar, resposta inesperada) faz
`validate-evidence` cair de volta na checagem simples.

## Estrutura principal

```text
bin/forgepair             launcher
src/entrypoint.lisp       composition root, CLI e wiring dos adapters
src/application.lisp      caso de uso da sessão executor + validação por evidência
src/domain.lisp           protocolo JSON, prompts e decisões puras
src/ports.lisp            contratos dos adapters (inclui decider-port)
src/providers.lisp        provider do executor e URL do decider local
src/adapters.lisp         dotenv, curl, Bubblewrap, Telegram, decider local
src/forgepair.lisp        implementação legada mantida como referência
config.sexp               provider do executor
AGENTS.md                 constituição do agente (regras + executor)
docs/decider.md           validação local por decider: escolha de modelo e setup
docs/adr/                 decisões de arquitetura (ADR-0001 a 0010)
.env                      credenciais locais, ignoradas pelo Git
```

O núcleo segue arquitetura hexagonal: `application.lisp` depende apenas das portas
de provider, decider, execução de comandos, saída, observação e prompt do
usuário. O `entrypoint` conecta essas portas aos adaptadores POSIX. O caso de
uso roda com os adapters reais ou com o fluxo mock sem alterar suas decisões.

## Princípio zero-lib

Forgepair não usa Quicklisp, bibliotecas Lisp, SDKs de provedores, pacotes Python
ou dependências npm. Common Lisp, curl e as ferramentas básicas do sistema formam
toda a plataforma de execução — inclusive a integração com Telegram e com o
decider local (um processo `llama-server` externo, alcançado por `curl`, como
qualquer outro provider).
