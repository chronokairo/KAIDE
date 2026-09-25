/**
 * Run all test suites sequentially.
 *
 * Usage:
 *   node scripts/test-all.mjs [base_url]
 *
 * Default base URL: http://127.0.0.1:11434
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || 'http://127.0.0.1:11434';

const suites = [
    { name: 'Smoke',    script: 'test-smoke.mjs',    args: [BASE] },
    { name: 'Errors',   script: 'test-errors.mjs',   args: [BASE] },
    { name: 'Chat',     script: 'test-chat.mjs',     args: ['', BASE] },
    { name: 'Generate', script: 'test-generate.mjs', args: ['', BASE] },
    { name: 'Auto',     script: 'test-auto.mjs',     args: [BASE] },
];

let totalPassed = 0;
let totalFailed = 0;

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Antigravity LLM Server — Full Test Suite    ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`Target: ${BASE}\n`);

for (const suite of suites) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  Running: ${suite.name}`);
    console.log(`${'═'.repeat(50)}\n`);

    const scriptPath = join(__dirname, suite.script);
    const argsStr = suite.args.map((a) => `"${a}"`).join(' ');

    try {
        execSync(`node "${scriptPath}" ${argsStr}`, {
            stdio: 'inherit',
            timeout: 120_000, // 2 minutes per suite
        });
        totalPassed++;
    } catch (err) {
        totalFailed++;
        console.error(`\n  Suite "${suite.name}" FAILED\n`);
    }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Final Results: ${totalPassed} suites passed, ${totalFailed} suites failed`);
console.log(`${'═'.repeat(50)}`);

if (totalFailed > 0) process.exit(1);
