# ADR-0033 - Remoção de Sprites 2D e Transição para Geometria 3D Low-Poly Pura

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0031](./0031-estilo-pokemon-2d-3d-e-interface-minimalista.md) e a [ADR-0032](./0032-refinamento-sprites-threejs-animacao-uv-e-transparencia.md) experimentaram a abordagem híbrida de sprites 2D (billboards) posicionados em um ambiente 3D. 

O usuário solicitou remover completamente os sprites da cena Three.js ("remova os sprites") e realizar uma pesquisa profunda de gaps da plataforma ChronoKairo AI frente aos concorrentes líderes de mercado em 2026.

## Decisões

### 1. Eliminação Completa de Sprites 2D
- Removidos todos os objetos `THREE.Sprite`, materiais `SpriteMaterial`, canvas de texto dinâmico para sprites e o carregamento da textura da spritesheet (`/anime_8bit_color.png`).
- Elimina-se qualquer artefato de transparência, conflito de render order na fila transparente do WebGL ou desfoque de pixel art.

### 2. Adoção de Geometria 3D Low-Poly Pura
- Os agentes e postos de trabalho foram substituídos por modelos 3D puramente geométricos (`MeshStandardMaterial` com sombras suaves PCF):
  - **Mesa de Trabalho 3D:** Em madeira suave Pantone Cloud Dancer (`#D6CEBD` ou executiva `#4A3728`), com laptop de alumínio na superfície.
  - **Cadeira de Escritório Ergonômica 3D:** Base cilíndrica com rodízios, pistão metálico e assento/encosto estofado em tom grafite escuro (`#334155`).
  - **Monitor 3D com Tela Emissiva:** Monitor com tela de iluminação emissiva dinâmica (verde esmeralda `#10B981` quando trabalhando, âmbar `#F59E0B` aguardando aprovação, azul céu `#38BDF8` ocioso).
  - **Personagem 3D Estilizado Low-Poly:** Figura geométrica elegante com tronco em paleta de cargo (Laranja para Coder, Índigo para Analyst, etc.), cabeça e headset tecnológico.
  - **Animação 3D Reativa:** Postura focada e mãos digitando no teclado quando ativo; respiração suave quando ocioso; olhar inclinado para o observador quando aguardando aprovação.
  - **Beacon Holográfico 3D de Aprovação:** Diamante 3D (`THREE.OctahedronGeometry`) com anel orbital em ouro/âmbar flutuando e girando sobre a estação exclusivamente quando `agent.status === 'waiting_approval'`.

### 3. Análise de Gaps Competitivos
- Foi documentada em [`docs/market/analise-gaps-plataforma-concorrencia-2026.md`](../market/analise-gaps-plataforma-concorrencia-2026.md) a comparação detalhada com 23 ferramentas concorrentes (Claude Code, OpenAI Codex, Windsurf, Cursor, Kiro, Factory Droid, Zed, etc.), identificando três gaps críticos prioritários:
  1. Adoção do **Agent Client Protocol (ACP)** como protocolo universal.
  2. Implementação de **Classificador de Risco de 1-token** para triagem no Human Gate.
  3. Suporte a **Git Worktrees efêmeras automáticas por Job**.

## Consequências

- A interface atinge a sobriedade e sofisticação visual alinhadas à paleta Pantone 2026 White (Cloud Dancer, `#F0EEE9`), eliminando a estética de cards 2D.
- Redução drástica de overhead de memória e draw calls por textura.
- Roteiro claro de evolução técnica para alcançar a paridade e liderança frente aos maiores coding agents globais.
