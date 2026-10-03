# ADR-0032 - Refinamento de Sprites 2D em Three.js: Animação por UV Offset, Proporções Nativas e Transparência Alpha

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0031](./0031-estilo-pokemon-2d-3d-e-interface-minimalista.md) introduziu a estética Pokémon 2D/3D (estilo Nintendo DS / HD-2D) no Three.js com o fundo Pantone 2026 White ("Cloud Dancer", `#F0EEE9`).

O usuário solicitou o ajuste fino do comportamento dos sprites de personagens utilizando o Three.js ("ajuste os sprites usando o three.js pesquise como fazer"). A pesquisa e inspeção técnica revelaram pontos cruciais de melhoria:
1. **Transparência e Canal Alpha:** A spritesheet original gerada possuía fundo sólido claro (RGB ~238, 239, 233). Em um ambiente 3D, sprites sem canal alpha transparente são renderizados como cartões retangulares opacos flutuando no espaço.
2. **Proporção Nativa (Aspect Ratio):** Cada célula da spritesheet (1024x1024 com 8 colunas e 5 linhas) mede 128x204.8 px, resultando em uma proporção largura:altura de `5:8` (0.625). A escala anterior quadrada (`1.9 x 1.9`) distorcia os personagens, achatando-os horizontalmente.
3. **Clonagem e UV Mapping no Three.js:** Tratar spritesheets animadas no Three.js exige que cada instância de sprite possua uma textura clonada independente da textura mestre com `wrapS = wrapT = THREE.RepeatWrapping`, caso contrário a alteração do offset afetaria todos os agentes simultaneamente.
4. **Ciclo de Animação:** Implementar alternância de frames e bobbing de respiração de acordo com o estado do agente (`working`, `idle`, `waiting_approval`).

## Decisões

### 1. Canal Alpha e Extração de Fundo Transparente
- O arquivo `public/anime_8bit_color.png` foi processado para o formato PNG de 32bpp ARGB nativo, eliminando os pixels de fundo claro com `Alpha = 0`.
- No material do Three.js (`THREE.SpriteMaterial`), foi configurado:
  - `transparent: true`
  - `alphaTest: 0.15` (descarta fragmentos transparentes imediatamente, evitando conflitos de oclusão de profundidade)
  - `depthWrite: true` e `depthTest: true` (garante que os pixels sólidos do personagem ocluam e sejam ocluídos corretamente pelas mesas e monitores 3D)

### 2. Proporção Nativa e Assentamento no Solo 3D
- As dimensões 3D foram corrigidas respeitando a proporção nativa `0.625`:
  - `SPRITE_HEIGHT = 2.08`
  - `SPRITE_WIDTH = 1.30` (`2.08 * (5 / 8)`)
- Posição vertical calculada com centro em `Y = 1.04` e profundidade `Z = -0.4`:
  - Os pés do agente tocam perfeitamente o solo (`Y = 0.0`), alinhando-se com o disco de sombra de contato Pokémon.
  - A mesa (altura `0.85`, posicionada em `Z = +0.4`) cobre as pernas, mantendo tronco, braços, rosto e cabelo visíveis operando o computador.

### 3. Configurações de Textura Pixel-Art
- Configurações da textura mestre e das texturas clonadas de cada agente:
  ```typescript
  charTex.wrapS = THREE.RepeatWrapping;
  charTex.wrapT = THREE.RepeatWrapping;
  charTex.repeat.set(1 / 8, 1 / 5);
  charTex.magFilter = THREE.NearestFilter;
  charTex.minFilter = THREE.NearestFilter;
  charTex.generateMipmaps = false;
  ```
  `generateMipmaps = false` e `NearestFilter` evitam qualquer desfoque bilinear ao visualizar os agentes em diferentes níveis de zoom.

### 4. Animação Multi-Estado por UV Offset no Loop do Three.js
- Cada agente possui seu controlador de animação rastreado (`AgentAnimState`):
  - **Trabalhando (`working`):** Ciclo ágil de 4 frames a cada 0.22s (digitação/trabalho ativo), leve bobbing de digitação (`Math.sin(elapsed * 7.0 + seed) * 0.02`) e monitor brilhando em verde esmeralda (`#10B981`).
  - **Aguardando Aprovação (`waiting_approval`):** Alternância entre pose neutra e alerta (frames 0 e 4) a cada 0.45s, balão de exclamação `!` saltando sobre o agente e tela do monitor em tom âmbar (`#F59E0B`).
  - **Ocioso (`idle`):** Ciclo suave de respiração (frame 0 por 1.2s, frame 1 por 0.4s), bobbing relaxado (`Math.sin(elapsed * 2.8 + seed) * 0.03`) e tela em tom azul céu (`#38BDF8`).

### 5. Desacoplamento Reativo do Ciclo de Vida
- A cena Three.js, iluminação, paredes, piso e mobiliário são criados uma única vez na montagem inicial (`useEffect(..., [])`).
- Mudanças nos dados dos agentes (`agents` prop) atualizam os estados de animação e cores das telas em tempo real, sem desmontar ou recriar a cena WebGL, garantindo 60 FPS contínuos sem cintilação.

## Consequências

- Os sprites agora aparecem recortados com perfeição, sem bordas ou caixas brancas ao redor dos personagens.
- Personagens com proporções anime esguias e autênticas ao estilo Pokémon Nintendo DS / HD-2D.
- Escritório vivo e dinâmico, refletindo o estado operacional real do Control Plane da empresa virtual.
