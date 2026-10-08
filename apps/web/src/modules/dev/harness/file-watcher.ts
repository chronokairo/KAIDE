import { invokeRuntime } from './transport';
import type { FileWatchSnapshot } from './types';

export const fileWatcherClient = {
  getFileWatchSnapshot: async (workspace?: string, since?: string) =>
    invokeRuntime<FileWatchSnapshot>('get_file_watch_snapshot', { workspace, since }),
};
