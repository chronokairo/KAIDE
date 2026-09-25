import React from 'react';
import { 
  Activity, 
  Layers, 
  Network, 
  Wrench, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  FileText, 
  Settings,
  Radio
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount
}) => {
  const menuItems = [
    { id: 'runtime' as TabType, label: 'Agent Runtime', icon: Activity, badge: 'v2.4' },
    { id: 'gateway' as TabType, label: 'Sessions & Gateway', icon: Radio },
    { id: 'models' as TabType, label: 'Model Gateway', icon: Network },
    { id: 'tools' as TabType, label: 'Tool Gateway & MCP', icon: Wrench },
    { id: 'policy' as TabType, label: 'Policy Engine', icon: ShieldCheck },
    { id: 'approvals' as TabType, label: 'Approvals Queue', icon: ShieldAlert, badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { id: 'speclock' as TabType, label: 'Spec Lock & Trans.', icon: Lock },
    { id: 'audit' as TabType, label: 'Audit Trail', icon: FileText },
    { id: 'config' as TabType, label: 'Control Plane Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full select-none text-zinc-300">
      {/* Brand Header */}
      <div className="h-16 border-b border-zinc-800/80 px-5 flex items-center space-x-3 bg-zinc-950/80 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shadow-sm shadow-emerald-950">
          α
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
            <span>anamnesic-core</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 border border-emerald-800/60 text-emerald-300 rounded">
              v2.4.0
            </span>
          </h1>
          <p className="text-[11px] text-zinc-500 font-mono">Autonomous Agent Gateway</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-500">
          Control Plane
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-900 text-emerald-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${item.badgeColor || 'bg-zinc-800 text-zinc-400'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Invariants Status Footer */}
      <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-900/40 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
          <span>Invariants Check</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ALL PASS
          </span>
        </div>
        <div className="text-[10px] text-zinc-500">
          INV-01 to INV-10 strictly enforced
        </div>
      </div>
    </aside>
  );
};
