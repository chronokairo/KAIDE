# ADR-0031 - Estilo Pokémon 2D/3D em Three.js e Interface Minimalista

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0030](./0030-ui-2d-threejs-pantone-2026-cloud-dancer-e-8bit-color.md) definiu o uso da cor Pantone 2026 White (Cloud Dancer, `#F0EEE9`) e do Three.js para a visualização da empresa virtual.

O usuário solicitou um refinamento de experiência:
1. **Estilo visual Pokémon 2D/3D:** Inspirado nos jogos clássicos da era Nintendo DS (Geração 4 e 5: Sinnoh e Unova) e no estilo HD-2D, onde o mundo (escritório, mesas, paredes e acessórios) é modelado em 3D low-poly com perspectiva isométrica ortográfica suave, enquanto os personagens/agentes são **sprites 2D de anime em pé no espaço 3D** (billboard sprites que encaram a câmera e projetam sombras de contato).
2. **Interface Minimalista:** Substituir o visual denso de arcade RPG (barras de HP/MP/EXP) por uma interface limpa, moderna e discreta, preservando o foco na cena do escritório e facilitando a supervisão humana.

## Decisões

### 1. Cena Pokémon 2D/3D (`PokemonOfficeScene.tsx`)
- Renderizador Three.js utilizando projeção isométrica ortográfica suave com luz solar suave e sombras projetadas.
- **Ambiente 3D Low-Poly sobre Pantone 2026 Cloud Dancer (`#F0EEE9`):**
  - Piso quadriculado sutil em tons de off-white acolhedor (`#F0EEE9` e `#E8E5DF`).
  - Mesas 3D de trabalho com monitores e computadores.
  - Paredes baixas aconchegantes com quadro branco e post-its em miniatura.
  - Vasos de plantas bonsai Pokémon nos cantos do escritório.
  - Rack de servidores 3D com LEDs piscantes no setor de DevOps.
- **Personagens 2D em Espaço 3D (Estilo NPCs de Pokémon):**
  - Sprites 2D dos agentes em pé no chão 3D, com respiração suave (bobbing vertical), elipse de sombra de contato no solo e balão flutuante sutil com o nome do cargo.
  - Ícone de exclamação animado `!` (estilo Pokémon encounter / quest) flutuando sobre o agente quando houver um Gate de Aprovação Humana pendente.
  - Navegação fluida com pan por arrasto de mouse, zoom com rolagem e seleção de estações com anel sutil.

### 2. Interface de Acompanhamento Minimalista (`CompanyMonitor.tsx`)
- **Header Flutuante Discreto:** Pílula translúcida em tom Cloud Dancer com indicador de status, métricas essenciais (agentes ativos, entregas, custo) e botão de alerta caso haja um gate pendente.
- **Balão de Diálogo Inferior Estilo Pokémon:** Barra sutil na base da tela exibindo a foto do agente, cargo e a tarefa atual em execução em fonte limpa.
- **Gaveta de Detalhes Sob Demanda:** Painel lateral minimalista com escopo, tokens e evidências que só aparece quando solicitado.
- **Human Approval Gate (ADR-0028):** Modal elegante e direto para aprovação de deploys em produção.

## Consequências

- A experiência visual atinge o equilíbrio perfeito entre o charme nostálgico de Pokémon 2D/3D e o minimalismo calmo do tom Pantone 2026 White.
- Zero sobrecarga de elementos na tela; o usuário atua como Sócio/CTO orquestrador com total clareza.
