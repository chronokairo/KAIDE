# Análise de Gaps Competitivos — ChronoKairo AI vs. Concorrência (2026)

**Data:** Outubro de 2026  
**Autor:** Antigravity / ChronoKairo AI Team  
**Corpus de Referência:** 23 concorrentes analisados em [`docs/market/changelogs/`](./changelogs/), cruzados com [`docs/desktop-gap-analysis-2026.md`](../desktop-gap-analysis-2026.md), [`docs/market/TODO.md`](./TODO.md) e [ADR-0028](../adr/0028-empresa-virtual-de-agentes-control-plane.md).

---

## 1. Panorama de Mercado (2026): A Mudança de Paradigma

O mercado de desenvolvimento de software assistido por IA em 2026 superou a fase dos simples assistentes de autocompletar e chats de extensão de editor (copilots pontuais). O mercado consolidou-se em torno de duas frentes:
1. **Agent Client Protocol (ACP) & Harnesses Especializados:** Ferramentas de desenvolvimento como Zed, Goose, Windsurf, Kiro e OpenHands deixaram de tentar construir todos os agentes internamente e passaram a operar como orquestradores sobre protocolos universais.
2. **AI-First Virtual Software Engineering Companies & Control Planes:** As empresas líderes abandonaram o modelo "AI -> Produção" em favor de arquiteturas de **Control Plane com Governança Determinística**, onde o trabalho é orquestrado por papéis (`plan → execute → verify → evidence → approval → merge/deploy`) com supervisão humana como gatekeeper de autorização e risco.

---

## 2. Posicionamento Estratégico da ChronoKairo AI

A **ChronoKairo AI** é concebida não como um chatbot isolado, mas como uma **Empresa Virtual de Agentes AI-First com Supervisão Humana**:
- **Modelo Operacional:** `AI → AI → AI → HUMAN` (nenhuma IA mexe em dinheiro ou deploy de produção sem aprovação humana).
- **Papéis Especializados:** Comercial, Analista de Requisitos, Product Designer, Coder, QA & Adversarial Testing, DevOps & Cloud, Customer Support, Finance/Ops e Diretor Técnico Humano (CTO).
- **Arquitetura Obrigatória:** Hexagonal Pura (Ports & Adapters) desacoplando Domínio, Casos de Uso, Portas e Adaptadores (Three.js em Pantone 2026 Cloud Dancer, Tauri IPC, Next.js Web, Supabase, LLMs).
- **Núcleo Rust Zero-Lib (`ckc`):** Engine performática em Rust nativo sem frameworks pesados, garantindo startup instantâneo e baixo consumo de memória.

---

## 3. Matriz Comparativa Detalhada: ChronoKairo AI vs. Concorrência

| Dimensão | Estado da ChronoKairo AI | Concorrência de Ponta (Claude Code, Codex, Windsurf, Cursor, Kiro, Factory) | Classificação do Gap |
| :--- | :--- | :--- | :---: |
| **1. Modelo de Empresa Virtual & Governança** | **LÍDER**: Orquestra papéis organizacionais completos (Comercial a Financeiro) com rastreamento de jobs e evidências. | Concorrentes focam predominantemente no papel de Coder/Terminal Agent isolado. | 🟢 **Vantagem Competitiva** |
| **2. Protocolo Universal de Agente (ACP)** | Protocolo interno proprietário `Op`/`EventMsg` entre núcleo Rust e UI. | **ACP (Agent Client Protocol)** adotado por Zed, Goose, Windsurf e Kiro Crew para plugar e trocar engines de IA sob demanda. | 🔴 **Gap P1 (Crítico)** |
| **3. Classificador Dinâmico de Risco** | Human Approval Gate no Control Plane baseado em status estático (`waiting_approval`). | **Guardian V2 (Codex) / Auto Mode (Claude Code) / Droid Shield (Factory)**: Classificador de 1 token que tria risco antes do gate e invalida aprovações se permissões forem ampliadas. | 🔴 **Gap P1 (Crítico)** |
| **4. Worktrees Git por Job/Task** | Execução no workspace corrente do repositório ou branch manual. | **Worktrees efêmeras automáticas (Windsurf, Codex App, Kilo)**: Cada subagente opera em worktree própria, isolando modificações até a validação do CI. | 🔴 **Gap P1 (Crítico)** |
| **5. Context Engineering Econômico** | RAG pgvector (Supabase) e compressão básica no `ckc`. | **Prompt-Cache Preserving Compaction (Codex, Qwen, Claude Code)**: Microcompactação que mantém o cache de prompt intacto; `/context` com custo por arquivo e boundary checkpoints. | 🟡 **Gap P2 (Importante)** |
| **6. Sandboxing Fail-Closed & Egress** | Sandbox container Docker (ThinkCoffee) e módulo Rust no `ckc`. | **Sandboxing fail-closed (Codex 0.156+)**: Bloqueio de rede em redirects, cancelamento ativo de conexões ao revogar, mascaramento automático de credenciais (JWT, AWS keys). | 🟡 **Gap P2 (Importante)** |
| **7. Triggers Event-Driven (PR Autopilot)** | Conexão com Supabase e remotes GitHub/GitLab configurados. | **PR Watch Autopilot (Cursor Subscriptions, Kilo, OpenHands)**: Agente monitora comentários de review em PRs do GitHub/GitLab e itera autonomamente até o CI ficar verde. | 🟡 **Gap P2 (Importante)** |
| **8. Interface de Supervisão Espacial** | **ÚNICA**: Cena 3D low-poly executiva (Pantone 2026 Cloud Dancer) com monitor de status, sem poluição de sprites. | Concorrentes usam painéis técnicos tradicionais (listas/tabelas/chat). | 🟢 **Vantagem Competitiva** |

---

## 4. Análise dos Principais Gaps e Soluções Recomendadas

### Gap 1: Adoção do Agent Client Protocol (ACP) como Porta Universal
- **O Problema:** A concorrência (em especial Zed, Goose, Kiro Crew e Windsurf) utiliza o ACP como a linguagem comum entre o harness de execução e o frontend de supervisão. O Kiro Crew, por exemplo, consegue orquestrar Claude Code, OpenAI Codex e Goose como "trabalhadores" sob um mesmo teto.
- **A Solução para ChronoKairo:** Implementar um adapter secundário no `src/application/ports/` e `src/infrastructure/acp/` que expõe a empresa virtual como um ACP Server e consome harnesses externos compatíveis com ACP para executar tarefas específicas (ex.: delegar uma sub-task complexa de refactor para um runner ACP).

### Gap 2: Classificador de Risco Dinâmico (1-Token Risk Classifier)
- **O Problema:** O Human Gate da ChronoKairo atualmente exige aprovação manual em pontos predeterminados de fluxo (`waiting_approval`). O Claude Code e o Codex Guardian V2 utilizam modelos ultrarrápidos (chamada com output de 1 token: `LOW`, `MED`, `HIGH`, `CRITICAL`) para:
  1. Auto-aprovar ações seguras de leitura, formatação e testes locais sem incomodar o CTO/Sócio.
  2. Barrar imediatamente chamadas que envolvam destruição de arquivos, envio de dados externos ou alteração de configs sensíveis.
  3. Invalidar aprovações prévias caso o agente altere o plano ou amplie o escopo das ferramentas solicitadas.
- **A Solução para ChronoKairo:** Integrar no caso de uso do Control Plane uma etapa de pré-classificação de risco via SLM/LLM local ou chamada rápida de 1 token, gerando uma pontuação de risco e evidência anexada ao `JobEntity`.

### Gap 3: Isolamento por Git Worktrees Automáticas
- **O Problema:** Quando múltiplos agentes trabalham simultaneamente (ex.: Coder desenvolvendo um caso de uso e QA gerando testes adversariais), atuar na mesma árvore de arquivos gera conflitos de merge e polui o estado de trabalho do desenvolvedor humano. Ferramentas como Kilo 7.7 e Windsurf utilizam pools de *pre-warmed worktrees*.
- **A Solução para ChronoKairo:** Vincular o ciclo de vida do `JobEntity` a uma git worktree efêmera (`.worktrees/job-<id>`). O agente realiza as alterações e roda os testes na worktree; após a aprovação humana no Human Gate, o Control Plane realiza o merge atômico na branch alvo.

### Gap 4: Compactação Econômica Preservando Prompt Cache
- **O Problema:** Conforme as conversas e sessões de engenharia crescem, o truncamento ingênuo de contexto descarta o cache de prompt dos provedores (Anthropic Prompt Caching, OpenAI Prefix Caching, DeepSeek Cache), elevando custos em 10x e aumentando a latência.
- **A Solução para ChronoKairo:** Implementar no compressor de contexto do `ckc` microcompactações orientadas a blocos estáveis, salvando checkpoints de boundary e expondo no Monitor o custo detalhado de contexto por arquivo acessado.

---

## 5. Roadmap Estratégico de Implementação

### Onda 1 — Paridade Crítica (P1)
1. **Classificador de Risco no Approval Gate:** Modelo de 1 token pré-classificando o risco de cada tool call antes de solicitar autorização humana.
2. **Orquestração de Git Worktrees por Job:** Isolamento completo de execução entre agentes simultâneos.
3. **Adapter ACP (Agent Client Protocol):** Interoperabilidade universal com harnesses e editores modernos.

### Onda 2 — Autonomia e Integrações (P2)
1. **PR Watch & Autopilot de CI:** Watcher event-driven no GitHub e GitLab para resolução autônoma de apontamentos de code review.
2. **Prompt-Cache Preserving Compaction:** Redução drástica de tokens e preservação de cache em sessões longas.
3. **Hardening de Sandbox Desktop:** Imposição de network policy fail-closed e mascaramento de credenciais (redaction de JWT e API keys).

### Onda 3 — Refinamento de Experiência (P3)
1. **Review Center Inline no Monitor de Controle:** Diffs virtuais com anotações e feedback direto na interface Three.js / HUD.
2. **Durable Event Log & Crash Recovery:** Journal local em SQLite permitindo retomada imediata de jobs interrompidos por reinício da máquina.
