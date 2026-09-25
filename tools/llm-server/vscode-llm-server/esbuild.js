const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        outfile: 'dist/extension.js',
        platform: 'node',
        format: 'cjs',
        target: 'node18',
        external: ['vscode'],
        sourcemap: true,
        logLevel: 'info',
        tsconfig: 'tsconfig.json',
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
