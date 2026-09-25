/**
 * @layer app
 * @description Setup de arquivos estáticos e SPA fallback
 */

import { Application } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento explícito de MIME types
const mimeTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
    '.webp': 'image/webp',
};

function getStaticPath(): string {
    // Tentar /app/dist primeiro (Docker)
    let staticPath = path.resolve('/app/dist');
    if (fs.existsSync(staticPath) && fs.existsSync(path.join(staticPath, 'index.html'))) {
        return staticPath;
    }

    // Tentar relativo ao __dirname
    staticPath = path.resolve(__dirname, '../../dist');
    if (fs.existsSync(staticPath) && fs.existsSync(path.join(staticPath, 'index.html'))) {
        return staticPath;
    }

    // Tentar process.cwd()
    staticPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(staticPath) && fs.existsSync(path.join(staticPath, 'index.html'))) {
        return staticPath;
    }

    console.error('❌ Static path not found!');
    return staticPath;
}

export function setupStaticFiles(app: Application): void {
    const staticPath = getStaticPath();
    const assetsPath = path.join(staticPath, 'assets');

    console.log('📁 Static path:', staticPath);
    console.log('📁 Assets path:', assetsPath);
    console.log('📁 Assets exists:', fs.existsSync(assetsPath));

    if (fs.existsSync(assetsPath)) {
        console.log('📁 Assets contents:', fs.readdirSync(assetsPath));
    }

    // Servir assets com MIME types corretos
    app.use('/assets', (req, res, next) => {
        const filePath = path.join(assetsPath, req.path);
        const ext = path.extname(req.path).toLowerCase();

        // Verificar se arquivo existe
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Asset not found: ${filePath}`);
            return res.status(404).send('Not found');
        }

        // Definir Content-Type correto
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        
        // Cache headers
        if (ext === '.css' || ext === '.js' || ext === '.mjs') {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }

        // Enviar arquivo
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`❌ Error sending file ${filePath}:`, err);
                if (!res.headersSent) {
                    res.status(500).send('Error serving file');
                }
            }
        });
    });

    // Servir index.html na raiz
    app.use(express.static(staticPath, {
        index: 'index.html',
        setHeaders: (res, filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext];
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
        }
    }));

    // SPA fallback - servir index.html para rotas que não são API
    app.get('*', (req, res, next) => {
        // Pular rotas de API
        if (req.path.startsWith('/api')) {
            return next();
        }

        // Pular arquivos estáticos (devem retornar 404 se não existem)
        const ext = path.extname(req.path).toLowerCase();
        if (ext && ext !== '.html') {
            return res.status(404).send('Not found');
        }

        // Servir index.html para SPA routing
        const indexPath = path.join(staticPath, 'index.html');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('❌ Error sending index.html:', err);
                if (!res.headersSent) {
                    res.status(500).send('Error');
                }
            }
        });
    });
}
