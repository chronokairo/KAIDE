# Missão do Projeto

## Objetivo Central

Ocultar o segmento abaixo do que os concorrentes atendem bem: **3-4GB de VRAM, modelos na faixa 1.7B-3B**, com engenharia de compressão de prompt que compense a fraqueza de raciocínio desses modelos pequenos.

## Por que isso é diferenciação real

Isso não é wishful thinking — dá pra checar na prática:

1. Pega o Aider ou o OpenCode
2. Roda com `qwen3:1.7b` num T1000
3. Vê se ele se comporta bem ou se degrada rápido

Essa comparação direta é o **primeiro teste de validação**. Se o `chronokairo-coder` conseguir ser mais confiável que Aider/OpenCode nessa faixa específica de hardware, temos uma tese defensável, não só uma cópia com nome diferente.

## Tese Defensável

O mercado de coding agents locais assume GPUs com 8GB+ de VRAM e modelos de 7B+. Quem precisa rodar em hardware mais modesto (laptops com T1000, GPUs integradas, máquinas antigas) é servido mal ou nem servido. O `chronokairo-coder` ocupa esse buraco com:

- **Modelos pequenos** (1.7B-3B) como padrão, não como fallback
- **Compressão de prompt** (Caveman + NTK) que compensa a limitação de raciocínio
- **Otimização para 3-4GB de VRAM** como requisito, não como restrição

## Validação

O teste é simples e mensurável: na mesma máquina com 3-4GB de VRAM, o `chronokairo-coder` produz código mais confiável que Aider/OpenCode rodando com o mesmo modelo pequeño? Se sim, temos posicionamento real.
