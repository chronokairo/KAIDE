---
name: browser-inspection
description: >-
  Guia e procedimentos completos para inspecionar, interagir, capturar screenshots
  e validar visualmente aplicações web no navegador real utilizando o Browser MCP Lite.
---

# 🌐 Browser Inspection Skill (Browser MCP Lite)

Esta skill fornece instruções completas para controlar, inspecionar e testar visualmente aplicações web no navegador real (Google Chrome / Chromium) utilizando a integração **Browser MCP Lite**.

---

## 📡 Arquitetura & Conexão

O servidor MCP roda localmente e se comunica com a extensão de navegador via WebSocket e expõe uma API JSON-RPC 2.0 via HTTP:

* **Endpoint MCP HTTP:** `http://127.0.0.1:12307/mcp`
* **Endpoint WebSocket:** `ws://127.0.0.1:12307/ws`
* **Autenticação:** Bearer Token carregado de `~/.browser-mcp-secrets.json` ou `~/.browser-mcp-secrets.token`.
* **Módulo de Token:** `browser-mcp-lite/server/token.js` (`loadToken()`).

---

## 🛠️ Ferramentas Disponíveis (MCP Tools)

| Ferramenta | Parâmetros | Descrição |
|---|---|---|
| `list_tabs` | `{}` | Lista todas as abas abertas no navegador com seus IDs, títulos e URLs. |
| `focus_tab` | `{ tabId: number }` | Traz a aba especificada para o primeiro plano. |
| `navigate_tab` | `{ tabId: number, url: string }` | Navega a aba para uma URL específica (`http://localhost:8080`, etc.). |
| `reload_tab` | `{ tabId: number, bypassCache?: boolean }` | Recarrega a aba (com opção de limpar cache). |
| `open_tab` | `{ url: string, active?: boolean }` | Abre uma nova aba com a URL fornecida. |
| `screenshot` | `{ tabId?: number }` | Captura uma imagem PNG (Base64) da área visível da aba. |
| `read_page` | `{ tabId?: number }` | Lê a árvore de acessibilidade / DOM semântico com referências de elementos. |
| `click` | `{ tabId?: number, ref?: string, selector?: string }` | Clica em um elemento na página. |
| `type_text` | `{ tabId?: number, text: string, ref?: string, clearFirst?: boolean }` | Digita texto em um campo ou input. |
| `scroll_page` | `{ tabId?: number, direction: 'up'\|'down', amount?: number }` | Rola a página para cima ou para baixo. |
| `inject_script` | `{ tabId?: number, code: string }` | Executa código JavaScript na página e retorna o resultado. |

---

## 📸 Workflow de Inspeção Visual & Screenshots

Para tirar screenshots e verificar layout, renderização de fontes e estados responsivos:

### 1. Script Node.js de Automação Rápida

```javascript
import { loadToken } from './server/token.js';
import fs from 'fs';

async function captureTabScreenshot(targetUrlPart = 'localhost:8080', outputPath = 'screenshot.png') {
  const token = loadToken();
  const URL = 'http://127.0.0.1:12307/mcp';
  let sessionId = null;

  async function post(body) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ' + token,
        ...(sessionId ? { 'mcp-session-id': sessionId } : {})
      },
      body: JSON.stringify(body)
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid) sessionId = sid;
    const raw = await res.text();
    const lines = raw.split('\n').filter(l => l.startsWith('data:'));
    return lines.map(l => { try { return JSON.parse(l.slice(5)); } catch { return null; } }).filter(Boolean);
  }

  // 1. Inicializa sessão MCP
  await post({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agent', version: '1.0' } }
  });
  await post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

  // 2. Lista abas e seleciona a correspondente
  const tabsMsg = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'list_tabs', arguments: {} } });
  const tabs = JSON.parse(tabsMsg.find(m => m.id === 2)?.result?.content?.[0]?.text || '[]');
  const tab = tabs.find(t => t.url.includes(targetUrlPart)) || tabs[0];

  if (!tab) {
    console.error('Aba não encontrada.');
    return;
  }

  // 3. Foca e recarrega
  await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'focus_tab', arguments: { tabId: tab.id } } });
  await post({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'reload_tab', arguments: { tabId: tab.id, bypassCache: true } } });
  await new Promise(r => setTimeout(r, 2000));

  // 4. Captura screenshot
  const shotMsg = await post({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'screenshot', arguments: { tabId: tab.id } } });
  const b64 = shotMsg.find(m => m.id === 5)?.result?.content?.[0]?.data || '';
  
  if (b64) {
    fs.writeFileSync(outputPath, Buffer.from(b64.replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log(`✅ Screenshot salvo em ${outputPath}`);
  }
}
```

---

## 🔍 Leitura do DOM e Acessibilidade (`read_page`)

Para verificar o conteúdo da página, textos renderizados e elementos interativos sem ruído de tags desnecessárias:

```javascript
const readMsg = await post({
  jsonrpc: '2.0',
  id: 6,
  method: 'tools/call',
  params: { name: 'read_page', arguments: { tabId: targetTab.id } }
});

const pageTree = readMsg.find(m => m.id === 6)?.result?.content?.[0]?.text;
console.log('Árvore de Acessibilidade:', pageTree);
```

---

## 🧭 Boas Práticas ao Testar a UI

1. **Evitar Dependências de Runtime que violam CSP:**
   * Evite scripts CDN que usem `eval` (ex: Tailwind Play CDN). Prefira **Vanilla CSS puro** com variáveis e classes semânticas.
2. **Sempre Inspecionar com `view_file`:**
   * Após salvar a imagem de screenshot em disco (ex: `screenshot.png`), use a ferramenta `view_file` para analisar os elementos visuais, contraste, tipografia e alinhamento.
3. **Testar Responsividade:**
   * Use `scroll_page` com `direction: 'down'` e `amount: 800` para capturar seções abaixo da dobra (Hero, Listagens, Rodapé).
4. **Verificar Estado de Rede e Carregamento:**
   * Certifique-se de que endpoints de dados ou stores locais (`localStorage`) foram inicializados antes de capturar screenshots de telas dinâmicas.
