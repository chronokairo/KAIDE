# ADR-0023 — Paridade de UX/UI com microsoft/edit, Detecção de GPU via SMI e Contexto de Workspace no Agente

**Status:** Aceito
**Data:** 2026-09-26

## Contexto

Ao executar o terminal interativo `ckc` em projetos locais e ambientes WSL2/Linux, foram identificados três problemas principais:

1. **Detecção de GPU como `Unknown`**: A rotina de hardware inspecionava apenas `/proc/driver/nvidia` e `/sys/class/drm`. No WSL2, `/proc/driver/nvidia` frequentemente não expõe arquivos de topologia por dispositivo sem montagens específicas, fazendo com que GPUs ativas como a GTX 1650 fossem reportadas como "Unknown".
2. **Divergência de UX/UI com `microsoft/edit`**: A interface anterior possuía apenas botões estáticos no appbar superior e não permitia interação com dropdowns, atalhos de menu contextual ([File], [Edit], [AI Agent], [Help]), nem atualização em tempo real do editor quando o agente modificava arquivos em disco.
3. **Isolamento de Contexto no Agente Autônomo**: Ao executar `ckc` dentro da pasta de um projeto (ex: Python, JavaScript, Rust), o agente não listava arquivos do diretório porque `load_project_context` dependia exclusivamente de `AGENTS.md` e do AST parser de crates Rust. Além disso, as ferramentas `list_skills`/`load_skill` e `symbol_search` apresentavam inconsistência de classificação de permissão (`ReadOnly` vs `Command`), e o arquivo atualmente aberto no editor não era repassado ao agente durante a submissão de mensagens.

## Decisão

1. **Detecção de GPU via SMI**:
   - Adicionada detecção executando `nvidia-smi` e `nvidia-smi.exe` com flags `--query-gpu=gpu_name,memory.total --format=csv,noheader,nounits`.
   - Adicionada função pura `parse_smi_output` para extrair com segurança o modelo e a VRAM em megabytes.
   - Higienização e fallback na exibição do TUI para evitar `GPU: Unknown`.

2. **Menus Dropdown Estilo `microsoft/edit` e Sincronização do Editor**:
   - Adicionado enum `ActiveMenu` com variantes `None`, `File`, `Edit`, `AiAgent`, `Help` e atalhos (`Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+P`, `Alt+M`, etc.).
   - Renderização flutuante `render_menu_dropdown` utilizando `Paragraph` sobreposta com `Clear` e estilização ciano/branco.
   - Navegação por teclado (Setas Cima/Baixo, Enter, Esc, Tab) e suporte a clique do mouse nos itens de menu.
   - Sincronização automática do buffer do editor ao receber `AgentEvent::FileChanged`, permitindo visualização imediata das modificações feitas pelo modelo.
   - Abertura automática do primeiro arquivo de código relevante da pasta ao inicializar o `ckc`.

3. **Consciência de Workspace e Execução de Ferramentas do Agente**:
   - Injeção das seções `### Current Workspace Directory` e `### Workspace Files` no `load_project_context`, garantindo que o agente conheça toda a estrutura de diretórios do projeto antes mesmo de executar ferramentas.
   - Injeção do arquivo atualmente aberto e selecionado no editor no contexto do prompt do usuário (`Active Editor File: <path>\nContent:\n...`).
   - Reclassificação de ferramentas: `symbol_search` tratada em `execute_read_only`; `list_skills` e `load_skill` movidas para execução com governança de permissões.
   - Ajuste na formatação de eventos no chat para padrão visual `[Tool: Read <file>]`, `[Tool: Apply Diff <file>]` e `[Run Tests] -> ✓/✗ <summary>`.

## Consequências

- **Positivas**:
  - GPU detectada com sucesso (ex: `GPU: GTX 1650`) em WSL2 e Linux nativo sem travar ou reportar Unknown.
  - Navegação visual completa e ergonômica com a UX/UI clássica do editor (menubar interativo, explorer, editor e painel copilot).
  - O agente passa a compreender imediatamente a pasta em que foi aberto, sabendo quais arquivos existem e podendo inspecionar e editar código no diretório aberto com precisão.
  - Sincronização transparente entre alterações do modelo em disco e o buffer visual do editor aberto.
