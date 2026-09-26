---
name: browser-mcp
description: >-
  Guia e procedimentos completos para inspecionar, interagir, capturar screenshots,
  testar rotas e validar visualmente aplicações web no navegador real utilizando o Browser MCP Lite.
---

# 🌐 Browser Inspection Skill (Browser MCP Lite)

Esta skill fornece instruções completas para controlar, inspecionar e testar visualmente aplicações web no navegador real (Google Chrome / Chromium) utilizando a integração **Browser MCP Lite**.

---

## 📡 Arquitetura & Conexão

O servidor MCP roda localmente e se comunica com a extensão de navegador via WebSocket e expõe uma API JSON-RPC 2.0 via HTTP:

* **Endpoint MCP HTTP:** `http://127.0.0.1:12307/mcp`
* **Endpoint WebSocket:** `ws://127.0.0.1:12307/ws`
* **Autenticação:** Bearer Token carregado automaticamente de `~/.browser-mcp-secrets.token` ou `~/.browser-mcp-secrets.json`.

---

## 🛠️ Scripts Rápidos via npm/pnpm

No diretório do projeto MCP (`browser-mcp-lite`):

| Ação | Comando |
| :--- | :--- |
| **Iniciar Servidor MCP** | `pnpm start` *(ou `node server/index.js`)* |
| **Listar abas abertas** | `pnpm tabs` |
| **Ler página atual (DOM/Acessibilidade)** | `pnpm read [tabId]` |
| **Tirar Screenshot** | `pnpm shot [tabId]` |
| **Navegar para URL** | `pnpm nav <url> [tabId]` |
| **Focar aba** | `pnpm focus <tabId>` |
| **Clicar em elemento** | `pnpm click <seletor> [tabId]` |
| **Preencher campo** | `pnpm set <seletor> <valor> [tabId]` |

---

## 🛠️ Ferramentas Disponíveis (MCP Tools)

| Ferramenta | Parâmetros | Descrição |
|---|---|---|
| `list_tabs` | `{}` | Lista todas as abas abertas no navegador com seus IDs, títulos e URLs. |
| `focus_tab` | `{ tabId: number }` | Traz a aba especificada para o primeiro plano. |
| `navigate_tab` | `{ tabId: number, url: string }` | Navega a aba para uma URL específica (`http://localhost:8081`, etc.). |
| `reload_tab` | `{ tabId: number, bypassCache?: boolean }` | Recarrega a aba (com opção de limpar cache). |
| `open_tab` | `{ url: string, active?: boolean }` | Abre uma nova aba com a URL fornecida. |
| `screenshot` | `{ tabId?: number }` | Captura uma imagem PNG (Base64) da área visível da aba. |
| `read_page` | `{ tabId?: number }` | Lê a árvore de acessibilidade / DOM semântico com referências de elementos. |
| `dom_click` | `{ tabId?: number, selector?: string }` | Clica em um elemento na página. |
| `dom_set_value`| `{ tabId?: number, selector: string, value: string }` | Preenche valor em um input. |

---

## 📸 Workflow de Inspeção Visual & Screenshots

Para tirar screenshots e verificar layout, renderização de fontes e estados responsivos:

```bash
# 1. Listar abas abertas
node mcp-cli.mjs list_tabs

# 2. Ler conteúdo estruturado
node mcp-cli.mjs read_page <tabId>

# 3. Capturar screenshot salvo em screenshot.png
node mcp-cli.mjs screenshot <tabId>
```

---

## 🧭 Boas Práticas ao Testar a UI

1. **Sempre Inspecionar com `view_file`:**
   * Após salvar a imagem de screenshot em disco (ex: `screenshot.png`), use a ferramenta `view_file` para analisar os elementos visuais, contraste, tipografia e alinhamento.
2. **Validar fluxos de ponta a ponta:**
   * Teste transições de tela e rotas via `navigate_tab` e validação com `read_page`.
