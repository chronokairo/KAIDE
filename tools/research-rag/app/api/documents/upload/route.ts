import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Diretório para documentos enviados
const UPLOAD_DIR = process.env.OBSIDIAN_VAULT_PATH || path.join(process.cwd(), 'vault');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Garantir que diretório existe
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const savedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const filePath = path.join(UPLOAD_DIR, fileName);

        fs.writeFileSync(filePath, buffer);
        savedFiles.push(fileName);
      } catch (err) {
        console.error(`Erro ao salvar arquivo ${file.name}:`, err);
        errors.push({ file: file.name, error: String(err) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${savedFiles.length} arquivos salvos com sucesso`,
      savedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erro no upload de documentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
