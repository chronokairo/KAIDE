#!/usr/bin/env node
// Extract ALL routes/handlers and relevant message field names from the LS binary.
import fs from 'node:fs';
const path = 'c:\\Users\\luann\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity\\bin\\language_server_windows_x64.exe';
const buf = fs.readFileSync(path);
const strings = [];
let cur = [];
for (let i = 0; i < buf.byteLength; i++) {
    const b = buf[i];
    if (b >= 0x20 && b <= 0x7e) cur.push(b);
    else { if (cur.length >= 4) strings.push(Buffer.from(cur).toString('ascii')); cur = []; }
}
if (cur.length >= 5) strings.push(Buffer.from(cur).toString('ascii'));

const arg = process.argv[2] ?? 'handlers';

if (arg === 'handlers') {
    const handlers = new Set();
    const re = /_LanguageServerService_([A-Za-z0-9]+)_Handler/g;
    for (const s of strings) {
        let m;
        while ((m = re.exec(s)) !== null) handlers.add(m[1]);
    }
    const sorted = [...handlers].sort();
    console.log(`# ${sorted.length} LanguageServerService handlers`);
    sorted.forEach((h) => console.log(h));
} else if (arg === 'msgs') {
    // All proto message paths like /.exa.language_server_pb.<Name>Request
    const msgs = [...new Set(strings.filter((s) =>
        /^\/\.exa\.[a-z_]+_pb\.[A-Za-z0-9]+Request$/.test(s)
    ))].sort();
    console.log(`# ${msgs.length} request messages`);
    msgs.forEach((h) => console.log(h));
} else if (arg === 'fields') {
    const want = process.argv[3] ?? 'SendAgentMessage';
    // Look for the message name followed by lowercase field names nearby
    const idx = strings.findIndex((s) => s.includes(`${want}Request`));
    if (idx < 0) { console.log('not found'); process.exit(1); }
    console.log('near', strings[idx]);
    console.log('--- surrounding strings ---');
    for (let i = Math.max(0, idx-5); i < Math.min(strings.length, idx+60); i++) {
        console.log(`${i}: ${strings[i].slice(0, 120)}`);
    }
}
