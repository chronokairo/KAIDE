import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  FileText, 
  Calendar, 
  Clock,
  PlusCircle
} from 'lucide-react';
import { InvestigationDossier } from '../types';

export interface HistoryEntry {
  id: string;
  targetName: string;
  targetDoc: string;
  targetType: string;
  timestamp: string;
  riskLevel: string;
  riskScore: number;
  dossier: InvestigationDossier;
}

interface InvestigationHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
  onNewInvestigation: () => void;
  activeDossierId?: string;
}

export const InvestigationHistorySidebar: React.FC<InvestigationHistorySidebarProps> = ({
  isOpen,
  onToggle,
  history,
  onSelectEntry,
  onDeleteEntry,
  onClearHistory,
  onNewInvestigation,
  activeDossierId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(
    (item) =>
      item.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetDoc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRÍTICO':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80">CRÍTICO</span>;
      case 'ALTO':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80">ALTO</span>;
      case 'MÉDIO':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">MÉDIO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">BAIXO</span>;
    }
  };

  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 px-2 bg-slate-950 border-r border-slate-800/80 space-y-4 shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
          title="Expandir Histórico de Pesquisas"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNewInvestigation}
          className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20"
          title="Nova Investigação"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
        <div className="w-8 h-px bg-slate-800 my-2"></div>
        <div className="flex flex-col items-center gap-3">
          <History className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-mono text-slate-500 [writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">
            Histórico ({history.length})
          </span>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 md:w-80 bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 font-sans backdrop-blur-md h-[calc(100vh-61px)] sticky top-[61px]">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Histórico de Casos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewInvestigation}
            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Nova Investigação"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Novo</span>
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Recolher Histórico"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-900 bg-slate-950">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou doc..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* History Entries List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredHistory.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-center p-4 space-y-2">
            <History className="w-8 h-8 stroke-[1.5]" />
            <p className="text-xs">
              {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhuma investigação realizada ainda.'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isActive = activeDossierId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectEntry(item)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                    {item.targetName}
                  </div>
                  {getRiskBadge(item.riskLevel)}
                </div>

                <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center gap-2">
                  <span>Doc: {item.targetDoc || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/60">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.timestamp).toLocaleDateString('pt-BR')} {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                    title="Remover do Histórico"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear All */}
      {history.length > 0 && (
        <div className="p-2.5 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono">{history.length} salvo(s)</span>
          <button
            onClick={onClearHistory}
            className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 font-mono text-[10px]"
          >
            <Trash2 className="w-3 h-3" /> Limpar Histórico
          </button>
        </div>
      )}
    </aside>
  );
};
