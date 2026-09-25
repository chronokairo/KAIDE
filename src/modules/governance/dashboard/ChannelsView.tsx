import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Send, 
  MessageSquare,
  Lock,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Channel, DevicePairing, Agent } from '../types';

interface ChannelsViewProps {
  channels: Channel[];
  pairings: DevicePairing[];
  agents: Agent[];
  onApprovePairing: (requestId: string) => void;
  onRevokePairing: (requestId: string) => void;
  onToggleChannel: (channelId: string) => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  pairings,
  agents,
  onApprovePairing,
  onRevokePairing,
  onToggleChannel
}) => {
  const [testChannelId, setTestChannelId] = useState<string>(channels[0].id);
  const [testMessage, setTestMessage] = useState('');
  const [testSentToast, setTestSentToast] = useState(false);

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setTestSentToast(true);
    setTimeout(() => {
      setTestSentToast(false);
      setTestMessage('');
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-400" />
          <span>Multi-Channel Gateway & Device Pairing</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Real-time channel socket multiplexer, Webhook listeners, and Tailscale / Local device pairing authorization.
        </p>
      </div>

      {/* Device Pairing Section (Crucial security feature in KAIROS) */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Device Pairing & Operator Access</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {pairings.filter(p => p.status === 'approved').length} Active Devices
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pairings.map((p) => {
            const isApproved = p.status === 'approved';
            return (
              <div
                key={p.requestId}
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  isApproved
                    ? 'bg-zinc-950/80 border-zinc-800'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <span>{p.deviceName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-mono font-semibold ${
                        isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      IP: {p.clientIp} • Role: {p.requestedRole}
                    </div>
                  </div>

                  <div>
                    {isApproved ? (
                      <button
                        onClick={() => onRevokePairing(p.requestId)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-400 text-zinc-400 transition text-[11px]"
                      >
                        Revoke
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onApprovePairing(p.requestId)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onRevokePairing(p.requestId)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px]"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {p.requestedScopes.map(sc => (
                    <span key={sc} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {sc}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Channel Adapters Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-100">Configured Messaging Gateways</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch) => {
            const isConnected = ch.status === 'connected';
            const targetAgent = agents.find(a => a.id === ch.targetAgent);

            return (
              <div
                key={ch.id}
                className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{ch.name}</h4>
                      <div className="text-[11px] text-zinc-400 uppercase font-mono">
                        {ch.type}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleChannel(ch.id)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold uppercase transition cursor-pointer ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {ch.status}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                  <div className="flex justify-between">
                    <span>Bound Agent:</span>
                    <span className="text-zinc-200 font-semibold">{targetAgent?.name || ch.targetAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Messages Routed:</span>
                    <span className="text-emerald-400 font-mono">{ch.messagesHandled.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Pulse:</span>
                    <span className="text-zinc-400 font-mono">{ch.lastActive}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator / Test Outbound Dispatch */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-5 space-y-3 max-w-2xl">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Simulate Inbound Channel Envelope</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Inject a test message envelope into the gateway without connecting third-party bot credentials.
        </p>

        <form onSubmit={handleSendTest} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target Channel</label>
              <select
                value={testChannelId}
                onChange={(e) => setTestChannelId(e.target.value)}
                className="w-full bg-zinc-950 text-zinc-200 text-xs rounded-lg p-2 border border-zinc-700 font-mono"
              >
                {channels.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Sender Simulation</label>
              <input
                type="text"
                defaultValue="developer@kairos.internal"
                className="w-full bg-zinc-950 text-zinc-200 text-xs rounded-lg p-2 border border-zinc-700 font-mono"
              />
            </div>
          </div>

          <div>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type simulated message to trigger agent routing..."
              rows={2}
              className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-lg p-3 border border-zinc-700 resize-none"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-zinc-400">
              {testSentToast && <span className="text-emerald-400">✓ Inbound envelope dispatched to agent queue!</span>}
            </span>
            <button
              type="submit"
              disabled={!testMessage.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition"
            >
              Dispatch Envelope
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
