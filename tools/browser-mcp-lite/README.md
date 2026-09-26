# mcp-browser (Browser MCP Lite)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjMiLz48cGF0aCBkPSJNOCA4aDgiLz48cGF0aCBkPSJNOCAxMmg4Ii8+PHBhdGggZD0iTTggMTZoNSIvPjwvc3ZnPg==)](https://modelcontextprotocol.io)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Repository: chronokairo/mcp-browser](https://img.shields.io/badge/GitHub-chronokairo%2Fmcp--browser-181717?logo=github)](https://github.com/chronokairo/mcp-browser)

> **[Português](#-português)** | **[English](#-english)**

---

# 🇧🇷 Português

**Dê olhos e controle do seu navegador real para assistentes de IA (Gemini, Claude, Antigravity, Cursor) — com suas sessões e logins intactos.**

Um servidor [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) minimalista, ultra-leve e seguro por token que permite que IAs leiam páginas web, capturem screenshots, naveguem em rotas e interajam com o DOM diretamente no seu Google Chrome em tempo real.

```
AI Assistant ──HTTP POST──▶ MCP Server (:12307) ──WebSocket──▶ Chrome Extension ──▶ DOM
                            (Bearer Auth)          (ws://)       (Permissões mínimas)
```

---

## 🚀 Funcionalidades

- **Acesso ao Navegador Real**: Inspeciona abas ativas preservando cookies, logins e sessão do desenvolvedor.
- **Árvore de Acessibilidade (`read_page`)**: Converte o DOM em texto estruturado e sem ruído de tags, economizando tokens.
- **Captura Visual (`screenshot`)**: Tira prints em PNG da visualização ativa para validação de layout e design.
- **Automação de Ações (`click`, `set`, `nav`)**: Navega entre URLs, clica em botões e preenche formulários.
- **Autenticação Automática**: Token de segurança gerado em `~/.browser-mcp-secrets.token` e carregado automaticamente pelo CLI.
- **Skill Integrada**: Acompanha arquivo [`SKILL.md`](./SKILL.md) pronto para Antigravity / Gemini CLI.

---

## 📦 Instalação e Inicialização

### 1. Instalar dependências
```bash
git clone https://github.com/chronokairo/mcp-browser.git
cd mcp-browser
npm install
```

### 2. Carregar a Extensão no Chrome
1. Abra o Chrome e acesse `chrome://extensions/`.
2. Ative o **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação** e selecione a pasta `extension/`.

### 3. Iniciar o Servidor MCP
```bash
npm start
# Servidor ouvindo em http://127.0.0.1:12307/mcp e WebSocket na porta 12307
```

---

## 🛠️ Comandos Rápidos via CLI

| Ação | Comando | Descrição |
| :--- | :--- | :--- |
| **Listar abas** | `npm run tabs` | Lista todas as abas abertas com ID, título e URL |
| **Ler página** | `npm run read [tabId]` | Extrai a árvore de acessibilidade da aba |
| **Screenshot** | `npm run shot [tabId]` | Salva print da aba em `screenshot.png` |
| **Navegar** | `npm run nav <url> [tabId]` | Navega para uma URL específica |
| **Focar aba** | `npm run focus <tabId>` | Traz a aba para primeiro plano |
| **Clicar** | `npm run click <seletor> [tabId]` | Executa clique em um elemento |
| **Preencher campo** | `npm run set <seletor> <valor> [tabId]` | Preenche valor em um input |

---

## 🤖 Integração com Assistentes de IA

### Configuração no MCP (`mcp_config.json` ou Gemini/Claude/Cursor)
```json
{
  "mcpServers": {
    "browser": {
      "url": "http://127.0.0.1:12307/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN_AQUI"
      }
    }
  }
}
```
*(O token pode ser encontrado em `~/.browser-mcp-secrets.token`)*

---
---

# 🇺🇸 English

**Give your AI assistant eyes and control into your real browser — keeping your existing login sessions intact.**

A minimal, ultra-fast and auth-secured [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants read web pages, capture screenshots, navigate routes, and interact with the DOM directly in your real Google Chrome browser.

```
AI Assistant ──HTTP POST──▶ MCP Server (:12307) ──WebSocket──▶ Chrome Extension ──▶ DOM
                            (Bearer Auth)          (ws://)       (Minimal permissions)
```

---

## 🚀 Features

- **Real Browser Access**: Inspects active tabs preserving cookies, developer logins, and local state.
- **Accessibility Tree (`read_page`)**: Converts DOM to structured, token-efficient text representation.
- **Visual Capture (`screenshot`)**: Captures PNG screenshots of the visible tab area for design verification.
- **DOM Automation (`click`, `set`, `nav`)**: Navigates URLs, clicks elements, and fills input fields.
- **Automatic Token Auth**: Security token generated in `~/.browser-mcp-secrets.token` and auto-loaded by the CLI.
- **Ready-to-use Skill**: Includes [`SKILL.md`](./SKILL.md) for Antigravity / Gemini CLI agents.

---

## 📦 Installation & Setup

### 1. Install dependencies
```bash
git clone https://github.com/chronokairo/mcp-browser.git
cd mcp-browser
npm install
```

### 2. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the `extension/` folder.

### 3. Start the MCP Server
```bash
npm start
# Server running at http://127.0.0.1:12307/mcp and WebSocket at port 12307
```

---

## 🛠️ Quick CLI Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **List tabs** | `npm run tabs` | Lists open tabs with ID, title, and URL |
| **Read page** | `npm run read [tabId]` | Extracts the semantic accessibility tree |
| **Screenshot** | `npm run shot [tabId]` | Saves screenshot to `screenshot.png` |
| **Navigate** | `npm run nav <url> [tabId]` | Navigates tab to a given URL |
| **Focus tab** | `npm run focus <tabId>` | Focuses the tab window |
| **Click** | `npm run click <selector> [tabId]` | Clicks the specified element |
| **Fill input** | `npm run set <selector> <value> [tabId]` | Sets input field value |

---

## 🤖 AI Assistant Configuration

### MCP Client Config (`mcp_config.json` for Gemini / Claude / Cursor)
```json
{
  "mcpServers": {
    "browser": {
      "url": "http://127.0.0.1:12307/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```
*(Find your token in `~/.browser-mcp-secrets.token`)*

---

## 📄 License
MIT License © [chronokairo](https://github.com/chronokairo)
