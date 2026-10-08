"use client";

import React from 'react';

interface ApprovalRequest {
  tool: string;
  summary: string;
  risk: string;
}

interface Props {
  approvalRequest: ApprovalRequest;
  onResolve: (decision: 'allow_once' | 'allow_session' | 'deny') => void;
}

export const ApprovalModal: React.FC<Props> = ({ approvalRequest, onResolve }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-5 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-warning-container text-on-warning-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">shield</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary">Aprovação Necessária</h3>
            <p className="text-xs text-on-surface-variant">O agente solicitou permissão para executar uma ação.</p>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-3 mb-4 border border-outline-variant/30">
          <div className="text-xs font-bold text-on-surface mb-1">{approvalRequest.tool}</div>
          <p className="text-xs text-on-surface-variant">{approvalRequest.summary}</p>
          <p className="text-[10px] text-on-surface-variant/60 mt-1">Risco: {approvalRequest.risk}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onResolve('deny')}
            className="h-8 px-4 rounded-xl bg-error-container text-error text-xs font-bold hover:bg-error-container/80 transition-colors"
          >
            Negar
          </button>
          <button
            onClick={() => onResolve('allow_session')}
            className="h-8 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Permitir (sessão)
          </button>
          <button
            onClick={() => onResolve('allow_once')}
            className="h-8 px-4 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 transition-colors"
          >
            Permitir (uma vez)
          </button>
        </div>
      </div>
    </div>
  );
};
