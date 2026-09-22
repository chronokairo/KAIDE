'use client';

import React from 'react';
import type { ApprovalRequest, ApprovalDecision } from '@/modules/dev/hooks/useHarness';

interface ApprovalDialogProps {
  request: ApprovalRequest;
  onResolve: (decision: ApprovalDecision) => void;
  onClose: () => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  request,
  onResolve,
  onClose,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning-container text-on-warning-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">shield</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-primary">Aprovação Humana Necessária</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                O agente solicita permissão para executar uma ação.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Tool Info */}
          <div className="bg-white border border-outline-variant/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-on-surface-variant uppercase">Ferramenta</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getRiskColor(request.risk || 'medium')}`}>
                <span className="material-symbols-outlined text-[12px] mr-1">{getRiskIcon(request.risk || 'medium')}</span>
                Risco: {request.risk || 'médio'}
              </span>
            </div>
            <div className="font-bold text-sm text-primary">{request.tool}</div>
          </div>

          {/* Summary */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4">
            <span className="text-xs font-mono text-on-surface-variant uppercase block mb-1">Resumo da Ação</span>
            <p className="text-sm text-on-surface leading-relaxed">{request.summary || request.description || request.command || 'Execução de ferramenta'}</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <span className="material-symbols-outlined text-amber-600 text-[16px] mt-0.5">info</span>
            <span>
              Esta ação será executada imediatamente após a aprovação. 
              Certifique-se de que entende as implicações antes de permitir.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-outline-variant/40 bg-surface-container-low/50 flex items-center justify-end gap-3">
          <button
            onClick={() => onResolve('deny')}
            className="h-10 px-5 rounded-xl bg-error-container text-on-error-container font-semibold text-sm hover:bg-error-container/80 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">block</span>
            Negar
          </button>
          <button
            onClick={() => onResolve('allow_once')}
            className="h-10 px-5 rounded-xl bg-secondary text-on-secondary font-semibold text-sm hover:bg-secondary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Permitir (uma vez)
          </button>
          <button
            onClick={() => onResolve('allow_session')}
            className="h-10 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Permitir (sessão)
          </button>
        </div>
      </div>
    </div>
  );
};
