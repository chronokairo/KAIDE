# Próximos passos do Forgepair

## Objetivo

O projeto preserva a regra **zero-lib**: nenhuma dependência de Quicklisp, npm ou
Python no runtime final. SBCL, curl, Git, Bubblewrap e ferramentas POSIX formam
a plataforma.

A forma do produto é **dois modelos, um terminal, um projeto**: um executor faz
o trabalho, um segundo modelo decide se o resultado responde ao pedido congelado
antes de qualquer edição. Por que essa forma e não outra está em
[`docs/research/two-models-2026.md`](docs/research/two-models-2026.md).

## Trabalho concluído

- [x] Remover turnos fixos (`--turns`, `:turns`, contador `[N/D]`) em favor de
      sessão contínua com limite de segurança interno (ADR-0003/0008).
- [x] Implementar multi-tool calling (`shell`/`read`/`list`, cadeia até `done`)
      para executor e improver (ADR-0008).
- [x] Unificar o chat: session-port do Telegram recebe os mesmos eventos do
      output-port (voce, pares, ferramentas, validação) no mesmo chat
      (ADR-0006/0008).
- [x] Conformidade contra o pedido congelado + exit code do comando de
      verificação do repo, em vez de "houve mudança?" (ADR-0011).
- [x] Falha fechada: saída sem `[exit N]`, ausência de evidência e silêncio do
      decider não aprovam. Removido o fallback de "saída não-vazia".
- [x] `*default-verify-command*` = `nil`: o gate é declarado por projeto, nunca
      adivinhado.
- [x] `run-session` reporta **Nao concluido** quando todas as tentativas falham,
      em vez de anunciar sucesso.
- [x] `*max-executor-attempts*` parametrizado (default 3).
- [x] Diagnósticos em `scripts/`: reader, lint com zero-warning, balanceador de
      parênteses eMedidor de profundidade.

## Defeitos reais encontrados e corrigidos

Todos por execução real de SBCL 2.6.9, não por leitura. `lint.lisp` exige
**zero** warnings e o self-test exige exit 0.

| Defeito | Como se manifestava |
| --- | --- |
| `search-from-end` | Função inexistente em Common Lisp; o parsing do marcador de exit falhava. |
| `let` paralelo | Onde `let*` era necessário, bindings liam `nil`. |
| `(/ verify-code 0)` | Divisão por zero disparada quando o comando passava com exit 0. |
| Fallback approving | Saída não-vazia sem exit code era aceita. |
| `let*` fechado cedo | Um `)` a mais no `setf feedback` de `run-session` encerrava o `let*`; `ACCEPTED` e `LAST-NOTE` viravam `undefined variable`. O loop foi extraído para `run-executor-attempts`, que devolve `multiple-values`. |
| `loop ... with` | `accepted`/`last-note` eram bindings de `WITH`, que morrem com o loop; o `values` posterior os lia de fora de escopo. |
| `multiple-value-bind` malformado | Parênteses fechavam o `let*` do `self-test` cedo, virando forms no corpo. |
| Asserção obsoleta | Comparava `verify-command` com o default, que passou a ser `nil`. |
| `notes-port-started` | Variável atribuída e nunca lida. |
| `format` directives | `~V` e `~:*~D` malformados nos utilitários de diagnóstico. |

## O que a pesquisa de 2026 exige mudar

Regra 11 da constituição: um achado que aponta defeito em Forgepair vira
correção, não anotação. Análise completa em `docs/research/two-models-2026.md`.

- [ ] **Usar a confiança do decider, não descartá-la.** Hoje o veredito é
      booleano e a confiança só vai para o texto da nota. arXiv:2606.29713
      mostra que recompensa binária comprime toda a qualidade de verificação em
      um bit, e o treinamento trava. Landar com teste que falhe primeiro.
- [ ] **Impor um piso de confiança, ou justificar por que não.** Relacionado ao
      item acima; o limiar precisa ser medido contra patches aceitos e
      reprovados reais, não escolhido por intuição.
- [ ] **Repetir o decider K vezes** para cortar variância em O(1/K) sem mexer no
      viés (arXiv:2607.05391). Barato a 0,12–0,31 s por chamada, mas o ganho real
      ainda não foi medido.
- [ ] **Normalizar formatação antes de julgar o diff.** Vies de estilo domina o
      de posição, 0,76–0,92 contra ≤0,04 (arXiv:2604.23178), e o input do
      decider é um `git diff`.
- [ ] **Garantir que executor e decider nunca sejam o mesmo modelo**, e registrar
      essa checagem. Hoje é verdade por construção, não por verificação.
- [ ] **Trocar `git diff --stat` por diff real** em `conformance-state`: sem o
      conteúdo, o decider julga uma contagem de arquivos, não a mudança.
- [ ] **Formalizar os critérios de aceitação** no pedido congelado, em vez de
      congelar só o texto do usuário.
- [ ] **Medir o decider contra rótulo humano** em patches reais. Nenhuma fonte
      acima calibra *este* modelo; arXiv:2606.29713 mostra que um decider
      fine-tuned estreitamente vira especialista e perde 10–14 pp fora da
      distribuição.

## Bloqueios

- [ ] **Rodar o executor real dentro do sandbox.** `bwrap` é Linux-only e não
      existe para Windows (`winget search bwrap` →
      `No package found matching input criteria.`). Falta um host Linux ou WSL
      com SBCL e bubblewrap para validar `make-sandbox-command-port` de ponta a
      ponta, incluindo o marcador `[exit N]` emitido de verdade.
- [ ] **`:verify-command` no `config.sexp` real.** O default passou a `nil` e o
      exemplo tem o comando, mas o config que roda o Forgepair ainda não
      declara o seu. Sem isso o próprio Forgepair roda sem gate mecânico.

## Menor prioridade

- [ ] Adicionar testes de contrato para cada adapter de provider.
- [ ] Ajustar `decider-candidate-prob` (`src/adapters.lisp`) se os nomes de
      campo do `/completion` da sua build do llama.cpp diferirem dos
      testados (ver `docs/decider.md`).
- [ ] Melhorar a validação de comandos antes da execução no sandbox.

## Como verificar

Da raiz do repositório, com `C:\Program Files\Steel Bank Common Lisp` no `PATH`:

```bash
sbcl --noinform --disable-debugger --script src/entrypoint.lisp --self-test  # exit 0
sbcl --noinform --script scripts/reader.lisp    # cada arquivo lê até o fim
sbcl --noinform --script scripts/lint.lisp      # zero warnings, exit 1 se houver
```

`scripts/README.md` documenta os diagnósticos e quando usar cada um.

## Regras para os agentes

1. Migrar uma capacidade pequena e verificável por vez.
2. Demonstrar mudanças com teste ou exemplo reproduzível.
3. Não introduzir bibliotecas externas no núcleo Lisp.
4. Manter credenciais fora do Git e dos terminais sandbox.
5. Pesquisa que aponta defeito em Forgepair vira correção concreta, não nota de rodapé.