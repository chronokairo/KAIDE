import { Router, Request, Response } from 'express';
import { getOcrService } from './glm-ocr.js';

export const ocrRouter: Router = Router();

/**
 * POST /ocr - Processa uma imagem via GLM-OCR
 * Body: { file: "url" | "base64,..." | "data:;base64,...", filename?: string }
 */
ocrRouter.post('/', async (req: Request, res: Response) => {
  try {
    const service = getOcrService();

    if (!service.isConfigured) {
      return res.status(400).json({
        success: false,
        error: 'GLM-OCR não configurado. Defina ZHIPU_API_KEY no .env',
      });
    }

    const { file, filename } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Campo "file" é obrigatório' });
    }

    const isUrl = file.startsWith('http://') || file.startsWith('https://');
    const isBase64 = file.includes(';base64,') || /^[A-Za-z0-9+/=]+$/.test(file);

    let result;
    if (isUrl) {
      result = await service.parseImageUrl(file);
    } else if (isBase64) {
      result = await service.parseImageBase64(file);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido. Envie uma URL ou base64.',
      });
    }

    res.json({
      success: true,
      data: {
        content: result.content,
        regions: result.regions,
        model: result.model,
        filename: filename || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /ocr/status - Status do serviço OCR
 */
ocrRouter.get('/status', async (_req: Request, res: Response) => {
  const service = getOcrService();

  res.json({
    configured: service.isConfigured,
    model: process.env.GLM_OCR_MODEL || 'glm-ocr',
    apiUrl: process.env.GLM_OCR_API_URL || 'https://api.z.ai',
  });
});
