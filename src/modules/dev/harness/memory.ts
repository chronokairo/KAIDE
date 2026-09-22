import { invokeRuntime } from './transport';
import type { HarnessMemorySession, HarnessSessionMessage, MemorySearchResult } from './types';

export const memoryClient = {
  getMemorySessions: async (limit = 50, workspace?: string) =>
    invokeRuntime<HarnessMemorySession[]>('get_harness_memory_sessions', { limit, workspace }),
  memorySessions: async (limit = 50, workspace?: string) =>
    invokeRuntime<HarnessMemorySession[]>('get_harness_memory_sessions', { limit, workspace }),
  getSessionMessages: async (sessionId: number) =>
    invokeRuntime<HarnessSessionMessage[]>('get_harness_session_messages', { sessionId }),
  sessionMessages: async (sessionId: number) =>
    invokeRuntime<HarnessSessionMessage[]>('get_harness_session_messages', { sessionId }),
  searchMemories: async (query: string, limit?: number) =>
    invokeRuntime<MemorySearchResult[]>('search_memories', { query, limit }),
};
