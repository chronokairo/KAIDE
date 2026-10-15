const esbuild = require('esbuild');

const common = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    sourcemap: true,
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
};

Promise.all([
    esbuild.build({
        ...common,
        entryPoints: ['src/extension.ts'],
        outfile: 'dist/extension.js',
        external: ['vscode'],
    }),
    // Standalone build of the LS client so `scripts/probe-language-server.mjs`
    // (and future CLI tools) can run without VS Code.
    esbuild.build({
        ...common,
        entryPoints: ['src/antigravityClient.ts'],
        outfile: 'dist/antigravityClient.js',
    }),
]).catch((err) => {
    console.error(err);
    process.exit(1);
});
