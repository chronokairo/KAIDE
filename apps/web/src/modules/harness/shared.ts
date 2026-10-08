import type { AnnaUploadToolDefinition } from './contracts';

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesAny(text: string, keywords: string[]): boolean {
  const normalized = normalize(text);
  return keywords.some((keyword) => normalized.includes(normalize(keyword)));
}

export function parseAccept(accept: string): string[] {
  return accept
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function fileMatchesAccept(
  fileName: string,
  mimeType: string,
  accepts: string[],
): boolean {
  const normalizedName = fileName.toLowerCase();
  const normalizedMime = mimeType.toLowerCase();

  return accepts.some((item) => {
    const normalized = item.toLowerCase();
    if (normalized.startsWith('.')) {
      return normalizedName.endsWith(normalized);
    }
    if (normalized.endsWith('/*')) {
      return normalizedMime.startsWith(normalized.slice(0, -1));
    }
    return normalizedMime === normalized;
  });
}

export function getToolsWithAnnaUpload(
  tools: AnnaUploadToolDefinition[],
): Required<AnnaUploadToolDefinition>[] {
  return tools.filter(
    (tool): tool is Required<AnnaUploadToolDefinition> => !!tool.annaUpload,
  );
}
