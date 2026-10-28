"use client";

import React from 'react';

interface CapabilityConfirmationProps {
  actionType: string;
  targetEntity: string;
  proposedChanges: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CapabilityConfirmation: React.FC<CapabilityConfirmationProps> = ({
  actionType,
  targetEntity,
  proposedChanges,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="my-3 p-4 bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-500/40 rounded-2xl text-zinc-200 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-400 font-bold text-sm">🛡️ Confirmação Humana Requerida (Human-in-the-Loop)</span>
      </div>
      <p className="text-xs text-zinc-300 mb-3">
        A Chronokairo IA propôs a execução da seguinte alteração no ERP. Confirme para prosseguir:
      </p>

      <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-xs font-mono mb-4">
        <div><strong className="text-zinc-400">Ação:</strong> {actionType}</div>
        <div><strong className="text-zinc-400">Entidade Alvo:</strong> {targetEntity}</div>
        <div className="mt-2 text-zinc-400 font-sans font-semibold">Alterações Propostas:</div>
        <pre className="mt-1 p-2 bg-zinc-950 rounded text-emerald-400 overflow-x-auto text-[11px]">
          {JSON.stringify(proposedChanges, null, 2)}
        </pre>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
        >
          Rejeitar / Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md transition"
        >
          Confirmar e Executar
        </button>
      </div>
    </div>
  );
};
