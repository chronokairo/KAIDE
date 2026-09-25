import type { AnnaTranscriptDefaults, AnnaUploadToolDefinition } from '../../contracts';
import { fileMatchesAccept, getToolsWithAnnaUpload, matchesAny, parseAccept } from '../../shared';

export type AnnaIntent = 'transcript' | 'batch-import' | 'chat';

export interface AnnaRouteResult {
  intent: AnnaIntent;
  describe: string;
  endpoint?: string;
  buildBody?: (file: File, base64: string, message: string) => Record<string, unknown>;
}

interface AnnaUploadRouteConfig {
  toolName: string;
  intent: Extract<AnnaIntent, 'transcript' | 'batch-import'>;
  endpoint: string;
  describe: string;
  keywords: string[];
  accepts: string[];
  matchesFile: (file: File) => boolean;
  buildBody: (file: File, base64: string, message: string) => Record<string, unknown>;
}

const DEFAULT_TRANSCRIPT_PROGRAM_ID = 'PROG-001';
const DEFAULT_TRANSCRIPT_ENTRY_TYPE = 'DIPLOMA_HOLDER';

function buildUploadRoutes(
  tools: AnnaUploadToolDefinition[],
  transcriptDefaults: AnnaTranscriptDefaults,
): AnnaUploadRouteConfig[] {
  return getToolsWithAnnaUpload(tools)
    .map((tool): AnnaUploadRouteConfig | null => {
      const accepts = parseAccept(tool.annaUpload.accept);

      switch (tool.name) {
        case 'edu_transcript_intake':
          return {
            toolName: tool.name,
            intent: 'transcript',
            endpoint: '/transcript/auto-enroll',
            describe: tool.annaUpload.describe,
            keywords: tool.annaUpload.intentKeywords,
            accepts,
            matchesFile: (file: File) => fileMatchesAccept(file.name, file.type, accepts),
            buildBody: (_file: File, base64: string) => ({
              base64,
              programId: transcriptDefaults.programId ?? DEFAULT_TRANSCRIPT_PROGRAM_ID,
              entryType: transcriptDefaults.entryType ?? DEFAULT_TRANSCRIPT_ENTRY_TYPE,
            }),
          };
        case 'edu_batch_import_candidates':
          return {
            toolName: tool.name,
            intent: 'batch-import',
            endpoint: '/new-student/selection-process/batch-import/csv',
            describe: tool.annaUpload.describe,
            keywords: tool.annaUpload.intentKeywords,
            accepts,
            matchesFile: (file: File) => fileMatchesAccept(file.name, file.type, accepts),
            buildBody: (csvFile: File) => ({
              _fileRef: csvFile,
              skipDuplicates: true,
            }),
          };
        default:
          return null;
      }
    })
    .filter((route): route is AnnaUploadRouteConfig => route !== null);
}

export function createAnnaFrontendRouter(
  tools: AnnaUploadToolDefinition[],
  transcriptDefaults: AnnaTranscriptDefaults = {},
) {
  const uploadRoutes = buildUploadRoutes(tools, transcriptDefaults);
  const transcriptRoute = uploadRoutes.find((route) => route.intent === 'transcript');
  const batchImportRoute = uploadRoutes.find((route) => route.intent === 'batch-import');
  const accept = Array.from(new Set(uploadRoutes.flatMap((route) => route.accepts))).join(',');

  function routeIntent(message: string, file: File | null): AnnaRouteResult {
    if (!file) {
      return { intent: 'chat', describe: '' };
    }

    const transcriptMatches = !!transcriptRoute?.matchesFile(file);
    const batchMatches = !!batchImportRoute?.matchesFile(file);

    if (transcriptMatches && transcriptRoute) {
      if (
        message &&
        !matchesAny(message, transcriptRoute.keywords) &&
        batchImportRoute &&
        matchesAny(message, batchImportRoute.keywords)
      ) {
        return {
          intent: 'chat',
          describe: 'Esse arquivo PDF não parece ser um histórico. Tente enviar um CSV para importação em lote.',
        };
      }

      return {
        intent: transcriptRoute.intent,
        describe: transcriptRoute.describe,
        endpoint: transcriptRoute.endpoint,
        buildBody: transcriptRoute.buildBody,
      };
    }

    if (batchMatches && batchImportRoute) {
      return {
        intent: batchImportRoute.intent,
        describe: batchImportRoute.describe,
        endpoint: batchImportRoute.endpoint,
        buildBody: batchImportRoute.buildBody,
      };
    }

    return {
      intent: 'chat',
      describe: 'Tipo de arquivo não reconhecido. Envie um PDF de histórico ou um CSV de candidatos.',
    };
  }

  return {
    accept,
    routeIntent,
  };
}
