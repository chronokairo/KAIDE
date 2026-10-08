import { invokeRuntime } from './transport';
import type { FileSearchResponse } from './types';

export const fileSearchClient = {
  searchFiles: async (query: string, roots: string[], limit?: number) =>
    invokeRuntime<FileSearchResponse>('search_files', { query, roots, limit }),
};
