# ADR-0022 — Migração para arquitetura hexagonal sem deleção de código

**Status:** Aceito
**Data:** 2026-09-26

## Contexto

O repositório consolidou múltiplos produtos (cli, desktop, ai, thinkcoffee) e hoje mistura preocupações de infraestrutura com regras de aplicação:

- Rotas Next.js (`src/app/api/ai/*`) fazem chamadas HTTP a provedores externos (NVIDIA), resolvem credenciais e mapeiam erros na mesma função.
- `src/shared/supabase.ts` é um mock local usado como fallback em produção, sem uma porta que permita trocar a implementação.
- O backend Express legado (`src/server/rag`) está excluído do typecheck e duplica casos de uso que já existem nas API routes.
- As regras do produto exigem: domínio e casos de uso sem imports de Express, Supabase ou SDKs de LLM; ferramentas de escrita com autenticação, RBAC, idempotência e auditoria; segredos somente no backend.

Uma reescrita "big bang" é inviável: o código legado tem comportamento em produção e deleções em massa geram regressões difíceis de rastrear.

## Decisão

Adotar arquitetura hexagonal por migração incremental (strangler fig aditivo), sem deletar código existente:

1. **Papéis, não remoções.** Todo código existente recebe um papel hexagonal:
   - `src/domain/` — tipos e erros de domínio (puro, sem dependências);
   - `src/application/ports/` — interfaces que o aplicativo consome (identidade, credenciais, LLM, segredos, auditoria);
   - `src/application/use-cases/` — orquestração dependendo apenas de portas;
   - `src/infrastructure/` — adapters que envolvem o código atual (Supabase, NVIDIA, crypto-vault) implementando as portas;
   - `src/features/*/composition/` — composition roots ligando adapters a casos de uso (seguindo o padrão já existente em `ai-credentials`).

2. **Rotas viram adapters HTTP finos.** A rota valida entrada (zod), chama o caso de uso e mapeia erros de domínio para HTTP. Nenhuma chamada de rede ou acesso a dados permanece na rota.

3. **Fases incrementais com paridade comportamental.** Cada rota migrada preserva exatamente status codes, mensagens de erro e ordem de validação (ex.: 401 antes de 400). O código legado permanece funcional até o substituto estar verificado; só então deixa de ser referenciado.

4. **Regras de ouro.**
   - Domínio e aplicação não importam `next`, `express`, `supabase` nem `fetch` direto a provedores;
   - Adapters não contêm regras de negócio, apenas tradução;
   - Nenhum mock em caminho de produção: o mock de Supabase vira adapter `local-dev` explícito de `IdentityPort`/repositórios (Fase 3);
   - Toda ferramenta de escrita futura exige `AuthContext`, permissão, idempotência e `AuditPort` (Fase 3+).

Fases: (0) fundação — domínio, portas, erros; (1) piloto — rota `api/ai/chat` invertida via `SendMessageUseCase`; (2) rotas restantes + envolver o Express legado; (3) identidade/segredos/auditoria como portas reais; (4) núcleo Rust `ckc` consumindo os mesmos contratos; (5) governança — reverter exclusões de typecheck, CI.

## Consequências

**Positivas:**
- Casos de uso testáveis com fakes das portas (sem rede, sem Supabase);
- Provedores de LLM e identidade substituíveis sem tocar a aplicação;
- A regra "sem mock em produção" vira enforcement estrutural, não disciplina;
- Migração sem big bang: cada fase é verificável e reversível.

**Negativas/temporárias:**
- Duplicação temporária: adapters coexistem com o código que envolvem até a Fase 2/3 consolidar;
- Mais arquivos e indireção no caminho crítico do chat;
- O mock de Supabase continua ativo em produção até a Fase 3 (débito explícito, ver ADR-0005).

**Exemplos de mapeamento (código atual → papel hexagonal):**
- `src/app/api/ai/chat/route.ts` → adapter HTTP fino;
- `authenticateRequest` → `SupabaseIdentityAdapter` implementa `IdentityPort`;
- `createNvidiaCredentialService` → `NvidiaCredentialAdapter` implementa `CredentialPort`;
- fetch NVIDIA inline → `NvidiaLlmAdapter` implementa `LlmPort`;
- `encryptVaultSecret`/`decryptVaultSecret` → futuro adapter de `SecretsPort` (Fase 3).
