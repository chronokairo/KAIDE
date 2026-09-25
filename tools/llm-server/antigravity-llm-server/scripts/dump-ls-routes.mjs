#!/usr/bin/env node
// Extract route-looking ASCII strings from the LS binary.
import fs from 'node:fs';
const path = 'c:\\Users\\luann\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity\\bin\\language_server_windows_x64.exe';
const buf = fs.readFileSync(path);
console.log('size=', buf.byteLength);
const strings = [];
let cur = [];
for (let i = 0; i < buf.byteLength; i++) {
    const b = buf[i];
    if (b >= 0x20 && b <= 0x7e) {
        cur.push(b);
    } else {
        if (cur.length >= 6) strings.push(Buffer.from(cur).toString('ascii'));
        cur = [];
    }
}
if (cur.length >= 6) strings.push(Buffer.from(cur).toString('ascii'));
console.log('strings=', strings.length);

const routeRe = /^\/[A-Za-z0-9_./:\-]{3,120}$/;
const skipPrefix = /^\/(usr|home|tmp|proc|var|dev|Users|opt|root|etc|System|Library|build|src|vendor|go\/|gopath|google\/src|b\/[0-9]|r|mnt|google|devlake|code\/|.git|etc\/|proc\/|sys\/)/i;
const skipExt = /\.(go|c|h|cc|cpp|py|js|ts|pb\.go|proto|html|css|svg|png|ttf|md)$/i;

const uniq = new Set();
for (const s of strings) {
    if (!routeRe.test(s)) continue;
    if (skipPrefix.test(s)) continue;
    if (skipExt.test(s)) continue;
    // drop things that look like file paths with many slashes & no hyphens/underscores → probably paths
    if ((s.match(/\//g) || []).length > 4 && !/[-_]/.test(s)) continue;
    uniq.add(s);
}
const all = [...uniq].sort();
console.log('routes=', all.length);

// Look especially for interesting ones
const interesting = all.filter((s) =>
    /chat|cascade|complet|model|stream|generate|message|rpc|api|supercomplete|exa\.|language|auth|login|token|fim|ml|inference|embed/i.test(s),
);
console.log('\n### INTERESTING ###');
interesting.forEach((s) => console.log(s));

console.log('\n### ALL (first 400) ###');
all.slice(0, 400).forEach((s) => console.log(s));
