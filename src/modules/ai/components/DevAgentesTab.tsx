"use client";

import React, { useState } from 'react';
import { 
  useAcpProviders, 
  useHarnessNodeIdentity, 
  useHarnessQuorum, 
  useHarnessQuorumOpenCount, 
  useHarnessFileEditor,
  useCreateHarnessSession,
  useStreamAgentSession,
  type AcpProviderInfo 
} from '@/modules/dev/hooks/useHarness';

interface DevAgentesTabProps {
  workspace?: string;
}

const ENV_LABEL: Record<string, string> = {
  'kilo-code': 'KILO_API_KEY / config',
  'opencode': 'OPENCODE_API_KEY / config',
};

const CONFIG_FILES: Record<string, string[]> = {
  'kilo-code': ['.kilocode.json', '.kilo/settings.json'],
  'opencode': ['.opencode.json', 'opencode.json'],
};

function AgentRow({ agent, workspace }: { agent: AcpProviderInfo; workspace?: string }) {
  const [expanded, setExpanded] = useState(false);

  // Config editor state
  const [editingConfig, setEditingConfig] = useState(false);
  const [configPath, setConfigPath] = useState<string | null>(null);
  const { content: configContent, loading: configLoading, saving: configSaving, error: configError, save: saveConfig, setContent: setConfigContent } = useHarnessFileEditor(configPath);

  // Agent session state
  const [starting, setStarting] = useState(false);
  const { create: createSession, creating: sessionCreating } = useCreateHarnessSession();
  const { startStream, running: streaming, textDeltas: sessionOutput, lastError: streamError } = useStreamAgentSession();

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    const configFiles = CONFIG_FILES[agent.id] ?? [];
    const path = workspace && configFiles[0] ? `${workspace}/${configFiles[0]}` : configFiles[0];
    if (path) {
      setConfigPath(path);
      setEditingConfig(true);
      if (!expanded) setExpanded(true);
    } else {
      // No config file — show env var info inline by expanding the row
      setConfigPath(null);
      setEditingConfig(true);
      if (!expanded) setExpanded(true);
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarting(true);
    if (!expanded) setExpanded(true);
    setEditingConfig(false);

    const session = await createSession({
      workspace,
      model: agent.default_model || undefined,
      title: `Sessão ${agent.display_name}`,
    });

    if (session) {
      await startStream(`Olá, apresente-se como ${agent.display_name}.`, () => {}, {
        workspace,
        model: agent.default_model || undefined,
        session_id: session.toString(),
      });
    }
    setStarting(false);
  };

  return (
    <>
      <tr
        className={`border-b border-outline-variant/10 transition-colors cursor-pointer ${
          expanded ? 'bg-secondary/5' : 'hover:bg-surface-container-low/30'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-5">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${expanded ? 'rotate-90' : ''}`}>
              chevron_right
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">smart_toy</span>
            <span className="font-medium text-primary">{agent.display_name}</span>
          </div>
        </td>
        <td className="py-3 px-5 text-on-surface-variant font-mono text-xs">{agent.version || '—'}</td>
        <td className="py-3 px-5 font-mono text-xs text-on-surface-variant max-w-[200px] truncate">
          {agent.default_model || '—'}
        </td>
        <td className="py-3 px-5 text-center font-medium text-primary">{agent.model_count}</td>
        <td className="py-3 px-5 text-on-surface-variant font-mono text-xs max-w-[180px] truncate">
          <span title={agent.binary_path || undefined}>{agent.binary_path || '—'}</span>
        </td>
        <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            {agent.installed ? (
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container text-xs font-semibold">
                Instalado
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-xs font-semibold">
                Não instalado
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button
              title="Configurar agente"
              onClick={handleConfigure}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-low transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
            </button>
            {agent.installed && (
              <button
                title="Iniciar agente"
                onClick={handleStart}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/10 transition-colors text-secondary"
              >
                <span className={`material-symbols-outlined text-[16px] ${(starting || sessionCreating) ? 'animate-spin' : ''}`}>
                  {(starting || sessionCreating) ? 'sync' : 'play_arrow'}
                </span>
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-secondary/5 border-b border-outline-variant/10">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Models */}
              <div>
                <span className="text-on-surface-variant uppercase font-semibold block mb-2">Modelos disponíveis</span>
                {agent.models.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.models.map((m: any) => (
                      <span key={String(m)} className="font-mono px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
                        {String(m)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-on-surface-variant block mb-4">Nenhum modelo listado pelo harness.</span>
                )}
                {/* Config */}
                <span className="text-on-surface-variant uppercase font-semibold block mb-2">Configuração</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">key</span>
                    <span className="text-on-surface-variant">{ENV_LABEL[agent.id] ?? 'variáveis de ambiente'}</span>
                  </div>
                  {(CONFIG_FILES[agent.id] ?? []).map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">description</span>
                      <span className="font-mono text-on-surface-variant">
                        {workspace ? `${workspace}/${f}` : f}
                      </span>
                    </div>
                  ))}
                  {agent.error && (
                    <div className="flex items-center gap-2 text-error mt-2">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{agent.error}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Editor or Session Panel */}
              <div>
                {editingConfig && configPath ? (
                  <div className="flex flex-col h-full">
                    <span className="text-on-surface-variant uppercase font-semibold flex items-center justify-between mb-2">
                      <span>Editar Configuração</span>
                      <button onClick={() => setEditingConfig(false)} className="text-on-surface-variant hover:text-primary material-symbols-outlined text-[16px]">close</button>
                    </span>
                    {configLoading ? (
                      <div className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Carregando...</div>
                    ) : configError ? (
                      <div className="text-error bg-red-50 p-2 rounded border border-red-100">{configError}</div>
                    ) : (
                      <div className="flex flex-col gap-2 flex-1">
                        <textarea
                          className="w-full flex-1 min-h-[120px] p-2 bg-surface-container-low border border-outline-variant/50 rounded font-mono text-xs text-on-surface resize-y"
                          value={configContent || ''}
                          onChange={(e) => setConfigContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingConfig(false)}
                            className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveConfig(configContent || '')}
                            disabled={configSaving}
                            className="px-3 py-1 rounded bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {configSaving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (sessionOutput || streaming || streamError) ? (
                  <div className="flex flex-col h-full">
                    <span className="text-on-surface-variant uppercase font-semibold flex items-center gap-2 mb-2">
                      <span>Sessão do Agente</span>
                      {streaming && <span className="material-symbols-outlined animate-spin text-secondary text-[14px]">sync</span>}
                    </span>
                    {streamError && <div className="text-error bg-red-50 p-2 rounded border border-red-100 mb-2">{streamError}</div>}
                    <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto p-3 bg-surface-container-low border border-outline-variant/50 rounded font-mono text-xs text-on-surface whitespace-pre-wrap">
                      {sessionOutput || (streaming ? 'Iniciando...' : 'Sem resposta.')}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[120px] border border-dashed border-outline-variant/50 rounded bg-surface-container-low/30 text-on-surface-variant/70 italic text-center px-4">
                    Selecione "Configurar" para editar propriedades ou "Iniciar" para abrir uma sessão com o agente.
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export const DevAgentesTab: React.FC<DevAgentesTabProps> = ({ workspace }) => {
  const { result, loading, error, refresh } = useAcpProviders();
  const { result: nodeResult, error: nodeError } = useHarnessNodeIdentity();
  const { result: quorumResult } = useHarnessQuorum();
  const { result: quorumOpenResult } = useHarnessQuorumOpenCount();
  const providers = result?.data ?? [];
  const demo = result?.available === false;
  const nodeId = nodeResult?.data?.identity?.node_id ?? nodeResult?.data?.nodeId ?? null;
  const peerCount = nodeResult?.data?.trustedPeerCount ?? 0;

  const installed = providers.filter((p) => p.installed);
  const totalModels = providers.reduce((acc, p) => acc + p.model_count, 0);

  return (
    <div>
      {(error || nodeError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{error || nodeError}</p>
        </div>
      )}
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter mb-xl">
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Provedores ACP</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{loading ? '…' : `${providers.length} Provedores`}</div>
          <span className="text-secondary text-xs font-data-tabular">{demo ? 'Demo (sem shell Tauri)' : 'Kilo Code / OpenCode'}</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Instalados</span>
          <div className="font-display-lg text-[28px] font-bold text-secondary my-2 font-data-tabular">{loading ? '…' : installed.length}</div>
          <span className="text-secondary text-xs font-data-tabular">Binários disponíveis no PATH</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Modelos</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{loading ? '…' : totalModels}</div>
          <span className="text-on-surface-variant text-xs font-data-tabular">Oferecidos pelos provedores</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Nó do Harness</span>
          <div className={`font-display-lg text-[28px] font-bold my-2 font-data-tabular ${nodeId ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {nodeId ? 'Ativo' : '—'}
          </div>
          <span className="text-secondary text-xs font-data-tabular">
            {nodeId ? `${nodeId.slice(0, 10)}… · ${peerCount} peers` : 'Sem identidade de nó'}
          </span>
        </div>
        {(quorumResult?.data || quorumOpenResult?.data != null) && (
          <>
            <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Propostas</span>
              <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">
                {quorumResult?.data?.length ?? '—'}
              </div>
              <span className="text-secondary text-xs font-data-tabular">Total de propostas</span>
            </div>
            <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Quorum Aberto</span>
              <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">
                {quorumOpenResult?.data ?? '—'}
              </div>
              <span className="text-secondary text-xs font-data-tabular">Propostas pendentes</span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-outline-variant/50 rounded-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-white">
          <h3 className="font-headline-sm text-headline-sm text-primary">Agentes & Provedores ACP</h3>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="h-8 px-3 border border-outline-variant text-on-surface-variant text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Atualizar
            </button>
          </div>
        </div>
        {demo && (
          <div className="px-5 py-2 bg-tertiary-container/10 text-on-tertiary-container text-xs font-medium">
            Modo demo — execute pelo shell Tauri (tauri dev) para detectar provedores ACP reais.
          </div>
        )}
        {workspace && (
          <div className="px-5 py-2 bg-surface-container-low/50 border-b border-outline-variant/20 text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">folder</span>
            Configurações buscadas em: <span className="font-mono ml-1">{workspace}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 font-label-md text-[12px] text-on-surface-variant">
                <th className="py-3 px-5">Agente</th>
                <th className="py-3 px-5">Versão</th>
                <th className="py-3 px-5">Modelo Default</th>
                <th className="py-3 px-5 text-center">Modelos</th>
                <th className="py-3 px-5">Binário</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="font-data-tabular text-[14px]">
              {providers.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 px-5 text-center text-on-surface-variant">
                    Nenhum provedor ACP detectado pelo harness.
                  </td>
                </tr>
              )}
              {providers.map((agent) => (
                <AgentRow key={agent.id} agent={agent} workspace={workspace} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
