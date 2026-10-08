/**
 * RollbackService
 * Portado e adaptado do ThinkCoffee para o Kaide.
 *
 * Executa simulação e reversão das modificações do agente
 * com base nos snapshots criados pelo SnapshotService.
 */

import { SnapshotService } from './snapshot.service';
import type { RollbackResult } from './types';

export class RollbackService {
  private readonly _snapshotService: SnapshotService;

  constructor(workspaceRoot: string) {
    this._snapshotService = new SnapshotService(workspaceRoot);
  }

  /**
   * Planeja o rollback (simulação sem executar no disco).
   * Retorna lista de arquivos que seriam restaurados ou deletados.
   */
  async plan(
    sessionId: string,
    phaseIndex: number,
  ): Promise<{ filesToRestore: string[]; filesToDelete: string[] }> {
    const snapshot = await this._snapshotService.getSnapshot(sessionId, phaseIndex);

    if (!snapshot) {
      throw new Error(`Snapshot não encontrado para session=${sessionId}, phase=${phaseIndex}`);
    }

    const filesToRestore: string[] = [];
    const filesToDelete: string[] = [];

    for (const fileMeta of snapshot.files) {
      if (fileMeta.action === 'created') {
        filesToDelete.push(fileMeta.path);
      } else if (fileMeta.action === 'modified' || fileMeta.action === 'deleted') {
        filesToRestore.push(fileMeta.path);
      }
    }

    return { filesToRestore, filesToDelete };
  }

  /**
   * Executa o rollback efetivo da fase ou sessão.
   */
  async rollback(sessionId: string, phaseIndex: number): Promise<RollbackResult> {
    return this._snapshotService.restore(sessionId, phaseIndex);
  }
}
