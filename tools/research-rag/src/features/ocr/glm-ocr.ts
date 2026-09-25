import * as fs from 'node:fs';
import * as path from 'node:path';
import type { OcrResult, OcrRegion, OcrRequestOptions } from './types.js';
import { DEFAULT_OCR_OPTIONS } from './types.js';
import { IMAGE_EXTENSIONS } from '../documents/types.js';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
const GLM_OCR_API_URL = process.env.GLM_OCR_API_URL || 'https://open.bigmodel.cn';
const GLM_OCR_MODEL = process.env.GLM_OCR_MODEL || 'glm-ocr';
const GLM_OCR_TIMEOUT = parseInt(process.env.GLM_OCR_TIMEOUT || '120000', 10);

interface ApiRegion {
  bbox_2d?: [number, number, number, number];
  content?: string;
  label?: string;
  native_label?: string;
  confidence?: number;
  index?: number;
}

interface ApiPageDetail {
  height?: number;
  width?: number;
  index?: number;
}

interface GlmOcrApiResponse {
  md_results?: string;
  layout_details?: ApiRegion[][];
  layout_visualization?: string[];
  data_info?: { num_pages?: number; pages?: ApiPageDetail[] };
  model?: string;
  request_id?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: string;
}

export class GlmOcrService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private timeout: number;

  constructor(options: OcrRequestOptions = {}) {
    this.apiKey = ZHIPU_API_KEY;
    this.apiUrl = GLM_OCR_API_URL;
    this.model = options.model || GLM_OCR_MODEL;
    this.timeout = options.timeout || GLM_OCR_TIMEOUT;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private get endpoint(): string {
    return `${this.apiUrl}/api/paas/v4/layout_parsing`;
  }

  private async request(imageData: string): Promise<GlmOcrApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          file: imageData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`GLM-OCR API error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as GlmOcrApiResponse;

      if (data.error) {
        throw new Error(`GLM-OCR error: ${data.error}`);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private mapResult(data: GlmOcrApiResponse): OcrResult {
    const allRegions: ApiRegion[] = (data.layout_details || []).flat();
    const regions: OcrRegion[] = allRegions.map((r) => {
      const bbox = r.bbox_2d
        ? { x: r.bbox_2d[0], y: r.bbox_2d[1], width: r.bbox_2d[2] - r.bbox_2d[0], height: r.bbox_2d[3] - r.bbox_2d[1] }
        : { x: 0, y: 0, width: 0, height: 0 };

      return {
        label: r.native_label || r.label || 'text',
        confidence: r.confidence ?? 1.0,
        bbox,
        text: r.content || '',
      };
    });

    return {
      content: data.md_results || '',
      regions,
      model: data.model || this.model,
      success: true,
    };
  }

  async parseImageUrl(imageUrl: string): Promise<OcrResult> {
    console.log(`[GlmOcr] Parsing image from URL: ${imageUrl.substring(0, 80)}...`);
    const data = await this.request(imageUrl);
    const result = this.mapResult(data);
    console.log(`[GlmOcr] Parsed successfully: ${result.content.length} chars, ${result.regions.length} regions`);
    return result;
  }

  async parseImageBase64(base64: string, mimeType: string = 'image/png'): Promise<OcrResult> {
    const prefix = base64.includes('data:') ? '' : `data:${mimeType};base64,`;
    const dataUri = base64.startsWith('data:') ? base64 : `${prefix}${base64}`;
    console.log(`[GlmOcr] Parsing base64 image...`);
    const data = await this.request(dataUri);
    const result = this.mapResult(data);
    console.log(`[GlmOcr] Parsed successfully: ${result.content.length} chars, ${result.regions.length} regions`);
    return result;
  }

  async parseImageFile(filePath: string): Promise<OcrResult> {
    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Supported: ${Array.from(IMAGE_EXTENSIONS).join(', ')}`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
    };
    const mimeType = mimeMap[ext] || 'image/png';

    console.log(`[GlmOcr] Parsing file: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return this.parseImageBase64(base64, mimeType);
  }

  async parseImageBuffer(buffer: Buffer, ext: string = '.png'): Promise<OcrResult> {
    const base64 = buffer.toString('base64');
    const mimeMap: Record<string, string> = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
      '.tiff': 'image/tiff', '.tif': 'image/tiff',
    };
    const mimeType = mimeMap[ext] || 'image/png';

    console.log(`[GlmOcr] Parsing buffer (${(buffer.length / 1024).toFixed(1)} KB)`);
    return this.parseImageBase64(base64, mimeType);
  }
}

let ocrService: GlmOcrService | null = null;

export function getOcrService(): GlmOcrService {
  if (!ocrService) {
    ocrService = new GlmOcrService();
  }
  return ocrService;
}
