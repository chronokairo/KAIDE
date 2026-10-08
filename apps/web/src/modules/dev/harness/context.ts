import { invokeRuntime } from './transport';
import type { ContextFragment, AssembledContext, HarnessContextFile } from './types';

export const contextClient = {
  contextFiles: async (workspace?: string) =>
    invokeRuntime<HarnessContextFile[]>('get_harness_context_files', { workspace }),
  getContextFiles: async (workspace?: string) =>
    invokeRuntime<HarnessContextFile[]>('get_harness_context_files', { workspace }),
  getContextFragments: async (workspace?: string) =>
    invokeRuntime<ContextFragment[]>('get_context_fragments', { workspace }),
  assembleContextFragments: async (workspace?: string, config?: any) =>
    invokeRuntime<AssembledContext>('assemble_context_fragments', { workspace, config }),
  previewContextForPrompt: async (workspace?: string, maxBytes?: number) =>
    invokeRuntime<string>('preview_context_for_prompt', { workspace, maxBytes }),
};
