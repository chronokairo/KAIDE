# ADR-0008: Absorção do Harness de OSINT, Due Diligence e Web Search do Intelligence

## Status
Aceito (2026-09-24)

## Contexto
O repositório legado `chronokairo/intelligence` (commit `336dc1f34df87bdd512144eef7c50c3f27092e2a`) continha um harness desktop avançado de investigação OSINT, due diligence corporativa, extração limpa de páginas públicas e conformidade com a LGPD.

No commit subsequente (`15ed69b3`), o repositório sofreu um expurgo que eliminou mais de 41 mil linhas de código. Para preservar a propriedade intelectual de alto valor técnico e conectar com as interfaces já existentes em `src/modules/dev/harness/intelligence.ts`, resgatamos as capacidades centrais para o `chronokairo-ai`.

## Decisão

1. **Crate Rust `chronokairo-intelligence` (`src-tauri/intelligence/`)**:
   - Incorporado ao workspace Cargo em `src-tauri/Cargo.toml`.
   - **`search_harness.rs`**: Motor assíncrono multi-provedor (Tavily, SerpAPI, Perplexity, Exa.ai), gerador de dorks de investigação societária (CNPJ, sócios, processos, blindagem patrimonial, laranjas) e parser HTML com hashing determinístico SHA-256 para custódia de evidências.
   - **`public_sources_tool.rs`**: Catálogo estruturado de fontes públicas brasileiras (Receita Federal/QSA, Juntas Comerciais, CNJ/PJe, TSE DivulgaCandContas, Compras.gov, Diários Oficiais), persistência em `~/.cki/public_sources.json` com fundamentação legal explícita (Art. 7º, IX da LGPD) e trilha de auditoria imutável.
   - **`web_capture.rs`**: Capturador de evidências digitais e snapshots PNG/HTML com hash SHA-256.
   - **`provider_manager.rs`**: Gerenciador unificado de chaves de API com suporte transparente a variáveis de ambiente locais (`.env`).
   - Construção 100% autônoma com pure-Rust TLS (`rustls-tls`), eliminando necessidade de `openssl-sys` e `pkg-config` do sistema operacional.

2. **Frontend OSINT (`src/modules/osint/`)**:
   - `IntelligenceChatWorkbench.tsx`: Bancada de chat e investigação com visualização de reasoning steps e evidências.
   - `HarnessConsoleSidebar.tsx`: Console de observabilidade em tempo real de queries e requisições HTTP do harness.
   - `AgentActivityTimeline.tsx`: Linha do tempo de execução das etapas do harness.
   - `InvestigationForm.tsx`, `GraphView.tsx`, `DossierPreview.tsx`, `ProviderSettingsModal.tsx` e `MarkdownRenderer.tsx`.
   - Exportação modular canônica adicionada ao `package.json` (`./osint`).

3. **Resgate Documental para `chronokairo-legal`**:
   - As peças do caso CIESA/WD Educacional (`caso_*.md`, `defesa_*.md`, `mapa_*.md`) e dados TSE foram transferidos para `chronokairo-legal/docs/dossiers/`.

4. **Marketing Intelligence para `chronokairo-marketing`**:
   - Ferramenta de captura e extração de concorrentes com hash SHA-256 transferida para `tools/competitor_capture.js`.

## Consequências
- Os agentes do ecossistema ChronoKairo passam a contar com capacidades de pesquisa web e due diligence com provas auditáveis.
- O build de Rust permanece zero-bloat e desacoplado de bibliotecas nativas de sistema.
- A integridade da propriedade intelectual foi completamente recuperada e versionada.
