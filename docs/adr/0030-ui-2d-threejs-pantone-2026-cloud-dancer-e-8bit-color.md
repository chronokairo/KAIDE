# ADR-0030 - Interface 2D em Three.js com Pantone 2026 White (Cloud Dancer) e Estética 8-Bit Colorida

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0028](./0028-empresa-virtual-de-agentes-control-plane.md) e a [ADR-0029](./0029-implementacao-ui-threejs-e-automacoes-copilot.md) estabeleceram a interface Three.js como o adapter primário de acompanhamento do Control Plane da empresa virtual.

O usuário refinou a direção artística da interface com três diretrizes estritas:
1. **Cor base oficial:** **PANTONE 2026 White ("Cloud Dancer" - PANTONE 11-4201, `#F0EEE9`)** como o fundo neutro, sereno e minimalista da empresa.
2. **Espaço 2D:** A representação dos funcionários e da empresa deve ser estritamente bidimensional (2D top-down / RPG de escritório, estilo Kairosoft / Game Dev Story / Pokémon / Mother), renderizada via **Three.js** com câmera ortográfica (`THREE.OrthographicCamera`).
3. **8-Bit Colorido em toda a interface:** O visual 8-bit não é monocromático; toda a interface abraça uma rica paleta colorida retro game (16 cores estilo arcade/SNES), com fontes pixeladas (`Press Start 2P`, `Silkscreen`), bordas pixeladas grossas, balão clássico de diálogo RPG, medidores HP/EXP/GOLD e sintetizador Web Audio para SFX de 8-bit.

## Decisões

### 1. Paleta de Cores e Identidade Pantone 2026 White
- Fundo principal e cartões de interface adotam o tom **PANTONE 11-4201 Cloud Dancer (`#F0EEE9`)**.
- Tokens adicionados ao CSS global (`globals.css`): `--color-pantone-2026: #F0EEE9;`, classes `.pixel-box`, `.pixel-btn`, `.pixel-art`.
- Fontes retrô integradas via Google Fonts no layout raiz: `Press Start 2P` e `Silkscreen`.

### 2. Cena 2D em Three.js (`CompanyScene2D.tsx`)
- Implementada projeção 2D com `THREE.OrthographicCamera` com fundo em `#F0EEE9`.
- **Zoneamento do Escritório 2D:**
  - *Comando Executivo:* Mesa de madeira escura do Sócio / Diretor Técnico (Você).
  - *Comercial & CRM:* Zona verde esmeralda com terminal de vendas.
  - *Engenharia de Requisitos & UX:* Zonas indigo e rosa com pranchetas e diagramas.
  - *Laboratório Coder:* Zona amarela/dourada com computadores CRT e servidores de desenvolvimento.
  - *QA & Segurança:* Zona vermelha com scanner de vulnerabilidades e escudos.
  - *DevOps Cloud:* Zona roxa com racks de servidores e LEDs piscantes.
  - *Suporte & Finanças:* Zonas ciano e ouro com balcão de atendimento e cofre de auditoria.
- **Esteira de Dados Conduits:** Barramento 2D interligando todos os setores com pacotes de dados animados (`AI → AI → AI → HUMAN`).
- **Sprites dos Agentes:** Textura de spritesheet anime 8-bit colorida (`public/anime_8bit_color.png`) com animação discreta de respiração/digitação e crachá flutuante de status.
- **Interação 2D:** Pan com arrasto de mouse, zoom com scroll e seleção com retículo pixelado `[ ⌜ ⌝ ⌞ ⌟ ]`.

### 3. HUD Retrô Colorido & Diálogo RPG (`CompanyMonitor.tsx`)
- Barra superior retrô com medidor de integridade operacional (`HP [██████████] 100%`), contadores de jobs, custo em dólares acumulado e alerta piscante do Human Gate.
- **Caixa de Diálogo RPG Inferior:** Inspirada nos clássicos de RPG/Visual Novel dos anos 90, exibindo o retrato anime 8-bit do funcionário ativo, departamento e fala em tempo real com cursor piscante `▼`.
- **Human Approval Gate (ADR-0028):** Caixa de diálogo estilo quest de alta prioridade para revisão e liberação de deploy em produção com evidências explícitas.
- **Sintetizador Web Audio 8-Bit:** Emissor sonoro procedural de ondas quadradas (`square wave`) para feedback auditivo de seleção e aprovação, com botão de ligar/desligar áudio (`[♪ SFX]`).

## Consequências

- A experiência visual da empresa virtual torna-se única, combinando o minimalismo calmo do Pantone 2026 Cloud Dancer com o charme vibrante da era de ouro dos jogos 8-bit/16-bit.
- O Three.js entrega renderização 2D a 60fps com aceleração WebGL, preservando os requisitos de governança e portas da arquitetura hexagonal.
