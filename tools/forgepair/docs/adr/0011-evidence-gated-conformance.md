# ADR-0011: Evidência Mecânica + Spec Congelada no lugar de "Houve Mudança?"

## Status

Aceito (substitui a validação de `validate-evidence` do ADR-0010).

## Contexto

O ADR-0010 trocou o veredito narrativo do planner por um decider local, mas a
pergunta que esse decider respondia era errada. Ela era:

> "O diff e o transcript mostram trabalho real: mudanças de codigo nao vazias,
> nao apenas leitura, e nao revertidas?"

Isso é **atividade**, não **conformidade**. Um executor que roda `ls`, le um
arquivo e escreve um comentário satisfaz a pergunta com confidence alta: diff
nao-vazio, transcript nao-vazio. O `run-session` aceitava, e a sessao Printava
`Concluido.` — sem o pedido estar cumprido. Pior: o feedback de retry era uma
frase generica ("A execucao nao produziu resultado valido"), que nao diz o que
falhou, entao as 3 tentativas gastavam tokens para repetir a mesma cegueira.

Duas perguntas ficaram em aberto nesta conversa, ambas respondidas pela
literatura de 2026:

1. **Vale usar varios providers simultaneos para augmenter confiabilidade?**
   Nao. `VP-CONTROL` (arXiv 2609.10969) isola os dois fatores em um experimento
   2x2: voto cross-model sobre evidencia compartilhada aprova **62,9%** das
   propostas inseguras, contra 22,9% com fonte de evidencia independente. O
   efeito de fonte vale 40,9 pontos; o de modelo, 11,3. Diversidade de modelo e
   quase irrelevante ao lado de uma evidencia que nenhum modelo viu. O
   `Minority Sentinel` (SIGIR'26) mostra o porque: erros correlacionados, e
   "another LLM as arbiter cannot solve the problem". `The Cost of Consensus`
   (ACM CAIS'26) chega ao mesmo ponto medindo custo: debate entre modelos quase
   iguais nao paga o overhead de comunicacao.

2. **O que substitui?** Evidencia executada. O caso de arXiv 2608.12440
   (717k linhas, 189 arquivos, sem test oracle e sem revisao humana de codigo)
   congela a spec antes da implementacao e so entao verifica contra ela:
   31 passes de auditoria, 201 defeitos corrigidos antes de alguem executar o
   programa, convergencia por "dois passes seguidos com zero achados".

## Decisao

`verify-conformance` substitui `validate-evidence` e exige **duas** fontes de
evidencia independentes. Ambas precisam concordar.

**1. Evidencia mecanica (o gate).** `run-verification` roda o comando de
verificacao do proprio repositorio dentro do sandbox e le o `[exit N]` que
`make-sandbox-command-port` ja anexava ao transcript. Exit code diferente de
zero reprova a tentativa, com decider ou sem ele. Este e o fator de 40,9 pontos.

Para o Forgepair, o default (`*default-verify-command*`) e o proprio build do
Lisp mais o self-test, entao um patch que nao carrega ou quebra uma asercao e
reprovado antes de alguem ler a prosa dele. O comando vem do repositorio ou do
`config.sexp` (`:verify-command`), nunca do modelo. `""` desliga o gate.

**2. Spec congelada (o decider).** O decider local passa a ler o pedido
**congelado antes de qualquer edicao** em vez do diff isolado, e a perguntar se a
mudanca atende o pedido. `conformance-state` monta o estado com o pedido em
primeiro lugar, depois a mensagem do executor, o transcript, o diff e a saida da
verificacao — cada bloco truncado para manter o estado dentro do limite que o
model card do decider validou (prompts ate 1536 tokens; o erro de quantizacao
cresce com o tamanho do estado, e o proprio card mostra o Q4_K_M divergindo do
bf16 num state de 32k tokens).

O decider ainda pode reprovar um build verde: build passed nao e o mesmo que
pedido atendido.

**Feedback.** A reprovacao volta para o executor com a razao e a saida do
comando que falhou, para que a proxima tentativa ataque a causa e nao o
sintoma.

**Degradacao.** Sem comando de verificacao e sem decider, volta a heuristica de
saida nao-vazia. Nenhum dos dois e obrigatorio; a sessao nunca trava em
infraestrutura opcional.

## Consequencias

**Ganhos.** O gate mecanico e o unico caminho para "99%": e a unica evidencia
cuja fonte nenhum modelo do ensemble pode ter visto. A pergunta do decider
passa a ser verificavel contra um artefato que existia antes do patch.

**Custo.** Cada tentativa roda o comando de verificacao do repo inteiro. Para o
Forgepair isso e o build Lisp, barato; para um projeto com suite pesada, o
comando deve ser o teste mais rapido que ainda discrimina, nao a suite completa.

**Limite conhecido, sem disfarce.** Gate mecanico cobre o que tem comando. O
que o pedido exige e nao expressivel como comando — "este nome e melhor" —
nao tem como ser verificado sem humano, e o decider nao fecha essa lacuna: 2B
com ECE 0,038 em Noul/Choice curtos nao le semantica de diff grande com
confianca utilizavel. Nesses casos o sistema deve reportar `spec` sozinho e a
confianca, e o humano decide. Sem humano no meio (requisito do pedido), esse
caso simplesmente nao tem resposta automatica.

**Fora de escopo por regra 10.** Roteamento entre providers, ensemble
simultaneo, e LLM judge que valida por narrativa. Os quatro providers do `.env`
(OpenRouter, NVIDIA, Gemini, Groq) sao intercambiaveis **por decisao humana** no
`config.sexp`, uma por vez — nao por seletor automatico.

## Como verificar

`--self-test` cobre os caminhos sem depender de servidor nem de sandbox:

- `command-exit-code`: extrai o ultimo `[exit N]`, devolve NIL sem marcador
- sem gate nenhum: cai na heuristica de saida nao-vazia
- comando de verificacao falhando: reprova, sem decider
- comando passando: aprova, sem decider
- decider reprovando com comando verde: reprova
- os dois aprovando: aprova

Para o caminho real, `forgepair.sh --prompt "..."` num repo com
`:verify-command` configurado.