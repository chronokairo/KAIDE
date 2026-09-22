**Goal do V1 (uma frase):**

> Um agente de coding CLI que roda 100% local em 4GB VRAM, recebe uma tarefa de código real (bug fix, feature pequena, refactor pontual), executa um loop plan → act → verify, e entrega um diff funcional sem intervenção manual no meio do processo.

**O que isso implica, concretamente:**

**Entrada:** uma instrução em linguagem natural + acesso a um repo local (não um sandbox sintético — um repo de verdade, do seu próprio trabalho).

**Loop obrigatório:**
1. **Plan** — decompor a tarefa em passos verificáveis (não "resolva isso" solto pro modelo).
2. **Act** — gerar código/edição, com contexto comprimido o suficiente pra caber no budget de 4GB.
3. **Verify** — rodar algo determinístico (compilação, testes, lint) antes de considerar o passo concluído. Se falhar, volta pro loop com o erro real como novo contexto — não pede confirmação humana a cada iteração.

**Saída:** diff aplicável + relatório do que foi feito e por quê. Não precisa aplicar automaticamente — você revisa e aceita/rejeita, mas o trabalho de chegar até o diff é 100% autônomo.

**O que NÃO entra no V1** (pra não repetir o padrão de escopo inflado):
- Múltiplos providers/fallback complexo além do que já existe (NIM → Ollama já é suficiente).
- Memória persistente entre sessões (isso é o `chronokairo-context`, fora de escopo aqui).
- UI, dashboard, qualquer coisa visual.
- Suporte a múltiplas linguagens de propósito geral — escolha uma (a que você mais usa: Rust, Go ou TS) e faça funcionar bem antes de generalizar.
- Qualquer tarefa que exija mais de ~3-4 arquivos de contexto simultâneo — se não cabe no budget, a tarefa está fora do escopo do V1, não é motivo pra aumentar o context window.

**Critério de "pronto" (binário, testável):**
Pegue 5 tarefas reais que você resolveria manualmente essa semana (Chronokairo ou `chronokairo-*`), rode todas pelo coder sem ajuda, e meça: quantas terminaram com diff aplicável e correto, sem você precisar terminar a tarefa manualmente. Se ≥3 de 5 passarem, você tem um V1 de verdade — não porque bateu uma spec, mas porque resolveu trabalho seu.

O **goal do ChronoKairo Coder v1** deve ser bem estreito:

> **Transformar uma tarefa de desenvolvimento em uma mudança de código validada localmente, com o mínimo de intervenção humana.**

Em termos práticos, o v1 precisa conseguir pegar algo como:

> “Adicione paginação nessa rota e ajuste os testes.”

e seguir um ciclo completo:

1. entender o repositório;
2. localizar os arquivos relevantes;
3. montar um plano curto;
4. editar o código;
5. rodar testes/lint/build;
6. analisar falhas;
7. corrigir;
8. repetir até passar ou chegar a uma conclusão clara;
9. entregar um resumo do que mudou e do que foi validado.

O diferencial do v1 não deve ser “ter memória”, “ser multi-agent” ou “usar dezenas de modelos”. Deve ser **concluir tarefas pequenas e médias de coding de ponta a ponta**.

Eu definiria o escopo funcional assim:

- leitura e navegação do repositório;
- busca textual/semântica simples;
- leitura de arquivos;
- criação/edição/remoção de arquivos;
- execução segura de comandos;
- `git diff`;
- detecção de stack e comandos comuns;
- planejamento antes de modificar;
- loop `plan → act → verify`;
- testes/build/lint como evidência;
- retry quando a validação falhar;
- limite de tentativas/tempo/tokens;
- relatório final;
- nunca declarar sucesso sem alguma evidência verificável.

A definição de **DONE** poderia ser:

> Dado um repositório existente e uma tarefa bem definida, o ChronoKairo Coder consegue produzir autonomamente um patch correto e demonstrar, por testes, build, lint ou outro critério verificável, que a tarefa foi cumprida.

E eu excluiria explicitamente do v1: interface SaaS, colaboração em equipe, memória de longo prazo, agentes especializados, geração automática de PRs, browser automation, execução distribuída, cloud obrigatória, fine-tuning e suporte perfeito a todas as linguagens.

O fluxo central deveria caber quase inteiro nisso:

```text
TASK
  ↓
INSPECT
  ↓
PLAN
  ↓
ACT
  ↓
VERIFY
  ├── failed → REFLECT → ACT
  └── passed
        ↓
      DONE
```

Se você conseguir fazer **esse loop ser extremamente confiável**, já tem um Coder v1 legítimo. Todo o resto pode nascer depois como consequência, não como requisito inicial.