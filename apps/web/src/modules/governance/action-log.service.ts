/**
 * ActionLogService
 * Portado e adaptado do ThinkCoffee para o Kaide.
 *
 * Registra trilha de auditoria contínua de tool calls em formato estruturado JSONL.
 * Permite reprodução, diagnóstico e inspeção de tudo o que os agentes executaram.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ActionLogEntry } from './types';

const LOGS_BASE = path.join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.chronokairo',
  'logs',
  'actions',
);

export class ActionLogService {
  private readonly _logsDir: string;

  constructor(logsDir = LOGS_BASE) {
    this._logsDir = logsDir;
  }

  private _getLogFilePath(sessionId: string): string {
    return path.join(this._logsDir, `${sessionId}.jsonl`);
  }

  /**
   * Grava uma entrada estruturada no log da sessão.
   */
  async log(entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): Promise<ActionLogEntry> {
    const logFilePath = this._getLogFilePath(entry.sessionId);
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });

    const fullEntry: ActionLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const logLine = JSON.stringify(fullEntry) + '\n';
    await fs.appendFile(logFilePath, logLine, 'utf8');

    return fullEntry;
  }

  /**
   * Lê todas as ações registradas para uma sessão específica.
   */
  async getBySession(sessionId: string): Promise<ActionLogEntry[]> {
    const logFilePath = this._getLogFilePath(sessionId);

    try {
      const content = await fs.readFile(logFilePath, 'utf8');
      const lines = content.trim().split('\n');

      return lines
        .filter(line => line.length > 0)
        .map(line => JSON.parse(line) as ActionLogEntry);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Filtra ações por fase dentro da sessão.
   */
  async getByPhase(sessionId: string, phaseIndex: number): Promise<ActionLogEntry[]> {
    const entries = await this.getBySession(sessionId);
    return entries.filter(e => e.phaseIndex === phaseIndex);
  }
}
