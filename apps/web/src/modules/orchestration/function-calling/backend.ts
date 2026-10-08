import type { AnnaUploadToolDefinition } from '../../harness/contracts';
import { fileMatchesAccept, getToolsWithAnnaUpload, matchesAny, parseAccept } from '../../harness/shared';

export type AnnaBackendIntent = 'transcript' | 'batch-import' | 'chat';

export interface AnnaFileMeta {
  name: string;
  mimeType: string;
  size: number;
}

export interface AnnaBackendDecision {
  intent: AnnaBackendIntent;
  describe: string;
  endpoint?: string;
  toolName?: string;
}

interface AnnaBackendRouteConfig {
  toolName: string;
  intent: Extract<AnnaBackendIntent, 'transcript' | 'batch-import'>;
  endpoint: string;
  describe: string;
  keywords: string[];
  accepts: string[];
}

function buildBackendRoutes(tools: AnnaUploadToolDefinition[]): AnnaBackendRouteConfig[] {
  return getToolsWithAnnaUpload(tools)
    .map((tool): AnnaBackendRouteConfig | null => {
      const accepts = parseAccept(tool.annaUpload.accept);

      switch (tool.name) {
        case 'edu_transcript_intake':
          return {
            toolName: tool.name,
            intent: 'transcript',
            endpoint: '/transcript/auto-enroll',
            describe: 'Histórico escolar detectado — encaminhando para intake de transferência.',
            keywords: tool.annaUpload.intentKeywords,
            accepts,
          };
        case 'edu_batch_import_candidates':
          return {
            toolName: tool.name,
            intent: 'batch-import',
            endpoint: '/new-student/selection-process/batch-import/csv',
            describe: 'Arquivo CSV de candidatos detectado — encaminhando para importação em lote.',
            keywords: tool.annaUpload.intentKeywords,
            accepts,
          };
        default:
          return null;
      }
    })
    .filter((route): route is AnnaBackendRouteConfig => route !== null);
}

export function createAnnaBackendRouter(tools: AnnaUploadToolDefinition[]) {
  const routes = buildBackendRoutes(tools);
  const transcriptRoute = routes.find((route) => route.intent === 'transcript');
  const batchImportRoute = routes.find((route) => route.intent === 'batch-import');

  function routeBackend(message: string, fileMeta?: AnnaFileMeta): AnnaBackendDecision {
    if (!fileMeta) {
      return { intent: 'chat', describe: 'Mensagem de chat sem arquivo.' };
    }

    const transcriptMatches = !!transcriptRoute && fileMatchesAccept(fileMeta.name, fileMeta.mimeType, transcriptRoute.accepts);
    const batchMatches = !!batchImportRoute && fileMatchesAccept(fileMeta.name, fileMeta.mimeType, batchImportRoute.accepts);

    if (transcriptMatches && transcriptRoute) {
      if (
        message &&
        !matchesAny(message, transcriptRoute.keywords) &&
        batchImportRoute &&
        matchesAny(message, batchImportRoute.keywords)
      ) {
        return {
          intent: 'chat',
          describe: 'PDF recebido mas mensagem indica importacao em lote — envie um CSV.',
        };
      }

      return {
        intent: transcriptRoute.intent,
        describe: transcriptRoute.describe,
        endpoint: transcriptRoute.endpoint,
        toolName: transcriptRoute.toolName,
      };
    }

    if (batchMatches && batchImportRoute) {
      return {
        intent: batchImportRoute.intent,
        describe: batchImportRoute.describe,
        endpoint: batchImportRoute.endpoint,
        toolName: batchImportRoute.toolName,
      };
    }

    return {
      intent: 'chat',
      describe: 'Tipo de arquivo não reconhecido — tratando como mensagem de chat.',
    };
  }

  return {
    routeBackend,
  };
}
