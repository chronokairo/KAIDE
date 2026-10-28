const fs = require('fs');
const path = require('path');
const { store } = require('../storage/chronokairo-store');

/**
 * slide-renderer.js — Compilador Visual de Carrosseis Dark AI (1080x1080)
 * Converte roteiros em JSON para lâminas gráficas prontas para o Instagram.
 */

class SlideRenderer {
  constructor(customStore = store) {
    this.store = customStore;
  }

  escapeXml(unsafe) {
    return String(unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  generateSlideSvg({ slideNumber, totalSlides = 7, type, tag, title, body, cta, brandName = 'Chronokairo' }) {
    const isCover = slideNumber === 1;
    const isCta = slideNumber === totalSlides;

    let contentArea = '';

    if (isCover) {
      contentArea = `
        <!-- Capa Boardroom Grade (Pantone Black & White) -->
        <rect x="80" y="240" width="920" height="580" rx="16" fill="#121214" stroke="#2E2E34" stroke-width="1.5" />
        
        <rect x="120" y="280" width="240" height="34" rx="4" fill="#FFFFFF" />
        <text x="240" y="303" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800" fill="#0B0B0B" text-anchor="middle" letter-spacing="2">RELATÓRIO CONFIDENCIAL</text>
        
        <foreignObject x="120" y="350" width="840" height="320">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Neue Haas Grotesk', sans-serif; font-weight: 800; font-size: 46px; line-height: 1.2; letter-spacing: -0.02em;">
            ${this.escapeXml(title || body)}
          </div>
        </foreignObject>

        <rect x="120" y="710" width="840" height="64" rx="8" fill="#18181B" stroke="#3F3F46" stroke-width="1" />
        <text x="540" y="750" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">
          ${this.escapeXml(cta || 'ARRASTE PARA O LADO ➔')}
        </text>
      `;
    } else if (isCta) {
      contentArea = `
        <!-- CTA Final Boardroom Grade -->
        <rect x="80" y="220" width="920" height="620" rx="16" fill="#121214" stroke="#3F3F46" stroke-width="1.5" />
        
        <rect x="120" y="270" width="160" height="32" rx="4" fill="#E0E2E4" />
        <text x="200" y="292" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="800" fill="#0B0B0B" text-anchor="middle" letter-spacing="2">PASSO FINAL</text>

        <foreignObject x="120" y="330" width="840" height="190">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Neue Haas Grotesk', sans-serif; font-weight: 800; font-size: 44px; line-height: 1.2; letter-spacing: -0.02em;">
            ${this.escapeXml(title)}
          </div>
        </foreignObject>

        <rect x="120" y="550" width="840" height="150" rx="10" fill="#18181B" stroke="#2E2E34" stroke-width="1" />
        <foreignObject x="150" y="575" width="780" height="100">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #8A8D8F; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 24px; line-height: 1.5;">
            ${this.escapeXml(body)}
          </div>
        </foreignObject>

        <rect x="220" y="740" width="640" height="64" rx="8" fill="#FFFFFF" />
        <text x="540" y="780" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="900" fill="#0B0B0B" text-anchor="middle" letter-spacing="2">
          ${this.escapeXml(cta || 'COMENTE NO POST')}
        </text>
      `;
    } else {
      contentArea = `
        <!-- Lâmina Estrutural Black & White -->
        <rect x="80" y="220" width="920" height="620" rx="16" fill="#121214" stroke="#2E2E34" stroke-width="1.5" />
        
        <rect x="120" y="270" width="220" height="32" rx="4" fill="#18181B" stroke="#8A8D8F" stroke-width="1" />
        <text x="230" y="292" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#E0E2E4" text-anchor="middle" letter-spacing="2">
          ${this.escapeXml(tag || 'ESTRATÉGIA')}
        </text>

        <foreignObject x="120" y="330" width="840" height="130">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Neue Haas Grotesk', sans-serif; font-weight: 800; font-size: 38px; line-height: 1.25; letter-spacing: -0.01em;">
            ${this.escapeXml(title)}
          </div>
        </foreignObject>

        <line x1="120" y1="480" x2="960" y2="480" stroke="#2E2E34" stroke-width="1" />

        <foreignObject x="120" y="510" width="840" height="290">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #8A8D8F; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 26px; line-height: 1.6; font-weight: 400;">
            ${this.escapeXml(body)}
          </div>
        </foreignObject>
      `;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo Pantone Black 6 C -->
  <rect width="1080" height="1080" fill="#0B0B0B"/>

  <!-- Top Bar / Header -->
  <rect x="80" y="80" width="920" height="80" fill="none" />
  <text x="80" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" letter-spacing="2">
    ${this.escapeXml(brandName.toUpperCase())}
  </text>
  <text x="1000" y="130" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="600" fill="#8A8D8F" text-anchor="end" letter-spacing="2">
    ${String(slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}
  </text>
  <line x1="80" y1="160" x2="1000" y2="160" stroke="#2E2E34" stroke-width="1"/>

  <!-- Área Central Dinâmica -->
  ${contentArea}

  <!-- Footer -->
  <line x1="80" y1="940" x2="1000" y2="940" stroke="#2E2E34" stroke-width="1"/>
  <text x="80" y="990" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="15" font-weight="500" fill="#8A8D8F">
    Boutique de Engenharia de Software &amp; Inteligência Aplicada
  </text>
  <text x="1000" y="990" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="end">
    chronokairo.com.br
  </text>
</svg>`;
  }

  async renderCarousel({ script, outputDir = null, slug = null, brandId = 'chronokairo', daemonClient = null }) {
    const brand = this.store.getBrand(brandId) || { name: 'Chronokairo' };
    const folderSlug = slug || `carousel_${Date.now()}`;
    const targetDir = outputDir ? path.resolve(outputDir) : path.join(this.store.paths.renderedSlides, folderSlug);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const slidesMeta = [];
    const keys = Object.keys(script).filter(k => k.startsWith('slide_') || !isNaN(k));
    const total = keys.length || 7;

    for (let i = 1; i <= total; i++) {
      const slideKey = `slide_${i}`;
      const slideData = script[slideKey] || script[i] || {};
      const slideNum = i;

      const svg = this.generateSlideSvg({
        slideNumber: slideNum,
        totalSlides: total,
        type: slideData.tipo || '',
        tag: slideData.tag || 'DIAGNÓSTICO',
        title: slideData.headline || slideData.titulo || `Lâmina ${slideNum}`,
        body: slideData.corpo || slideData.instrucao || '',
        cta: slideData.cta_subtexto || (slideData.palavra_chave ? `COMENTE ${slideData.palavra_chave}` : 'ARRASTE ➔'),
        brandName: brand.name
      });

      const svgFileName = `slide_${String(slideNum).padStart(2, '0')}.svg`;
      const svgFilePath = path.join(targetDir, svgFileName);
      fs.writeFileSync(svgFilePath, svg, 'utf-8');

      slidesMeta.push({
        slideNumber: slideNum,
        svgFile: svgFilePath,
        relativeSvg: path.relative(process.cwd(), svgFilePath),
        title: slideData.headline || slideData.titulo || `Slide ${slideNum}`
      });
    }

    // Cria preview HTML para visualização imediata
    const htmlPreview = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Carrossel Dark AI - ${folderSlug}</title>
  <style>
    body { background: #07070a; color: #fff; font-family: system-ui; display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
    h1 { color: #00ffff; margin-bottom: 20px; }
    .grid { display: flex; flex-wrap: wrap; gap: 30px; justify-content: center; max-width: 1300px; }
    .slide-card { background: #111; border: 1px solid #333; border-radius: 12px; overflow: hidden; width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .slide-card img { width: 100%; height: auto; display: block; }
    .slide-card h3 { padding: 10px 16px; margin: 0; font-size: 14px; color: #aaa; }
  </style>
</head>
<body>
  <h1>Carrossel 1080x1080 Dark AI (${total} Lâminas)</h1>
  <div class="grid">
    ${slidesMeta.map(s => `
      <div class="slide-card">
        <img src="${path.basename(s.svgFile)}" alt="Slide ${s.slideNumber}">
        <h3>Slide ${s.slideNumber}: ${s.title}</h3>
      </div>
    `).join('\n')}
  </div>
</body>
</html>`;

    const htmlPath = path.join(targetDir, 'index.html');
    fs.writeFileSync(htmlPath, htmlPreview, 'utf-8');

    return {
      success: true,
      folderSlug,
      targetDir,
      totalSlides: slidesMeta.length,
      htmlPreview: htmlPath,
      slides: slidesMeta
    };
  }
}

const slideRenderer = new SlideRenderer();

module.exports = {
  SlideRenderer,
  slideRenderer
};
