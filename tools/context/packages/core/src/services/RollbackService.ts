import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { SnapshotService } from './SnapshotService';
import type { RollbackResult } from '../types/safety-net';

/**
 * RollbackService
 *
 * Executa rollback de uma fase de pipeline usando os snapshots criados
 * pelo SnapshotService antes de cada operacao de escrita.
 *
 * API alinhada com RollbackCommandHandler.
 */
export class RollbackService {
  private readonly _snapshotService: SnapshotService;
  private readonly _workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this._workspaceRoot = workspaceRoot;
    this._snapshotService = new SnapshotService(workspaceRoot);
  }

  /**
   * Planeja o rollback (simulacao sem executar).
   * Retorna lista de arquivos que seriam restaurados/deletados.
   */
  async plan(
    pipelineId: string,
    phaseIndex: number,
  ): Promise<{ filesToRestore: string[]; filesToDelete: string[] }> {
    const snapshot = await this._snapshotService.getSnapshot(pipelineId, phaseIndex);

    if (!snapshot) {
      throw new Error(
        `Snapshot nao encontrado para pipeline=${pipelineId}, phase=${phaseIndex}`,
      );
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
   * Executa o rollback da fase especificada.
   * Delega para SnapshotService.restore() que tem a logica de disco.
   */
  async rollback(pipelineId: string, phaseIndex: number): Promise<RollbackResult> {
    const result = await this._snapshotService.restore(
      pipelineId,
      phaseIndex,
      this._workspaceRoot,
    );

    return {
      restored: result.restored,
      deleted: result.deleted,
      errors: result.errors,
    };
  }
}
