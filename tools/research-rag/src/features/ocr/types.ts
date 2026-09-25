export interface OcrRegion {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  text: string;
}

export interface OcrResult {
  content: string;
  regions: OcrRegion[];
  model: string;
  success: boolean;
  error?: string;
}

export interface OcrRequestOptions {
  model?: string;
  timeout?: number;
}

export const DEFAULT_OCR_OPTIONS: OcrRequestOptions = {
  model: 'glm-ocr',
  timeout: 120000,
};
