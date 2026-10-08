'use client';

import React, { useState } from 'react';
import { GitHubNotificationItem } from '../domain/entities/notification.entity';
import { useGitHubNotifications } from '../adapters/primary/hooks/useGitHubNotifications';
import { AiFixModal } from './AiFixModal';

export const DevGitHubNotificationsTab: React.FC = () => {
  const {
    filteredNotifications,
    availableRepos,
    stats,
    filters,
    setFilters,
    syncLoading,
    syncError,
    toggleUnread,
    markAllRead,
    resetToInitial,
    importRawText,
    syncWithApi,
    generateAiFixPrompt,
    getBatchTriageSummary,
  } = useGitHubNotifications();

  const [selectedNotifForFix, setSelectedNotifForFix] = useState<GitHubNotificationItem | null>(null);
  const [showBatchTriage, setShowBatchTriage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImportPasted = async () => {
    if (!rawPastedText.trim()) return;
    const res = await importRawText(rawPastedText);
    if (res.count === 0) {
      showToast('Nenhuma notificação válida identificada no texto colado.');
      return;
    }
    setShowImportModal(false);
    setRawPastedText('');
    showToast(`${res.count} notificações importadas com sucesso!`);
  };

  const handleSyncGitHubApi = async () => {
    if (!tokenInput.trim()) {
      setShowTokenModal(true);
      return;
    }
    try {
      const res = await syncWithApi(tokenInput);
      if (res.syncedCount > 0) {
        showToast(`${res.syncedCount} notificações sincronizadas da API do GitHub!`);
      } else {
        showToast('Nenhuma notificação nova retornada pela API.');
      }
      setShowTokenModal(false);
    } catch {
      // Error handled via hook syncError
    }
  };

  const handleSendToChat = (promptText: string, notification: GitHubNotificationItem) => {
    setSelectedNotifForFix(null);
    setShowBatchTriage(false);

    try {
      localStorage.setItem('chronokairo_pending_chat_prompt', promptText);
    } catch {}

    window.dispatchEvent(
      new CustomEvent('dev:chat-inject-prompt', {
        detail: {
          prompt: promptText,
          project: notification.repo,
          title: `Correção: ${notification.workflowName}`,
        },
      })
    );

    window.dispatchEvent(new CustomEvent('dev:tab-change', { detail: 'chat' }));
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'chat');
      params.set('project', notification.repo);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  };

  const handleBatchTriageSendToChat = () => {
    const summary = getBatchTriageSummary();
    handleSendToChat(
      summary.consolidatedAiPrompt,
      filteredNotifications[0] || ({ repo: 'all', workflowName: 'CI Workflows' } as any)
    );
  };

  const batchSummary = showBatchTriage ? getBatchTriageSummary() : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12] text-zinc-200 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-500 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Stats */}
      <div className="p-6 border-b border-white/10 bg-[#111318] space-y-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Notificações do GitHub &amp; CI Activity</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {stats.failed} Falhas Ativas
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Arquitetura Hexagonal com contratos de domínio para diagnóstico e remediação por IA.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBatchTriage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">psychology</span>
              <span>Diagnosticar Todas com IA</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              title="Colar texto copiado do github.com/notifications"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-400">content_paste</span>
              <span>Importar / Colar</span>
            </button>

            <button
              onClick={() => setShowTokenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              title="Configurar Token do GitHub para sincronização ao vivo"
            >
              <span className="material-symbols-outlined text-[17px] text-teal-400">key</span>
              <span>GitHub PAT</span>
            </button>

            <button
              onClick={() => {
                markAllRead();
                showToast('Todas as notificações foram marcadas como lidas.');
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Marcar todas como lidas"
            >
              <span className="material-symbols-outlined text-[17px]">mark_chat_read</span>
            </button>

            <button
              onClick={() => {
                resetToInitial();
                showToast('Notificações restauradas para a lista inicial.');
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Restaurar notificações padrão"
            >
              <span className="material-symbols-outlined text-[17px]">restart_alt</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#16181d] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-mono">Total Notificações</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{stats.total}</div>
            </div>
            <span className="material-symbols-outlined text-zinc-500 text-[20px]">inbox</span>
          </div>

          <div className="p-3 rounded-xl bg-[#16181d] border border-rose-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-rose-400 uppercase font-mono">Workflows Falhos</div>
              <div className="text-lg font-bold text-rose-300 font-mono mt-0.5">{stats.failed}</div>
            </div>
            <span className="material-symbols-outlined text-rose-400 text-[20px]">cancel</span>
          </div>

          <div className="p-3 rounded-xl bg-[#16181d] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-mono">Repositórios Afetados</div>
              <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">{stats.repos}</div>
            </div>
            <span className="material-symbols-outlined text-teal-400 text-[20px]">source</span>
          </div>

          <div className="p-3 rounded-xl bg-[#16181d] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-mono">Não Lidas</div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{stats.unread}</div>
            </div>
            <span className="material-symbols-outlined text-amber-400 text-[20px]">mark_email_unread</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Filtrar por repositório, workflow, branch ou diagnóstico..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-[#16181d] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <select
            value={filters.repo}
            onChange={(e) => setFilters((prev) => ({ ...prev, repo: e.target.value }))}
            className="bg-[#16181d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">Todos os Repositórios ({availableRepos.length})</option>
            {availableRepos.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-lg border border-white/10 bg-[#16181d] p-0.5 text-xs">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, status: 'all' }))}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === 'all' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, status: 'unread' }))}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === 'unread' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Não Lidos ({stats.unread})
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, status: 'failed' }))}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === 'failed' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Falhas CI ({stats.failed})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Card List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#111318] space-y-3">
            <span className="material-symbols-outlined text-zinc-600 text-[48px]">notifications_off</span>
            <div className="text-sm font-semibold text-zinc-300">Nenhuma notificação encontrada</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Ajuste os filtros de busca ou importe novas notificações usando o botão &quot;Importar / Colar&quot;.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const diag = notif.diagnostic;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  notif.unread
                    ? 'bg-[#14171e] border-rose-500/30 hover:border-rose-500/50 shadow-sm'
                    : 'bg-[#111318] border-white/5 hover:border-white/15 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.status === 'failed'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {notif.status === 'failed' ? 'cancel' : 'check_circle'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono hover:text-teal-300 cursor-pointer">
                        {notif.repo}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs font-semibold text-zinc-300 truncate">
                        {notif.workflowName}
                      </span>
                      {notif.runNumber && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                          #{notif.runNumber}
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {notif.branch}
                      </span>
                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" title="Não lida" />
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 leading-snug line-clamp-1 font-mono">
                      {notif.eventTitle}
                    </div>

                    {diag && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">info</span>
                          <span>{diag.categoryLabel}</span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {notif.timeAgo} • {notif.actor} • {notif.reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setSelectedNotifForFix(notif)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    title="Ver diagnóstico e correção automática da IA"
                  >
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    <span>Corrigir com IA</span>
                  </button>

                  <button
                    onClick={() => handleSendToChat(generateAiFixPrompt(notif), notif)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-teal-400 border border-white/10 transition-colors cursor-pointer"
                    title="Enviar contexto para Chat com IA"
                  >
                    <span className="material-symbols-outlined text-[17px]">chat_spark</span>
                  </button>

                  {diag?.cliRerunCmd && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(diag.cliRerunCmd!);
                        showToast('Comando gh CLI copiado!');
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-amber-400 border border-white/10 transition-colors cursor-pointer"
                      title="Copiar comando de rerun (gh run rerun)"
                    >
                      <span className="material-symbols-outlined text-[17px]">terminal</span>
                    </button>
                  )}

                  <button
                    onClick={() => toggleUnread(notif.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title={notif.unread ? 'Marcar como lida' : 'Marcar como não lida'}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {notif.unread ? 'mark_chat_read' : 'mark_chat_unread'}
                    </span>
                  </button>

                  {notif.htmlUrl && (
                    <a
                      href={notif.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                      title="Abrir no GitHub"
                    >
                      <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Remediation Modal (Single Notification) */}
      <AiFixModal
        notification={selectedNotifForFix}
        onClose={() => setSelectedNotifForFix(null)}
        onSendToChat={handleSendToChat}
      />

      {/* Batch Triage Modal */}
      {showBatchTriage && batchSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
          <div className="bg-[#111318] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-white/10 bg-[#16181d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <span className="material-symbols-outlined text-[24px]">batch_prediction</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Triagem Consolidada com IA ({batchSummary.totalFailures} Falhas)</h3>
                  <p className="text-xs text-zinc-400">
                    {batchSummary.affectedRepositoriesCount} repositórios afetados • Plano mestre de resolução
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchTriage(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs text-zinc-300">
              {batchSummary.categorizedGroups.map((grp) => (
                <div key={grp.category} className="p-4 rounded-xl bg-[#16181d] border border-white/10 space-y-1.5">
                  <div className="text-teal-300 font-bold flex items-center justify-between">
                    <span>{grp.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 uppercase">
                      {grp.severity}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{grp.description}</p>
                  <div className="text-[11px] font-mono text-zinc-500 pt-1">
                    Repositórios: <span className="text-amber-400">{grp.repos.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#16181d] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBatchTriage(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleBatchTriageSendToChat}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs shadow-md shadow-teal-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat_spark</span>
                <span>Executar Plano no Chat com IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Paste Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
          <div className="bg-[#111318] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-white/10 bg-[#16181d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[24px]">content_paste</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Importar Notificações do GitHub</h3>
                  <p className="text-xs text-zinc-400">Cole o texto copiado de github.com/notifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Você pode selecionar e copiar as notificações diretamente da página do GitHub e colar abaixo. O motor de diagnóstico fará o parse e gerará os contratos de correção automaticamente.
              </p>
              <textarea
                rows={10}
                placeholder="Exemplo:
anamnesic/anamnesic-core – .github/workflows/openclaw-scheduled-live-checks.yml #46
.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch
10 hours ago
@lu4nn3ry
ci activity"
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                className="w-full bg-[#0d0f12] border border-white/10 rounded-xl p-3.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="p-4 border-t border-white/10 bg-[#16181d] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportPasted}
                disabled={!rawPastedText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Processar e Importar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Token / PAT Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
          <div className="bg-[#111318] border border-white/15 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-white/10 bg-[#16181d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <span className="material-symbols-outlined text-[24px]">key</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configurar GitHub Token (PAT)</h3>
                  <p className="text-xs text-zinc-400">Sincronize notificações em tempo real diretamente da API oficial</p>
                </div>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Personal Access Token (classic ou fine-grained):</label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500">
                  Necessita dos escopos <code className="text-teal-400">notifications</code> e <code className="text-teal-400">repo</code>.
                </p>
              </div>

              {syncError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{syncError}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#16181d] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSyncGitHubApi}
                disabled={syncLoading || !tokenInput.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-md shadow-teal-500/20 cursor-pointer"
              >
                {syncLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    <span>Salvar &amp; Sincronizar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
