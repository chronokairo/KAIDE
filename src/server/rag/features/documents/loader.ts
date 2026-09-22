/**
 * @layer features/documents
 * @description Carregador de documentos do Obsidian
 * Processa arquivos markdown, texto, PDF, Office e HTML
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Document, DocumentMetadata, DocumentLoaderOptions } from './types.js';
import { 
  DEFAULT_LOADER_OPTIONS, 
  TEXT_EXTENSIONS, 
  MD_ONLY_EXTENSIONS,
  ALL_EXTENSIONS,
} from './types.js';

// Configurações
const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || './vault';
const IGNORE_FOLDERS = ['.git', 'node_modules', '.obsidian', 'problematicos'];

export class DocumentLoader {
  private vaultPath: string;
  private options: DocumentLoaderOptions;
  private problematicFolder: string;

  constructor(
    vaultPath: string = OBSIDIAN_VAULT_PATH,
    options: DocumentLoaderOptions = {}
  ) {
    this.vaultPath = vaultPath;
    this.options = { ...DEFAULT_LOADER_OPTIONS, ...options };
    this.problematicFolder = path.join(vaultPath, 'problematicos');
  }

  /**
   * Verifica se o caminho deve ser ignorado
   */
  private shouldIgnorePath(filePath: string): boolean {
    const parts = filePath.split(path.sep);
    return parts.some((part) => IGNORE_FOLDERS.includes(part));
  }

  /**
   * Obtém todos os arquivos válidos da vault
   */
  *getAllFiles(): Generator<string> {
    const extensions = this.options.mdOnly ? MD_ONLY_EXTENSIONS : ALL_EXTENSIONS;

    const walkDir = (dir: string): string[] => {
      const files: string[] = [];

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!IGNORE_FOLDERS.includes(entry.name)) {
              files.push(...walkDir(fullPath));
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.has(ext) && !this.shouldIgnorePath(fullPath)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Ignora erros de leitura
      }

      return files;
    };

    for (const file of walkDir(this.vaultPath)) {
      yield file;
    }
  }

  /**
   * Lê um arquivo de texto
   */
  private readTextFile(filePath: string): string {
    const encodings: BufferEncoding[] = ['utf-8', 'latin1'];

    for (const encoding of encodings) {
      try {
        const content = fs.readFileSync(filePath, { encoding });

        // Para JSON, formatar de forma legível
        if (path.extname(filePath).toLowerCase() === '.json') {
          try {
            const data = JSON.parse(content);
            return JSON.stringify(data, null, 2);
          } catch {
            // Retorna conteúdo original se não for JSON válido
          }
        }

        return content;
      } catch {
        continue;
      }
    }

    return '';
  }

  /**
   * Lê um documento e retorna seu conteúdo com metadados
   */
  readDocument(filePath: string): Document | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const extension = path.extname(filePath).toLowerCase();
      let content = '';

      // Arquivos de texto simples
      if (TEXT_EXTENSIONS.has(extension)) {
        content = this.readTextFile(filePath);
      }

      // TODO: Adicionar suporte para PDF, Office, HTML
      // usando bibliotecas Node.js apropriadas

      if (!content?.trim()) {
        return null;
      }

      // Extrair título (primeira linha H1 ou nome do arquivo)
      let title = path.basename(filePath, extension);
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.slice(2).trim();
          break;
        }
      }

      // Criar metadados
      const relativePath = path.relative(this.vaultPath, filePath);
      const metadata: DocumentMetadata = {
        source: filePath,
        relativePath,
        title,
        folder: path.dirname(relativePath),
        extension,
      };

      return { content, metadata };
    } catch {
      return null;
    }
  }

  /**
   * Divide um documento em chunks menores com overlap
   */
  splitIntoChunks(document: Document): Document[] {
    const { content, metadata } = document;
    const chunkSize = this.options.chunkSize!;
    const chunkOverlap = this.options.chunkOverlap!;

    // Se o conteúdo é pequeno, retorna como está
    if (content.length <= chunkSize) {
      return [document];
    }

    const chunks: Document[] = [];
    let start = 0;
    let chunkId = 0;

    while (start < content.length) {
      let end = start + chunkSize;

      // Tenta encontrar um ponto de quebra natural
      if (end < content.length) {
        // Procura por quebra de parágrafo
        let breakPoint = content.lastIndexOf('\n\n', end);
        if (breakPoint > start + chunkSize / 2) {
          end = breakPoint;
        } else {
          // Procura por quebra de linha
          breakPoint = content.lastIndexOf('\n', end);
          if (breakPoint > start + chunkSize / 2) {
            end = breakPoint;
          } else {
            // Procura por espaço
            breakPoint = content.lastIndexOf(' ', end);
            if (breakPoint > start + chunkSize / 2) {
              end = breakPoint;
            }
          }
        }
      }

      const chunkContent = content.slice(start, end).trim();

      if (chunkContent) {
        chunks.push({
          content: chunkContent,
          metadata: {
            ...metadata,
            chunkId,
            chunkStart: start,
            chunkEnd: end,
          },
        });
        chunkId++;
      }

      // Move o início considerando o overlap
      start = end < content.length ? end - chunkOverlap : end;
    }

    return chunks;
  }

  /**
   * Move arquivo problemático para pasta separada
   */
  private moveToProblematic(filePath: string, error: string): void {
    try {
      const relativePath = path.relative(this.vaultPath, filePath);
      const destPath = path.join(this.problematicFolder, relativePath);
      const destDir = path.dirname(destPath);

      fs.mkdirSync(destDir, { recursive: true });

      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, destPath);

        // Salvar log do erro
        const logFile = destPath + '.error.txt';
        fs.writeFileSync(logFile, `Arquivo: ${filePath}\nErro: ${error}\n`);
      }
    } catch {
      // Ignora erros ao mover
    }
  }

  /**
   * Carrega todos os documentos da vault e divide em chunks
   */
  loadAllDocuments(): Document[] {
    const files = Array.from(this.getAllFiles());
    const allChunks: Document[] = [];

    console.log(`[DocumentLoader] Encontrados ${files.length} arquivos`);

    for (const filePath of files) {
      try {
        const doc = this.readDocument(filePath);

        if (doc?.content?.trim()) {
          const chunks = this.splitIntoChunks(doc);
          allChunks.push(...chunks);
        } else if (this.options.moveProblematic) {
          this.moveToProblematic(filePath, 'Arquivo não produziu conteúdo extraível');
        }
      } catch (error) {
        if (this.options.moveProblematic) {
          this.moveToProblematic(filePath, String(error));
        }
      }
    }

    console.log(`[DocumentLoader] ${allChunks.length} chunks criados`);
    return allChunks;
  }
}

/**
 * Factory function para criar DocumentLoader
 */
export function createDocumentLoader(
  vaultPath?: string,
  options?: DocumentLoaderOptions
): DocumentLoader {
  return new DocumentLoader(vaultPath, options);
}
