/**
 * SnapshotService
 * Portado e adaptado do ThinkCoffee para o Kaide.
 *
 * Gerencia snapshots determinísticos de arquivos em disco antes de modificações do agente.
 * Permite reversão atômica em caso de erros ou quebra de build.
 *
 * Estrutura em disco:
 *   ~/.chronokairo/snapshots/<workspaceHash>/<sessionId>/<phaseIndex>/_metadata.json
 *   ~/.chronokairo/snapshots/<workspaceHash>/<sessionId>/<phaseIndex>/<sha256_hash>
 */

import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  SnapshotMetadata,
  SnapshotFileMetadata,
  SnapshotFileAction,
  RollbackResult,
} from './types';

const SNAPSHOTS_BASE = path.join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.chronokairo',
  'snapshots',
);

export class SnapshotService {
  private readonly _snapshotsRoot: string;
  private readonly _workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this._workspaceRoot = workspaceRoot;
    const wsHash = crypto
      .createHash('sha256')
      .update(workspaceRoot)
      .digest('hex')
      .substring(0, 12);
    this._snapshotsRoot = path.join(SNAPSHOTS_BASE, wsHash);
  }

  private _phaseDir(sessionId: string, phaseIndex: number): string {
    return path.join(this._snapshotsRoot, sessionId, String(phaseIndex));
  }

  private _metadataPath(sessionId: string, phaseIndex: number): string {
    return path.join(this._phaseDir(sessionId, phaseIndex), '_metadata.json');
  }

  /**
   * Salva o conteúdo original de um arquivo ANTES de ser modificado ou deletado.
   */
  async snapshotFile(
    sessionId: string,
    phaseIndex: number,
    phaseName: string,
    relativePath: string,
    action: SnapshotFileAction,
    originalContent?: Buffer | string | null,
  ): Promise<void> {
    const phaseDir = this._phaseDir(sessionId, phaseIndex);
    await fs.mkdir(phaseDir, { recursive: true });

    let metadata = await this.getSnapshot(sessionId, phaseIndex);
    if (!metadata) {
      metadata = {
        sessionId,
        phaseIndex,
        phaseName,
        timestamp: new Date().toISOString(),
        files: [],
      };
    }

    // Não duplicar se já foi fotografado nesta fase
    if (metadata.files.some(f => f.path === relativePath)) {
      return;
    }

    let originalHash = '';
    let originalSize = 0;

    if (action === 'modified' || action === 'deleted') {
      let contentBuffer: Buffer | null = null;

      if (originalContent !== undefined && originalContent !== null) {
        contentBuffer = Buffer.isBuffer(originalContent)
          ? originalContent
          : Buffer.from(originalContent);
      } else {
        const absPath = path.resolve(this._workspaceRoot, relativePath);
        if (fsSync.existsSync(absPath)) {
          contentBuffer = await fs.readFile(absPath);
        }
      }

      if (contentBuffer) {
        originalHash = crypto.createHash('sha256').update(contentBuffer).digest('hex');
        originalSize = contentBuffer.byteLength;
        const blobPath = path.join(phaseDir, originalHash);
        await fs.writeFile(blobPath, contentBuffer);
      }
    }

    const fileMeta: SnapshotFileMetadata = {
      path: relativePath,
      action,
      originalHash,
      originalSize,
    };

    metadata.files.push(fileMeta);
    await fs.writeFile(
      this._metadataPath(sessionId, phaseIndex),
      JSON.stringify(metadata, null, 2),
      'utf-8',
    );
  }

  /**
   * Obtém os metadados de snapshot de uma fase.
   */
  async getSnapshot(sessionId: string, phaseIndex: number): Promise<SnapshotMetadata | null> {
    const metaPath = this._metadataPath(sessionId, phaseIndex);
    try {
      const content = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(content) as SnapshotMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Restaura os arquivos do snapshot.
   */
  async restore(sessionId: string, phaseIndex: number): Promise<RollbackResult> {
    const metadata = await this.getSnapshot(sessionId, phaseIndex);
    if (!metadata) {
      return {
        restored: 0,
        deleted: 0,
        errors: [`Snapshot não encontrado para sessão ${sessionId}, fase ${phaseIndex}`],
      };
    }

    const phaseDir = this._phaseDir(sessionId, phaseIndex);
    let restored = 0;
    let deleted = 0;
    const errors: string[] = [];

    for (const fileMeta of metadata.files) {
      const absolutePath = path.resolve(this._workspaceRoot, fileMeta.path);

      try {
        if (fileMeta.action === 'created') {
          // Arquivo foi criado pelo agente -> deletar para reverter
          if (fsSync.existsSync(absolutePath)) {
            await fs.unlink(absolutePath);
            deleted++;
          }
        } else if (fileMeta.action === 'modified' || fileMeta.action === 'deleted') {
          // Arquivo foi modificado/deletado -> restaurar conteúdo original
          if (!fileMeta.originalHash) {
            errors.push(`Hash ausente para restaurar: ${fileMeta.path}`);
            continue;
          }
          const blobPath = path.join(phaseDir, fileMeta.originalHash);
          if (fsSync.existsSync(blobPath)) {
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.copyFile(blobPath, absolutePath);
            restored++;
          } else {
            errors.push(`Blob original ausente para: ${fileMeta.path}`);
          }
        }
      } catch (err: any) {
        errors.push(`Erro ao restaurar ${fileMeta.path}: ${err.message}`);
      }
    }

    return { restored, deleted, errors };
  }
}
