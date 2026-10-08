'use client';

import React, { useState } from 'react';
import { GitHubNotificationItem } from '../types';
import { generateAiFixPrompt } from '../services/githubService';

interface AiFixModalProps {
  notification: GitHubNotificationItem | null;
  onClose: () => void;
  onSendToChat: (prompt: string, notification: GitHubNotificationItem) => void;
}

export const AiFixModal: React.FC<AiFixModalProps> = ({
  notification,
  onClose,
  onSendToChat,
}) => {
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!notification) return null;

  const diag = notification.diagnostic;
  const prompt = generateAiFixPrompt(notification);

  const handleCopyPatch = () => {
    if (diag?.patchCode) {
      navigator.clipboard.writeText(diag.patchCode);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  const handleCopyCli = () => {
    if (diag?.cliRerunCmd) {
      navigator.clipboard.writeText(diag.cliRerunCmd);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const severityColor = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    low: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  }[diag?.severity || 'medium'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
      <div className="bg-[#111318] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#16181d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Diagnóstico &amp; Correção por IA
                </h3>
                {diag?.severity && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${severityColor}`}>
                    {diag.severity}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {notification.repo} • {notification.workflowName} {notification.runNumber ? `#${notification.runNumber}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-300">
          {/* Failure Summary Banner */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-400 text-[20px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-rose-200 text-xs">Erro Notificado:</div>
              <div className="text-xs font-mono mt-0.5 text-rose-300/90 break-words">{notification.eventTitle}</div>
            </div>
          </div>

          {/* Root Cause Card */}
          <div className="bg-[#16181d] border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-wide uppercase">
              <span className="material-symbols-outlined text-[18px]">search_insights</span>
              <span>Causa Raiz Identificada</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-200">
              {diag?.explanation || notification.errorSummary}
            </p>
            {diag?.rootCause && (
              <div className="pt-2 text-xs font-mono text-zinc-400 border-t border-white/5 bg-white/[0.02] p-2.5 rounded-lg">
                <span className="text-amber-400 font-bold">Diagnóstico Técnico: </span>
                {diag.rootCause}
              </div>
            )}
          </div>

          {/* Suggested Fix Action */}
          <div className="bg-[#16181d] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wide uppercase">
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
              <span>Plano de Solução Recomendado</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-200">
              {diag?.suggestedFix || 'Atualize o arquivo de configuração do workflow para mitigar a falha.'}
            </p>

            {/* Code / Patch Block */}
            {diag?.patchCode && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                  <span>Arquivo: <strong className="text-teal-300">{diag.affectedFile || '.github/workflows/'}</strong></span>
                  <button
                    onClick={handleCopyPatch}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedPatch ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedPatch ? 'Copiado!' : 'Copiar Patch'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-[#0d0f12] border border-white/10 text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  <code>{diag.patchCode}</code>
                </pre>
              </div>
            )}
          </div>

          {/* CLI Rerun Command */}
          {diag?.cliRerunCmd && (
            <div className="bg-[#16181d] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
                <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0">terminal</span>
                <span className="text-zinc-400">Reexecutar via gh CLI:</span>
                <code className="text-zinc-200 bg-black/40 px-2 py-0.5 rounded truncate">{diag.cliRerunCmd}</code>
              </div>
              <button
                onClick={handleCopyCli}
                className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded cursor-pointer shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedCli ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCli ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#16181d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedPrompt ? 'check' : 'description'}
              </span>
              <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt da IA'}</span>
            </button>
            {notification.htmlUrl && (
              <a
                href={notification.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Abrir no GitHub</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={() => onSendToChat(prompt, notification)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat_spark</span>
              <span>Enviar para Chat com IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
