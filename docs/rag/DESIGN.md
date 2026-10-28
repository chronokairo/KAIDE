# Chronokairo AI — direção de produto e design

## Objetivo

O Chronokairo AI é o chat operacional da plataforma. A interface permite consultar informações e solicitar ações nos produtos conectados; a API executa essas operações por contratos seguros no backend.

## Experiência-alvo

```text
AppBar Chronokairo
├── contexto de organização
├── identidade e sessão reais
└── ícone de tema

Workspace de chat
├── histórico e novas conversas
├── mensagens e streaming
├── fontes e dados consultados
├── proposta de ação e confirmação
└── resultado auditável da ferramenta
```

A refatoração visual deve substituir o componente monolítico e os estilos legados por composição de componentes do `@chronokairo/ui`, preservando os tokens, espaçamentos, tipografia, responsividade e acessibilidade usados nos demais produtos.

## Limites de segurança da UX

- Consulta pode ser executada quando autorizada e deve indicar as fontes utilizadas.
- Escrita deve mostrar produto, ação, organização, efeito e dados relevantes antes da confirmação.
- A interface nunca envia segredo de provedor ou concede papel/permissão.
- Falhas devem usar códigos seguros e um identificador de auditoria, sem revelar detalhes internos.
