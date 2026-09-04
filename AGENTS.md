# ChronoKairo AI — regras do produto

## Responsabilidade

Este repositório implementa o chat de IA da plataforma ChronoKairo e sua API de backend. Ele não é apenas uma demonstração de RAG nem um frontend isolado.

O produto deve:

- responder consultas usando dados e contratos dos produtos ChronoKairo;
- propor e executar manipulações no backend somente por ferramentas tipadas e autorizadas;
- expor chat, streaming, histórico, catálogo de ferramentas e auditoria por API;
- manter provedores de LLM, RAG e integrações externas atrás de portas e adapters;
- consumir a identidade, organização, tenant e RBAC da Platform.

## Arquitetura obrigatória

Usar arquitetura hexagonal:

```text
HTTP/SSE/MCP adapters -> application use cases -> domain -> output ports -> infrastructure adapters
```

- O domínio e os casos de uso não importam Express, Supabase, SDK de LLM ou clientes dos produtos.
- Consultas e comandos usam contratos versionados. Não acessar diretamente o banco de outro produto.
- Toda ferramenta de escrita exige autenticação, `organizationId` validado no servidor, permissão específica, validação de entrada, idempotência e auditoria.
- Ações destrutivas, financeiras, administrativas ou irreversíveis exigem confirmação explícita antes da execução.
- O modelo nunca escolhe nem amplia permissões; a autorização ocorre no backend depois da chamada da ferramenta.
- Segredos e credenciais de provedores ficam somente no backend.

## UI e experiência

- Refatorar a interface para o design system padrão ChronoKairo (`@chronokairo/ui`) e seus tokens de tema.
- Reutilizar AppBar, navegação, identidade autenticada, ícones, estados de carregamento, feedback e componentes acessíveis da plataforma.
- O tema claro/escuro deve aparecer apenas como ícone na AppBar; não duplicar controles na sidebar.
- O chat é a experiência principal. Busca, fontes, ferramentas executadas, confirmações e resultados devem ser distinguíveis e rastreáveis.
- Remover branding e padrões visuais legados de Athena/TOTVS quando não forem necessários ao domínio da integração.
- Não duplicar componentes compartilhados localmente. Quando `@chronokairo/ui` ainda não oferecer um componente, criar uma porta visual local e planejar sua promoção ao pacote compartilhado.

## Critérios mínimos

- `GET /health`, `GET /ready` e `GET /version`.
- Testes unitários dos casos de uso e políticas de autorização.
- Testes de integração para consulta, escrita autorizada, negação por tenant/RBAC e idempotência.
- Lint, typecheck, testes e build executados por Deno.
- Nenhuma resposta mockada em caminhos de produção.
