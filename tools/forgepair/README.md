# Forgepair

**Dois modelos, um terminal, um projeto.**

Forgepair é um orquestrador de agentes escrito em Common Lisp e sem bibliotecas
de terceiros. Dois modelos de IA de providers distintos trabalham juntos: um
**executor** faz o que o usuário pediu e um **decider** (meta-agente) decide se
o resultado responde ao pedido. Você acompanha tudo em um terminal e pode
enviar observações sem interromper a conversa.

## Por que dois modelos, e não um

A escolha não é estética, e a pesquisa de 2026 sustenta cada cláusula. As
fontes e os números estão em [`docs/research/two-models-2026.md`](docs/research/two-models-2026.md).

| Decisão | Evidência |
| --- | --- |
| O decider **não** pode ser o executor | Em veredictos binários sobre rubricas objetivas, um juiz marca como satisfeitas rubricas que o próprio gerador falhou **>50% mais vezes** do que as de outro modelo (arXiv:2604.06996). O viés *cresce* a cada iteração de auto-refino (ACL 2024, "Pride and Prejudice") — que é exatamente o loop de 3 tentativas. |
| O comando determinístico vem **primeiro** | Verificação de processo por regras supera verificação só de resultado em 6,5% de F1 (ACL 2026 findings, VPRMs). Verificar é a metade barata: 75 chamadas de busca para resolver contra 18 para verificar (arXiv:2510.06135). |
| O decider é um **veto**, não o árbitro | Capacidade do verificador satura em problemas fáceis, é linear nos médios e **limitada por limiar nos difíceis** (arXiv:2509.17995). E erros de geradores fortes são mais difíceis de detectar. |
| Confiança não é probabilidade | Vies de estilo domina o de posição (0,76–0,92 contra ≤0,04) e proxies de confiança por token vêm frequentemente descalibrados (arXiv:2604.23178). |
| Julgar contra rubrica, não narrativa | Um verificador de reward baseado em rubrica supera juiz-LLM e agente-como-juiz em **12–48% de F1** (ACL 2026 findings, DeepVerifier). |

O que a pesquisa **não** justifica, e que por isso não existe aqui: roteamento
de modelos, catálogo de providers, troca programada de modelo, nem um segundo
provider pago no slot do decider. Verificar o porquê em `docs/research/two-models-2026.md`.

## Como funciona

1. O **executor** recebe o *prompt do usuário* e trabalha como um agente de
   coding: chama ferramentas (`shell`, `read`, `list`) em sequência, vendo o
   resultado de cada uma, até concluir a tarefa.
2. Cada ferramenta é executada dentro de um sandbox Bubblewrap.
3. O trabalho é validado por **duas fontes de evidência independentes**, e ambas
   precisam concordar:
   - o **comando de verificação do próprio repositório** (`:verify-command`) —
     é a evidência primária, a única que nenhum modelo pode argumentar. Forgepair
     não tem default: sem `:verify-command` no `config.sexp` do projeto, não há
     gate, e a sessão termina sem anunciar sucesso;
   - um **decider local** que julga o diff contra o **pedido congelado** antes de
     qualquer edição, não contra a narrativa do executor.

   Um build verde não é o mesmo que pedido atendido: o decider reprova um
   comando que passou, e o comando reprova mesmo sem decider. Falha fechada:
   saída sem marcador `[exit N]`, ausência de evidência, ou silêncio do decider
   **não** aprovam. Em falha, o executor recebe a razão e a saída do comando que
   quebrou, e tenta de novo (até 3 tentativas). Racional:
   `docs/adr/0011-evidence-gated-conformance.md`.

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
  :verify-command "make test")
```

`:verify-command` é o gate primário e **não tem default**: cada projeto declara o
seu. É a evidência que nenhum modelo pode argumentar, e é por isso que o Forgepair
não a inventa para você. Sem ela, não existe gate mecânico e a sessão só pode
terminar sem anunciar sucesso.

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

Metade da validação é um modelo **decider** local (família
[Mapika/decider](https://huggingface.co/Mapika/decider-2b), fine-tuned de
Qwen3.5 para decisões tipadas de uma passagem só). Ele responde com
probabilidade calibrada se a mudança **atende o pedido congelado** — o texto do
pedido é fixado antes de qualquer edição, então o julgamento é contra uma spec
que já existia quando o patch foi escrito. Ele não escreve código e não lê a
narrativa do executor. É opcional e silencioso: sem `llama-server` respondendo em
`DECIDER_URL` (padrão `http://127.0.0.1:8080/completion`), só o comando de
verificação decide.

**O decider é um veto, não o árbitro.** Isso não é modéstia de documentação: a
pesquisa de 2026 mostra que um verificador pequeno **satura** em problemas fáceis
e fica **limitado por limiar** nos difíceis (arXiv:2509.17995), e que erros de
geradores fortes são justamente os mais difíceis de pegar. O mesmo vale para a
confiança: o número que o decider devolve **não é uma probabilidade calibrada**,
e o projeto não o apresenta como tal. Um verificador de 2B fica mais fraco
relativamente conforme o executor melhora — é um teto arquitetural, não um
problema de ajuste. Detalhes: `docs/research/two-models-2026.md`.

```bash
llama-server -hf Mapika/decider-2b-GGUF:Q8_0 --port 8080 -ngl 0
```

`-ngl 0` mantém o decider na CPU de propósito (0,12–0,31 s por request em 8
threads, uma vez por tentativa) e deixa a VRAM inteira para o LLM principal —
numa placa de 4 GB os 2 GB do decider disputariam com ele.

Detalhes de escolha de modelo e como depurar o formato de resposta do seu
`llama.cpp`: `docs/decider.md`. Racional:
`docs/adr/0010-local-decider-evidence-validation.md` e
`docs/adr/0011-evidence-gated-conformance.md`.

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
apenas como mensagem e não executa comandos.

O decider local nunca aborta a sessão, mas também nunca a aprova sozinho: se o
`llama-server` estiver fora do ar ou responder de forma inesperada, a nota
registra isso e **o comando de verificação decide sozinho**. Não existe mais
fallback para "houve saída, logo passou" — saída não vazia sem exit code
observável é reprovação. Ver `docs/adr/0011-evidence-gated-conformance.md`.

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
scripts/                  diagnósticos: reader, lint e balanceadores de parênteses
config.sexp               provider do executor e :verify-command
AGENTS.md                 constituição do agente (regras + executor)
docs/decider.md           validação local por decider: escolha de modelo e setup
docs/research/            pesquisa que decide a forma dos dois modelos
docs/adr/                 decisões de arquitetura (ADR-0001 a 0011)
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
