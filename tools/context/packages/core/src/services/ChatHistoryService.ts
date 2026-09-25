/**
 * Stub: ChatHistoryService
 * Full implementation will be completed in Phase 2
 */

export interface SaveHistoryInput {
  channelId: string;
  message: string;
}

export interface HistoryFilter {
  limit?: number;
  offset?: number;
}

export interface BackupInfo {
  id: string;
  createdAt: Date;
  size: number;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
}

export class ChatHistoryService {
  constructor(private _db?: any) {}
  
  async saveHistory(_input: SaveHistoryInput): Promise<void> {
    // Stub
  }

  async getHistory(_filter?: HistoryFilter): Promise<any[]> {
    return [];
  }

  async backup(): Promise<BackupInfo> {
    return { id: 'stub', createdAt: new Date(), size: 0 };
  }

  async recover(): Promise<RecoveryResult> {
    return { success: true, message: 'Stub' };
  }
}
