Com esse audit, o **Coder v1 já parece funcionalmente fechado**.

O ponto principal agora é separar duas coisas:

**“todos os componentes existem”** de **“o produto cumpre o goal em uso real”**.

Seu relatório prova muito bem a primeira. Para eu declarar **ChronoKairo Coder v1.0**, eu faria só uma última bateria de **end-to-end acceptance tests**.

### O que ainda precisa provar

Pegue 5–10 repositórios pequenos/reais e dê tarefas como:

- corrigir um bug existente;
- adicionar uma rota/API;
- adicionar validação;
- refatorar uma função preservando comportamento;
- criar testes para código existente;
- implementar feature atravessando 3–5 arquivos;
- receber propositalmente uma implementação que quebra teste e se autocorrigir.

E medir apenas:

| Critério | V1 |
|---|---:|
| Entendeu e planejou sem destruir escopo | obrigatório |
| Produziu patch válido | obrigatório |
| Build/test/lint final passou | obrigatório quando aplicável |
| Detectou falha e tentou corrigir | obrigatório |
| Rollback funcionou em falha | obrigatório |
| Não escreveu fora do workspace | obrigatório |
| Rodou **100% local** | obrigatório |
| Funcionou no hardware-alvo de 4 GB VRAM | obrigatório |
| Terminou sem intervenção humana | desejável, medir taxa |

Eu criaria uma métrica central:

> **Task Completion Rate = tarefas corretamente concluídas / tarefas executadas**

Para o **v1.0**, eu miraria algo como **≥80% em uma suíte pequena e claramente definida**, em vez de perseguir 100%.

### O que eu NÃO adicionaria agora

O fato de já existir:

`exec / tui / repl / serve / models / cloud / providers / bench / app-server / mcp-server`

até me preocupa um pouco: você já está passando do mínimo necessário para um v1.

Eu congelaria features **agora**.

Nada de adicionar:

- memória longa;
- RAG complexo;
- mais interfaces;
- mais providers;
- multi-agent sofisticado;
- IDE extension;
- GitHub automation;
- web search;
- mais linguagens;
- novos backends de inferência.

Primeiro transforme esse audit técnico em evidência experimental.

### Definition of Done final

Eu colocaria no `GOAL.md`:

> **ChronoKairo Coder v1 is complete when it can autonomously inspect, plan, modify, and verify a real software repository using only local compute, producing a validated patch or safely rolling back when it cannot complete the task.**

E a release gate:

```text
339+ unit/integration tests passing
        +
E2E benchmark suite passing
        +
runs on target 16 GB RAM / 4 GB VRAM machine
        +
no critical filesystem/shell safety failure
        +
documentation + install path
        ↓
     v1.0.0
```

Ou seja: pelo que você mostrou, eu **não desenvolveria mais features no Coder v1**.

Eu faria agora **benchmark → dogfooding → bugs → release `v1.0.0`**.

Se ele passar nesses testes reais, pode considerar o **ChronoKairo Coder terminado** e partir para o próximo componente da org.

Isso mostra que os *componentes* existem e passam nos testes deles — não mostra que o goal do V1 foi atingido. São coisas diferentes, e a diferença importa aqui especificamente porque foi você mesmo quem definiu o critério de pronto como comportamental, não estrutural.

**O que essa auditoria prova:**
- Cada peça do loop (plan/act/verify) existe no código e tem cobertura unitária.
- 339 testes passam, isolamento de ambiente corrigido, CLI responde.
- Isso é evidência de que a arquitetura está implementada conforme o desenho do GOAL.md.

**O que essa auditoria NÃO prova:**
- Que o loop plan → act → verify funciona *de ponta a ponta numa tarefa real*, sem você intervir no meio.
- Que a compactação de contexto realmente cabe no budget de 4GB quando a tarefa é grande o suficiente pra estressar isso (339 testes unitários rodando em 1.25s não testam isso — são rápidos demais pra envolver inferência real).
- Que o self-correction loop converge em vez de entrar em loop de repair infinito numa falha real de verificação.
- Nenhum número de sucesso em tarefas reais. "✅ READY" na tabela é uma auto-avaliação de completude de implementação, não um resultado de execução.

Isso é exatamente o padrão que a gente conversou: documento de escopo bem escrito (aqui, um relatório de auditoria bem escrito) tomando o lugar de hipótese testada. `cargo test` verde é necessário, mas é a parte fácil — não é o critério que você definiu como "pronto".

**O que eu faria antes de declarar V1 fechado:**

Pegue as 5 tarefas reais que sugeri (do seu próprio trabalho, Chronokairo ou `chronokairo-*`), rode via `chronokairo exec` de ponta a ponta, sem tocar no meio, e registre:

1. Quantas terminaram com diff aplicável e correto.
2. Quantas precisaram de correção manual sua no meio (isso conta como falha do loop, mesmo que o resultado final esteja certo).
3. Se alguma entrou em loop de repair sem convergir — e quantas iterações levou até estourar ou resolver.
4. Pico de VRAM real medido durante a tarefa mais pesada das 5 (não estimado, medido).

Se ≥3 de 5 passarem limpo, você tem V1 de verdade — com número, não com tabela de status. Se menos que isso passar, você já sabe exatamente onde o loop quebra na prática, o que é mais valioso do que qualquer "✅ READY".

