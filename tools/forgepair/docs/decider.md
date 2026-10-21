# Validação local com decider (Jev/System One)

Forgepair pode validar o trabalho do executor com um modelo local **decider**
(família [Mapika/decider](https://huggingface.co/Mapika/decider-2b), fine-tuned
de Qwen3.5 para decisões tipadas de uma passagem só — Choice, Score, Noul) em
vez de só checar se a saída não está vazia. Isso é opcional: sem o servidor
rodando, `validate-evidence` cai de volta na heurística simples, sem travar a
sessão.

## Por quê

O decider não gera texto: ele lê um estado e uma pergunta com opções
explícitas e devolve a probabilidade calibrada de cada opção, a partir dos
logits do token de resposta. Para a pergunta "o `git diff` e o transcript
mostram trabalho real?" isso é mais barato, mais rápido e mais consistente do
que pedir pra um LLM remoto narrar um veredito (o modo antigo do planner,
removido no ADR-0009) — e roda inteiramente na sua máquina.

## Escolha de modelo (GTX 1650 / T1000, 4 GB)

| Arquivo | Tamanho | Recomendação |
| --- | --- | --- |
| `decider-2b-v11-Q8_0.gguf` | 2,0 GB | **Use este.** O model card reporta qualidade estatisticamente igual ao BF16. |
| `decider-2b-v11-Q4_K_M.gguf` | 1,3 GB | Só se precisar do GB extra de VRAM pro LLM principal. |
| `decider-0.8b` (GGUF) | ~1,4 GB BF16 | Fallback mais leve se a VRAM estiver disputada com outro modelo local. |

Fonte: [Mapika/decider-2b-GGUF](https://huggingface.co/Mapika/decider-2b-GGUF).

## Subindo o servidor

```bash
llama-server -hf Mapika/decider-2b-GGUF:Q8_0 --port 8080 -ngl 0
```

**Use `-ngl 0`.** O decider roda em CPU de propósito. O model card reporta
0,12–0,31 s por request de 40–120 tokens em 8 threads, e o decider só é chamado
uma vez por tentativa de validação — latência invisível na cadência de uma
sessão. Em troca a VRAM fica inteira para o LLM principal, que é onde ela
resolve. Sem `-ngl 0`, os 2,0 GB do decider disputam com o LLM de coding numa
placa de 4 GB e nenhum dos dois cabe.

Por padrão Forgepair aponta para `http://127.0.0.1:8080/completion`. Para usar
outra porta/host, exporte `DECIDER_URL` (ou coloque no `.env`, como as outras
credenciais):

```dotenv
DECIDER_URL=http://127.0.0.1:8081/completion
```

## Verificando manualmente

```bash
curl -s http://127.0.0.1:8080/completion \
  -H "Content-Type: application/json" \
  --data-binary '{"prompt":"Context:\nteste\n\nQuestion: funciona?\nOptions:\n(A) sim\n(B) nao\nAnswer: (","n_predict":1,"n_probs":8,"temperature":0.0}'
```

O campo que `decider-candidate-prob` (`src/adapters.lisp`) lê é
`completion_probabilities[0].probs`, uma lista de candidatos com o token
(`tok_str`, ou `token`/`text` em outras builds) e sua probabilidade (`prob`,
ou `probability`). Se `decide` sempre voltar vazio contra um servidor que você
confirmou estar de pé, rode o curl acima, veja os nomes reais dos campos na
sua build do llama.cpp e ajuste `decider-candidate-prob`.

## O que o decider valida hoje

Uma única pergunta Noul em `verify-conformance` (`src/application.lisp`): se a
mudança de código **atende o pedido congelado** — o texto do usuário, fixado
antes de qualquer edição — e não faz trabalho não pedido nem reverte trabalho
anterior. O estado que ele lê tem o pedido em primeiro lugar, seguido da
mensagem do executor, a cauda do transcript, o `git diff --stat` e a saída da
verificação.

O decider **não escreve código**, e não é judge do texto do executor: ele julga
o diff contra uma spec que existia antes do patch. Não decide qual modelo
remoto usar (isso seria roteamento — fora de escopo pela regra 10 do
`AGENTS.md`).

## O decider é metade do gate

Desde o ADR-0011 a conformidade tem duas fontes e **ambas precisam concordar**:

| Fonte | O que é | Peso |
| --- | --- | --- |
| `:verify-command` | o build/teste do próprio repo, exit code | fonte de evidência independente |
| decider local | o diff contra o pedido congelado | conformidade com a spec |

Um build verde não é o mesmo que pedido atendido: o decider pode reprovar um
comando que passou, e o comando reprova mesmo sem decider. O comando de
verificação vem do repositório ou do `config.sexp`, nunca do modelo.

Configure no `config.sexp`:

```lisp
(:verify-command "make test")
```

Vazio (`""`) desliga o gate mecânico e deixa a conformidade só no decider.

### Onde isso não alcança

O gate mecânico cobre o que tem comando. Se o pedido pedir algo não
expressível como comando ("este nome é melhor"), não existe verificação
automática disso — e o decider não fecha a lacuna: 2B com ECE 0,038 em
Noul/Choice curtos não lê semântica de diff grande com confiança utilizável.
Nesses casos a sessão reporta a confiança e o humano decide.
