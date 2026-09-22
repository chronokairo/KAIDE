'use client';

import React, { useState } from 'react';
import { useApplyProcessHardening, useHardeningStatus, useShellCommandSafety, useSecretsManager, useIsTauri } from '@/modules/dev/hooks/useHarness';
import type { SecretEntry } from '@/modules/dev/harness-client';

const DEMO_SECRETS: SecretEntry[] = [
  { name: 'OPENAI_API_KEY', scope: 'global', created_at: new Date().toISOString() },
  { name: 'ANTHROPIC_API_KEY', scope: 'workspace:erp', created_at: new Date().toISOString() },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', scope: 'global', created_at: new Date().toISOString() },
];

export const SecurityPanel: React.FC = () => {
  const isTauri = useIsTauri();
  const { status: hardeningStatus, loading: hardeningLoading, error: hardeningError, apply: applyHardening } = useApplyProcessHardening();
  const { result: currentStatus, error: statusError } = useHardeningStatus();
  const { analyze, loading: shellLoading, error: shellError } = useShellCommandSafety();
  const { secrets: rawSecrets, loading: secretsLoading, error: secretsError, setSecret, deleteSecret } = useSecretsManager();

  const [localSecrets, setLocalSecrets] = useState<SecretEntry[]>(DEMO_SECRETS);
  const [shellCmd, setShellCmd] = useState('');
  const [shellResult, setShellResult] = useState<{ safety: string; reason: string; tokens: string[] } | null>(null);

  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretScope, setSecretScope] = useState('');
  const [isHardenedLocal, setIsHardenedLocal] = useState(true);

  const rawList = Array.isArray(rawSecrets) ? rawSecrets : [];
  const secrets = rawList.length > 0 ? rawList : (!isTauri ? localSecrets : []);

  const handleAnalyze = async () => {
    if (!shellCmd.trim()) return;
    if (!isTauri) {
      const lower = shellCmd.toLowerCase();
      const dangerousWords = ['rm -rf', 'format', 'mkfs', 'dd ', ':(){:|:&};:', 'drop table', 'shutdown', 'reboot'];
      const isDanger = dangerousWords.some(w => lower.includes(w));
      const tokens = shellCmd.trim().split(/\s+/);
      setShellResult({
        safety: isDanger ? 'dangerous' : 'safe',
        reason: isDanger
          ? 'Comando contém padrões de alto risco para o sistema de arquivos ou integridade.'
          : 'Comando analisado e classificado como seguro para execução.',
        tokens,
      });
      return;
    }
    const result = await analyze(shellCmd);
    setShellResult(result);
  };

  const handleSetSecret = async () => {
    if (!secretName.trim() || !secretValue.trim()) return;
    if (!isTauri) {
      setLocalSecrets(prev => [...prev.filter(s => (s.name || s.key) !== secretName), { name: secretName.trim(), scope: secretScope.trim() || 'global', created_at: new Date().toISOString() }]);
      setSecretName('');
      setSecretValue('');
      setSecretScope('');
      return;
    }
    await setSecret(secretName, secretValue, secretScope || undefined);
    setSecretName('');
    setSecretValue('');
    setSecretScope('');
  };

  const handleDeleteSecret = async (name: string, scope?: string) => {
    if (!isTauri) {
      setLocalSecrets(prev => prev.filter(s => (s.name || s.key) !== name));
      return;
    }
    await deleteSecret(name, scope === 'global' ? undefined : scope);
  };

  const status = currentStatus?.data ?? (isTauri ? hardeningStatus : { applied: isHardenedLocal, platform: 'Web / Browser', timestamp: new Date().toISOString() });

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Inspeção e testes de segurança interativos. Ações de baixo nível no SO requerem o Tauri Desktop.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {(hardeningError || statusError || shellError || secretsError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{hardeningError || statusError || shellError || secretsError}</p>
        </div>
      )}

      {/* Process Hardening */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary tracking-tight">Process Hardening</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Endurecimento do processo: disable core dumps, sanitização de LD_*/DYLD_*, isolamento de memória.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isTauri) {
                setIsHardenedLocal(true);
                return;
              }
              applyHardening();
            }}
            disabled={hardeningLoading || (status?.applied && isTauri)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              status?.applied
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {hardeningLoading ? 'Aplicando...' : status?.applied ? '✓ Protegido' : 'Aplicar'}
          </button>
        </div>
        <div className="p-3.5">
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Plataforma</div>
              <div className="font-bold text-primary font-mono">{status?.platform ?? (isTauri ? 'Desktop' : 'Web Browser')}</div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Status</div>
              <div className={`font-bold ${status?.applied ? 'text-emerald-700' : 'text-amber-700'}`}>
                {status?.applied ? 'Protegido' : 'Não aplicado'}
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Timestamp</div>
              <div className="font-mono text-[10px] text-primary">
                {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Ativo'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shell Command Safety */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Shell Command Safety</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Analise a segurança de comandos shell antes de permitir a execução.
          </p>
        </div>
        <div className="p-3.5 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ex: rm -rf /tmp/old_logs ou npm test"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={handleAnalyze}
              disabled={shellLoading || !shellCmd.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-2xs"
            >
              {shellLoading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>

          {shellResult && (
            <div className={`p-3 rounded-xl text-xs border animate-in fade-in duration-150 ${
              shellResult.safety === 'safe'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900'
                : shellResult.safety === 'dangerous'
                ? 'bg-red-500/10 border-red-500/25 text-red-900'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[16px]">
                  {shellResult.safety === 'safe' ? 'check_circle' : shellResult.safety === 'dangerous' ? 'error' : 'warning'}
                </span>
                <span className="font-bold uppercase tracking-wider text-[11px]">{shellResult.safety}</span>
              </div>
              <div className="leading-relaxed">{shellResult.reason}</div>
              {shellResult.tokens.length > 0 && (
                <div className="mt-2 font-mono text-[10px] opacity-80 pt-1.5 border-t border-current/10">
                  Tokens: {shellResult.tokens.join(' | ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secrets Management */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Secrets Management</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Armazenamento seguro de chaves de API e tokens de autenticação.
          </p>
        </div>
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="Nome (ex: GEMINI_API_KEY)"
              className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
            />
            <input
              type="password"
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Valor do Segredo"
              className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={secretScope}
                onChange={(e) => setSecretScope(e.target.value)}
                placeholder="Escopo (opcional)"
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
              />
              <button
                onClick={handleSetSecret}
                disabled={!secretName.trim() || !secretValue.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs"
              >
                Salvar
              </button>
            </div>
          </div>

          {secretsLoading ? (
            <div className="p-4 text-center text-on-surface-variant text-xs">Carregando segredos...</div>
          ) : secrets.length === 0 ? (
            <div className="p-4 text-center text-on-surface-variant text-xs">Nenhum segredo armazenado</div>
          ) : (
            <div className="divide-y divide-outline-variant/20 max-h-[200px] overflow-y-auto no-scrollbar">
              {secrets.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-1 hover:bg-surface-container-low/40 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-primary">key</span>
                    <span className="text-xs font-mono font-semibold text-primary">{s.name || s.key}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">{s.scope}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSecret(s.name || s.key || '', s.scope)}
                    className="text-[10px] text-error hover:bg-error-container/40 px-2 py-0.5 rounded font-semibold transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
