# ADR 0045 — AiChatPanel pertence ao AI

Data: 2026-10-08. Status: proposta para revisão.

Por orientação do proprietário, toda funcionalidade específica de IA pertence ao monorepo Kaide (chronokairo/kaide). AiChatPanel foi removido do Platform e transferido para apps/web/src/infrastructure/ui/organisms/AiChatPanel com CSS Modules e testes de interação.

O componente recebe mensagens, modelos e callbacks; não chama provedores nem acessa dados diretamente. A composição dos callbacks pertence ao produto AI. A entrada ./ui/ai-chat permite consumo explícito sem importar o shell inteiro. Não manter alias no Platform.

A transferência não altera o runtime de agentes nem executa operações em produção. Testes de sugestões e envio por Enter usam jsdom e Testing Library, declarados como dependências de desenvolvimento. A integração ao shell e a revisão do restante da UI permanecem fora desta transferência.

Renumerado de 0042 para 0045: a reunificação do monorepo (ADR-0042) ocupou o número original na sequência canônica após o porte ao layout apps/web.
