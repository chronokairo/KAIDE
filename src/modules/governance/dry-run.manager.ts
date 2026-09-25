/**
 * DryRunManager
 * Portado e adaptado do ThinkCoffee para o ChronoKairo AI.
 *
 * Gerencia a execução em modo simulação (Dry-Run):
 * - Ferramentas de leitura rodam normalmente.
 * - Ferramentas de escrita e comandos destrutivos não alteram o disco e registram simulações de diff.
 */

import type { PlannedAction, DryRunSummary, ToolName } from './types';

export class DryRunManager {
  private _isDryRunEnabled = false;
  private _plannedActions: PlannedAction[] = [];

  get isDryRunEnabled(): boolean {
    return this._isDryRunEnabled;
  }

  set isDryRunEnabled(value: boolean) {
    this._isDryRunEnabled = value;
    if (value) {
      this._plannedActions = [];
    }
  }

  toggleDryRun(): boolean {
    this.isDryRunEnabled = !this.isDryRunEnabled;
    return this._isDryRunEnabled;
  }

  recordPlannedAction(action: Omit<PlannedAction, 'id' | 'timestamp'>): PlannedAction {
    const fullAction: PlannedAction = {
      ...action,
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this._plannedActions.push(fullAction);
    return fullAction;
  }

  getPlannedActions(): readonly PlannedAction[] {
    return this._plannedActions;
  }

  clearPlannedActions(): void {
    this._plannedActions = [];
  }

  getSummary(): DryRunSummary {
    const filesAffected = new Set<string>();
    let writesPlanned = 0;
    let deletesPlanned = 0;
    let commandsPlanned = 0;

    for (const a of this._plannedActions) {
      if (a.target) filesAffected.add(a.target);
      if (a.tool === 'write_file' || a.tool === 'replace_file_content') writesPlanned++;
      if (a.tool === 'delete_file') deletesPlanned++;
      if (a.tool === 'run_command') commandsPlanned++;
    }

    return {
      totalActions: this._plannedActions.length,
      writesPlanned,
      deletesPlanned,
      commandsPlanned,
      filesAffected: Array.from(filesAffected),
    };
  }
}
