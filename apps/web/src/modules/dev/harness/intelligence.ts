import { invokeHarness } from './transport';
import type {
  RelationshipGraph,
  VerificationReport,
  InvestigationParams,
  InvestigationDossier,
  PublicSource,
  CategoryPublicSources,
  SourceHistoryLog,
  WebSnapshotResult,
} from './types';

export type {
  InvestigationParams,
  InvestigationDossier,
  PublicSource,
  CategoryPublicSources,
  SourceHistoryLog,
  WebSnapshotResult,
};

export const intelligenceClient = {
  getGraphData: async (targetName?: string, targetDoc?: string) =>
    invokeHarness<RelationshipGraph>('get_graph_data', { targetName, targetDoc }),
  graphData: async (targetName?: string, targetDoc?: string) =>
    invokeHarness<RelationshipGraph>('get_graph_data', { targetName, targetDoc }),
  runVerification: async (targetName?: string, targetDoc?: string) =>
    invokeHarness<VerificationReport>('run_verification', { targetName, targetDoc }),
  executeInvestigation: async (params?: InvestigationParams) =>
    invokeHarness<InvestigationDossier>('execute_investigation', { params }),
  generateDossierMarkdown: async (targetName?: string, targetDoc?: string) =>
    invokeHarness<string>('generate_dossier_markdown', { targetName, targetDoc }),
  getPublicSourcesByCategory: async (category?: string) =>
    invokeHarness<CategoryPublicSources>('get_public_sources_by_category', { category }),
  addPublicSource: async (name: string, category: string, description?: string, url?: string, opts?: any) =>
    invokeHarness<PublicSource[]>('add_public_source', { name, category, description, url, ...opts }),
  removePublicSource: async (sourceName: string, agentName?: string) =>
    invokeHarness<PublicSource[]>('remove_public_source', { sourceName, agentName }),
  getPublicSourcesHistory: async () =>
    invokeHarness<SourceHistoryLog[]>('get_public_sources_history'),
  captureWebSnapshot: async (url: string, sourceName?: string) =>
    invokeHarness<WebSnapshotResult>('capture_web_snapshot', { url, sourceName }),
  getCapturedSnapshots: async () =>
    invokeHarness<WebSnapshotResult[]>('get_captured_snapshots'),
  captureAppUiSnapshot: async (tabId?: string) =>
    invokeHarness<WebSnapshotResult>('capture_app_ui_snapshot', { tabId }),
};
