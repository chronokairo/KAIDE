import { NextResponse } from 'next/server';
import { getOcrService } from '@/lib/ocr/glm-ocr';

export async function GET() {
  const service = getOcrService();

  return NextResponse.json({
    configured: service.isConfigured,
    model: process.env.GLM_OCR_MODEL || 'glm-ocr',
    apiUrl: process.env.GLM_OCR_API_URL || 'https://api.z.ai',
  });
}
