/**
 * Stub: SyncConfigService
 * Full implementation will be completed in Phase 2
 */

export interface CreateSyncConfigInput {
  workspaceId: string;
  enabled: boolean;
}

export interface UpdateSyncConfigInput {
  enabled?: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
}

export class SyncConfigService {
  constructor(private _db?: any) {}

  async create(_input: CreateSyncConfigInput): Promise<any> {
    return { id: 'stub', enabled: false };
  }

  async get(_id: string): Promise<any | null> {
    return null;
  }

  async update(_id: string, _input: UpdateSyncConfigInput): Promise<any | null> {
    return null;
  }

  async delete(_id: string): Promise<void> {
    // Stub
  }
}
