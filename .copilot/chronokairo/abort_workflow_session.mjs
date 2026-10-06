// Scoped lifecycle operation: Python watchdog verifies ownership and deadline first.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
const session = process.argv[2];
if (!/^[a-f0-9-]{36}$/.test(session || '')) throw new Error('Invalid session ID');
const root = homedir() + '/.copilot/run/';
const port = readFileSync(root + 'ws.port', 'utf8').split('\n')[0];
const token = readFileSync(root + 'ws.token', 'utf8').split('\n')[0];
const ws = new WebSocket(`ws://127.0.0.1:${port}/?token=${encodeURIComponent(token)}`);
const timer = setTimeout(() => ws.close(), 5000);
ws.onopen = () => ws.send(JSON.stringify({ type: 'abort_session', session_id: session, request_id: 'ck-watchdog-' + session }));
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === 'error') {
    console.error('App rejected lifecycle request'); process.exitCode = 1; clearTimeout(timer); ws.close();
  }
};
ws.onerror = () => { console.error('App lifecycle connection unavailable'); process.exitCode = 1; clearTimeout(timer); };
