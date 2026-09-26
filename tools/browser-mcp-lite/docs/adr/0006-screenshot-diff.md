# ADR-0006 — Screenshot diff com OffscreenCanvas

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Comparar estado visual antes/depois de uma automação (ex.: confirmação de que um modal
apareceu, um tema mudou) sem depender de serviços externos ou CDP.

## Decisão

`screenshot_diff { reset? }` implementado 100% no service worker da extensão:

1. Captura a aba visível (`chrome.tabs.captureVisibleTab`, ativando a aba se preciso).
2. Baseline por aba guardada em `chrome.storage.session` (sobrevive a reinicialização do
   service worker; descartada quando a sessão do Chrome fecha).
3. Comparação por pixel com `createImageBitmap` + `OffscreenCanvas`/`getImageData`
   (limiar de diferença 60), calculando: % de pixels mudados, caixa delimitadora (bbox)
   das mudanças e uma **imagem de diff** (pixels alterados em vermelho, via
   `convertToBlob` + base64).
4. `reset` redefine a baseline; dimensões diferentes (viewport/resolução) retornam aviso.

## Consequências

- Positivas: zero dependências e zero exfiltração de imagens; baseline persistente por
  aba; resultado acionável (bbox + imagem).
- Negativas: comparação do viewport visível (não da página inteira rolada); ruído de
  animações pode inflar o diff (fazer `wait_for` networkIdle antes); storage limitado a
  ~10MB por sessão (adequado para algumas baselines).
