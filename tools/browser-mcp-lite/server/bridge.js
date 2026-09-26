// Bridge entre o servidor MCP e a extensao Chrome (WebSocket).
// Isolado para que ferramentas possam ser importadas sem iniciar o servidor.

let extensionWs = null;
const pendingRequests = new Map();
let requestCounter = 0;

export function sendToExtension(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!extensionWs || extensionWs.readyState !== 1) {
      reject(new Error('Chrome Extension not connected. Open Chrome and click Connect.'));
      return;
    }
    const id = ++requestCounter;
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Extension request timed out (${method})`));
    }, 30000);
    pendingRequests.set(id, { resolve, reject, timer });
    extensionWs.send(JSON.stringify({ id, method, params }));
  });
}

export function setExtensionSocket(socket) {
  extensionWs = socket;
}

export function getExtensionSocket() {
  return extensionWs;
}

export function getExtensionConnected() {
  return extensionWs?.readyState === 1;
}

export function resolvePendingRequest(id, result, error) {
  const pending = pendingRequests.get(id);
  if (!pending) return;
  clearTimeout(pending.timer);
  pendingRequests.delete(id);
  if (error) pending.reject(new Error(error));
  else pending.resolve(result);
}

export function failAllPending(reason) {
  for (const [id, pending] of pendingRequests) {
    clearTimeout(pending.timer);
    pending.reject(new Error(reason));
    pendingRequests.delete(id);
  }
}
