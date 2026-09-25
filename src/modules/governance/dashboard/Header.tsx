import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Layers, 
  Lock, 
  Check, 
  ExternalLink,
  Terminal
} from 'lucide-react';
import { ControlPlaneHealth } from '../types';

interface HeaderProps {
  health: ControlPlaneHealth;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800/80 px-6 flex items-center justify-between text-zinc-300 select-none">
      {/* Left Gateway Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono font-semibold text-zinc-200">
            CONTROL PLANE: {health.gatewayStatus}
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-zinc-500">
          <span>•</span>
          <span>Active Sessions: <span className="text-zinc-300 font-semibold">{health.activeSessions}</span></span>
          <span>•</span>
          <span>MCP Servers: <span className="text-sky-400 font-semibold">{health.connectedMcpServers}</span></span>
        </div>
      </div>

      {/* Right Metrics & Quick Info */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hidden sm:flex items-center space-x-1.5">
          <Lock className="w-3 h-3 text-purple-400" />
          <span>Spec Lock: <span className="text-emerald-400">Enforced</span></span>
        </div>

        <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hidden sm:flex items-center space-x-1.5">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>Zero-Trust Sandbox</span>
        </div>

        <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
          v2.4.0 Engine
        </div>
      </div>
    </header>
  );
};
