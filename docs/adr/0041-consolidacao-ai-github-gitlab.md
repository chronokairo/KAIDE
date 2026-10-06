# ADR 0041 — Consolidação do AI no GitHub

Status: proposta implementada em branch; não integrada à main. Autorizada pelo dono em 2026-10-06.

GitHub main cab899f e GitLab main c518a4a tinham históricos sem ancestral comum. Comparação: 38 arquivos diferentes; GitHub tem shell Enterprise, sidebar e adapters NVIDIA recentes; GitLab preserva 74 commits e a correção server-side/TLS do proxy.

Decisão: merge com dois pais preserva os históricos. Conflitos de interface/documentação/dependências mantêm a versão GitHub; a correção do proxy vem do GitLab. Chat e catálogo de modelos continuam exigindo identidade autenticada, inclusive com credencial NVIDIA server-side. Organização/ator requerem configuração explícita.

A credencial administrativa do banco sai do módulo importado pelo browser. Cliente administrativo lazy, backend-only, sem fallback embutido; callers server-side migrados. Jobs CLI usam condição react-server; testes isolam o marcador e nunca acessam dados reais. Segredos já existentes no histórico não são apagados nem considerados revogados por esta alteração; precisam de rotação no provedor.

Validação: 17 testes focados Vitest e 2 do proxy passam. Marcador server-only rejeita importação no runtime browser/default e aceita condição do CLI. Verificação dos arquivos rastreados atuais não encontrou literais service_role. Typecheck e build ficam bloqueados pelo import preexistente de ../data/mockData em ConfigView.tsx (presente também nas origens). Não declarar branch pronta para produção.

Repositório canônico desejado: github.com/chronokairo/ai. GitLab permanece origem auditável até conclusão do backlog e das integrações. Não operar mirrors como dois produtos ativos.
