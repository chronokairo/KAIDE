/**
 * ContentExtractor — inspirado no Vane Scraper + UploadManager
 *
 * Extrai texto de diferentes tipos de fonte:
 * - PDF via pdf-parse
 * - TXT / CSV via leitura direta
 * - DOCX via officeparser (fallback silencioso)
 * - URLs via fetch + Mozilla Readability
 */

export interface ExtractedContent {
  text: string;
  title: string;
  method: 'pdfparse' | 'text' | 'csv' | 'html' | 'unknown';
}

/* ─── PDF ────────────────────────────────────────────────────── */
export async function extractPDF(buffer: ArrayBuffer): Promise<ExtractedContent> {
  const { PDFParse } = require('pdf-parse') as {
    PDFParse: new (opts: { data: Uint8Array }) => { getText(): Promise<{ text: string }> };
  };
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const { text } = await parser.getText();
  return {
    text,
    title: '',
    method: 'pdfparse',
  };
}

/* ─── TXT / CSV ──────────────────────────────────────────────── */
export function extractText(content: string, type: 'text' | 'csv'): ExtractedContent {
  const lines = content.split('\n');
  const title = lines[0]?.replace(/^[\s#*]+|[\s#*]+$/g, '').slice(0, 80) || 'Texto';
  return { text: content, title, method: type };
}

/* ─── Resolve Google News RSS redirects ──────────────────────── */
async function resolveGoogleNewsURL(url: string): Promise<string> {
  if (!url.includes('news.google.com')) return url;

  try {
    // Google News RSS articles use a redirect — follow it to get the real URL
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10_000),
    });
    // After redirect follow, the response URL is the real article
    if (res.url && res.url !== url && !res.url.includes('news.google.com')) {
      return res.url;
    }
    // Sometimes HEAD doesn't redirect — try GET and check response URL
    const getRes = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (getRes.url && !getRes.url.includes('news.google.com')) {
      return getRes.url;
    }
  } catch {
    // Fallback: return original URL
  }
  return url;
}

/* ─── Web (fetch + readability) ──────────────────────────────── */
export async function extractURL(url: string): Promise<ExtractedContent> {
  // Resolve Google News RSS redirect to real article URL
  const resolved = await resolveGoogleNewsURL(url);

  const res = await fetch(resolved, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ao acessar ${resolved}`);

  const html = await res.text();

  // Extrai título via regex simples
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;

  // Extrai texto do HTML (remoção básica de tags)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return { text, title, method: 'html' };
}

/* ─── Detector ────────────────────────────────────────────────── */
export function detectFileType(
  fileName: string,
  mimeType?: string,
): 'pdf' | 'csv' | 'text' | 'docx' | 'unknown' {
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.txt')) return 'text';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  if (mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'text/csv') return 'csv';
    if (mimeType === 'text/plain') return 'text';
  }
  return 'unknown';
}
