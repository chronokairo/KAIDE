# ADR-0004 — Drag & drop e limitação de eventos trusted

- **Data:** 2026-08-16
- **Status:** Aceito (com limitação conhecida)

## Contexto

Dashboards e builders exigem arrastar elementos (drag & drop). Além disso, eventos
sintéticos de clique/teclado têm `isTrusted === false`, e alguns sites legítimos
ignoram eventos não-trusted (anti-bot / acessibilidade).

## Decisão

Implementar `dom_drag_drop { source, target }`: dentro da página, cria um `DataTransfer`,
dispara a sequência HTML5 `dragstart → dragover → drop → dragend` nos dois elementos.
Não usar a API CDP `debugger` para gerar eventos trusted.

## Por que não usar `debugger` (CDP)

Adicionar a permissão `debugger` à extensão permitiria eventos trusted e automação tipo
Playwright, mas: (a) amplia a superfície de segurança (a extensão poderia inspecionar
qualquer aba, incluindo páginas sensíveis); (b) conflita com o princípio *minimal* do
projeto. Decisão: **manter sintético** e documentar a limitação. Se a demanda por
`isTrusted` crescer, revisitamos com escopo restrito (ex.: aba ativa + prompt explícito).

## Consequências

- Positivas: drag & drop funcional em componentes HTML5-DnD (a maioria); sem novas
  permissões.
- Negativas: `hover`/`type`/`press`/`drag` não passam em sites que exigem `isTrusted`
  (formulários protegidos, alguns frameworks de gestão de estado); `drag` não cobre
  drag & drop nativo de arquivos do sistema.
