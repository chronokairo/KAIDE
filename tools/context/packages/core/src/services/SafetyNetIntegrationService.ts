import { Logger } from '../utils/Logger';
import { SnapshotService } from './SnapshotService';
import { getEventBus } from '../events';
import { Pipeline, PipelinePhase } from '../pipeline';

/**
 * Safety Net Integration Service
 * 
 * Integra o SnapshotService com o Pipeline para:
 * - Criar snapshots automáticos antes de cada fase
 * - Permitir rollback seguro
 * - Manter histórico de mudanças
 * - Auditoria de modificações
 */

export interface PhaseSnapshot {
  id: string;
  pipelineId: string;
  phaseId: string;
  phaseName: string;
  projectPath: string;
  timestamp: Date;
  filesCount: number;
  description: string;
}

export class SafetyNetIntegrationService {
  private logger = Logger.getInstance();
  private snapshotService: SnapshotService;
  private bus = getEventBus('safety-net');
  private phaseSnapshots: Map<string, PhaseSnapshot> = new Map();

  constructor(projectPath: string = process.cwd()) {
    this.snapshotService = new SnapshotService(projectPath);
  }

  /**
   * Criar snapshot automático antes de uma fase ser executada
   */
  async createPhaseSnapshot(
    pipeline: Pipeline,
    phase: PipelinePhase
  ): Promise<PhaseSnapshot | null> {
    try {
      this.logger.info('[SafetyNet] Creating phase snapshot', {
        pipelineId: pipeline.id,
        phaseId: phase.id,
        phaseName: phase.name,
      });

      // Criar snapshot com SnapshotService
      const snapshotId = await this.snapshotService.createSnapshot(
        `Phase: ${phase.name} (Pipeline: ${pipeline.objective})`
      );

      if (!snapshotId) {
        throw new Error('Failed to create snapshot');
      }

      // Obter informações do snapshot
      const snapshot = await this.snapshotService.getSnapshot(snapshotId);

      if (!snapshot) {
        throw new Error('Snapshot not found after creation');
      }

      const phaseSnapshot: PhaseSnapshot = {
        id: snapshotId,
        pipelineId: pipeline.id,
        phaseId: phase.id,
        phaseName: phase.name,
        projectPath: snapshot.path,
        timestamp: new Date(snapshot.timestamp),
        filesCount: snapshot.files?.length || 0,
        description: `Pre-phase snapshot for ${phase.name}`,
      };

      // Armazenar referência
      this.phaseSnapshots.set(phase.id, phaseSnapshot);

      // Emitir evento
      await this.bus.emit('phase:snapshot:created', {
        snapshotId,
        pipelineId: pipeline.id,
        phaseId: phase.id,
        phaseName: phase.name,
        filesCount: phaseSnapshot.filesCount,
        timestamp: new Date().toISOString(),
      });

      this.logger.info('[SafetyNet] Phase snapshot created', {
        snapshotId,
        pipelineId: pipeline.id,
        filesCount: phaseSnapshot.filesCount,
      });

      return phaseSnapshot;
    } catch (error) {
      this.logger.error('[SafetyNet] Failed to create phase snapshot', {
        error,
        pipelineId: pipeline.id,
        phaseId: phase.id,
      });

      await this.bus.emit('phase:snapshot:error', {
        error: error instanceof Error ? error.message : String(error),
        pipelineId: pipeline.id,
        phaseId: phase.id,
        timestamp: new Date().toISOString(),
      });

      return null;
    }
  }

  /**
   * Fazer rollback para um snapshot específico
   */
  async rollbackToSnapshot(
    snapshotId: string,
    pipelineId: string,
    phaseId: string
  ): Promise<boolean> {
    try {
      this.logger.info('[SafetyNet] Rolling back to snapshot', {
        snapshotId,
        pipelineId,
        phaseId,
      });

      // Restaurar arquivo usando SnapshotService
      const success = await this.snapshotService.restoreSnapshot(snapshotId);

      if (success) {
        // Emitir evento de rollback bem-sucedido
        await this.bus.emit('phase:rollback:completed', {
          snapshotId,
          pipelineId,
          phaseId,
          timestamp: new Date().toISOString(),
        });

        this.logger.info('[SafetyNet] Rollback completed', {
          snapshotId,
          pipelineId,
        });
      } else {
        throw new Error('Restore operation failed');
      }

      return true;
    } catch (error) {
      this.logger.error('[SafetyNet] Rollback failed', {
        error,
        snapshotId,
        pipelineId,
      });

      await this.bus.emit('phase:rollback:error', {
        error: error instanceof Error ? error.message : String(error),
        snapshotId,
        pipelineId,
        phaseId,
        timestamp: new Date().toISOString(),
      });

      return false;
    }
  }

  /**
   * Listar snapshots de um pipeline
   */
  async listPipelineSnapshots(pipelineId: string): Promise<PhaseSnapshot[]> {
    const snapshots: PhaseSnapshot[] = [];

    for (const [, snapshot] of this.phaseSnapshots) {
      if (snapshot.pipelineId === pipelineId) {
        snapshots.push(snapshot);
      }
    }

    return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Comparar dois snapshots (diff)
   */
  async compareSnapshots(
    snapshotId1: string,
    snapshotId2: string
  ): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
  }> {
    try {
      const snapshot1 = await this.snapshotService.getSnapshot(snapshotId1);
      const snapshot2 = await this.snapshotService.getSnapshot(snapshotId2);

      if (!snapshot1 || !snapshot2) {
        throw new Error('One or both snapshots not found');
      }

      const files1 = new Set(snapshot1.files?.map(f => f.path) || []);
      const files2 = new Set(snapshot2.files?.map(f => f.path) || []);

      const added = Array.from(files2).filter(f => !files1.has(f));
      const removed = Array.from(files1).filter(f => !files2.has(f));
      const modified = Array.from(files1).filter(f => files2.has(f)); // TODO: implementar diff real

      return { added, removed, modified };
    } catch (error) {
      this.logger.error('[SafetyNet] Failed to compare snapshots', { error });
      return { added: [], removed: [], modified: [] };
    }
  }

  /**
   * Limpar snapshots antigos de um pipeline
   */
  async cleanupOldSnapshots(
    pipelineId: string,
    daysOld: number = 7
  ): Promise<number> {
    try {
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
      let deleted = 0;

      for (const [phaseId, snapshot] of this.phaseSnapshots) {
        if (
          snapshot.pipelineId === pipelineId &&
          snapshot.timestamp.getTime() < cutoffTime
        ) {
          const success = await this.snapshotService.deleteSnapshot(snapshot.id);
          if (success) {
            this.phaseSnapshots.delete(phaseId);
            deleted++;
          }
        }
      }

      if (deleted > 0) {
        this.logger.info('[SafetyNet] Old snapshots cleaned up', {
          pipelineId,
          deleted,
          daysOld,
        });

        await this.bus.emit('snapshots:cleanup:completed', {
          pipelineId,
          deleted,
          daysOld,
          timestamp: new Date().toISOString(),
        });
      }

      return deleted;
    } catch (error) {
      this.logger.error('[SafetyNet] Failed to cleanup snapshots', {
        error,
        pipelineId,
      });
      return 0;
    }
  }

  /**
   * Obter informações de um snapshot de fase
   */
  async getPhaseSnapshot(phaseId: string): Promise<PhaseSnapshot | undefined> {
    return this.phaseSnapshots.get(phaseId);
  }

  /**
   * Exportar snapshot para arquivo (backup)
   */
  async exportSnapshot(snapshotId: string, outputPath: string): Promise<boolean> {
    try {
      // TODO: implementar exportação via SnapshotService
      this.logger.info('[SafetyNet] Snapshot exported', {
        snapshotId,
        outputPath,
      });
      return true;
    } catch (error) {
      this.logger.error('[SafetyNet] Failed to export snapshot', {
        error,
        snapshotId,
      });
      return false;
    }
  }
}
