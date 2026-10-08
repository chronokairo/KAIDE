# ADR-0043 — Remoção da integração TOTVS, religação ao Supabase prod e saída do `@chronokairo/platform`

- **Data:** 2026-10-08
- **Status:** Aceito (implementado na `main`)
- **Decisão do proprietário:** o Kaide não fala mais com o ERP TOTVS; dados passam a vir do Supabase `chronokairo-prod`; e o pacote `@chronokairo/platform` deixa de ser dependência.

## Contexto

O Kaide carregava uma vertical educacional inteira acoplada ao ERP TOTVS
(`ws.seculomanaus.com.br`, `E.PESSOA`, `E.OFERTAS`, `E.HISTATEND`, SOAP/REST):
17 rotas Next (`/api/totvs/*`, `/api/health/totvs`, catch-all proxy, auth de
atendente e pessoa via TOTVS), harness `ciesa/totvs`, feature RAG `totvs`,
`TOTVSClient`, `TOTVSDocumentLoader`, `TOTVSMCPServer` e o retrieval do RAG
(`searchAll` no TOTVS). Paralelamente, o frontend dependia de
`github:chronokairo/platform#master` para 4 símbolos (`Button`, `ThemeToggle`,
`ThemeProvider`, `useSession`).

## Decisão

1. **Deletar a integração TOTVS** (código preservado no histórico git como fonte
   de porte): rotas Next dedicadas, `totvs-proxy.ts`, catch-all `[...path]`,
   `harness/ciesa`, `features/totvs`, `totvs-loader.ts`, `features/mcp` +
   `mcp-server.ts` (MCP 100% TOTVS), `TOTVSClient`/`getTOTVSClient`,
   métodos de dashboard/turmas/matrículas do `ChatService`, endpoint
   `/chat/turmas`, `TOTVS_*` do environment e logs.
2. **Religar ao Supabase prod** (`your-project-ref`, via Supabase CLI):
   - pessoa CPF/código → `customers` (por `documento`) + `contacts`
     (endpoints Next e RAG recriados, 403 sem organização ativa);
   - retrieval/indexação do RAG → `ops_documents` (novo `SupabaseDocumentLoader`,
     `retrieve()` com `ilike` + filtro de `organization_id`);
   - dashboard → agregados de `support_tickets` + `employees`;
   - health `/totvs` → `/supabase` (admin-gated);
   - novo `shared/lib/supabase.ts` no RAG (service_role + `resolveUserOrganizationId`).
   - Sem equivalente Supabase (ofertas, cursos, grade, ranking, matrículas,
     auth de atendente via TOTVS): removido sem substituto.
3. **Sair do platform**: `Button`/`ThemeToggle`/`ThemeProvider`/`useSession`
   vendirados (`@/shared/components/ui/*`, `@/shared/auth/session`, mesma API e
   comportamento, mesma chave de tema); dep removida do `package.json`, lock
   único na raiz, `transpilePackages` removido. `SessionProvider` vendirado mas
   **não montado** (comportamento idêntico: sessão `null`) — montar é follow-up.
4. **Docs**: README EN/PT sem TOTVS, TODO técnico atualizado, `rag-flowchart.md`
   re-apontado para Supabase. ADRs antigas, CHANGELOG, `ADR_LOG` e docs das
   ferramentas absorvidas (`tools/research-rag`, `ai-sales`) preservados como
   registro histórico; monitores de repos externos (`ciesa_totvs-erp`) mantidos.

## Consequências / débitos

- `company-autopilot` é o destino natural do ERP (ver análise): portar
  `rest-client` + `soap-client` + entidades `E.*` para Python em
  `integrations/totvs/` de lá; Kaide fica no caminho Supabase.
- Montar `SessionProvider` no shell para sessões reais (hoje `null`).
- `vectorStore` local agora indexa `ops_documents`; `CHROMA_PERSIST_DIR` legado
  pode ser limpo após primeira reindexação.
- Testes `forge-adapters`/`enterprise-jobs` seguem bloqueados por `server-only`
  sob vitest (pré-existente, infra de teste).
