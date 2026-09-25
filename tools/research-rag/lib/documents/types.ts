/**
 * Document processing types and interfaces
 */

export interface Document {
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  source: string;
  relativePath: string;
  title: string;
  folder: string;
  extension: string;
  chunkId?: number;
  chunkStart?: number;
  chunkEnd?: number;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  distance: number | null;
}

export interface VectorStoreStats {
  totalDocuments: number;
  collectionName: string;
  persistDirectory: string;
}

export interface DocumentLoaderOptions {
  mdOnly?: boolean;
  moveProblematic?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
}

export const DEFAULT_LOADER_OPTIONS: DocumentLoaderOptions = {
  mdOnly: false,
  moveProblematic: true,
  chunkSize: 1000,
  chunkOverlap: 200,
};

// Extensões suportadas
export const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.rst', '.tex']);
export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif']);
export const PDF_EXTENSIONS = new Set(['.pdf']);
export const OFFICE_EXTENSIONS = new Set(['.docx', '.doc', '.xlsx', '.xls', '.odt', '.rtf']);
export const WEB_EXTENSIONS = new Set(['.html', '.htm']);
export const MD_ONLY_EXTENSIONS = new Set(['.md', '.txt']);

export const ALL_EXTENSIONS = new Set([
  ...TEXT_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
  ...PDF_EXTENSIONS,
  ...OFFICE_EXTENSIONS,
  ...WEB_EXTENSIONS,
]);
