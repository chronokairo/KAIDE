import { NextRequest, NextResponse } from 'next/server';
import { getOcrService } from '@/lib/ocr/glm-ocr';

export async function POST(request: NextRequest) {
  try {
    const service = getOcrService();

    if (!service.isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'GLM-OCR não configurado. Defina ZHIPU_API_KEY no .env',
      }, { status: 400 });
    }

    const { file, filename } = await request.json();

    if (!file) {
      return NextResponse.json({ success: false, error: 'Campo "file" é obrigatório' }, { status: 400 });
    }

    const isUrl = file.startsWith('http://') || file.startsWith('https://');
    const isBase64 = file.includes(';base64,') || /^[A-Za-z0-9+/=]+$/.test(file);

    let result;
    if (isUrl) {
      result = await service.parseImageUrl(file);
    } else if (isBase64) {
      result = await service.parseImageBase64(file);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Formato inválido. Envie uma URL ou base64.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        regions: result.regions,
        model: result.model,
        filename: filename || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
