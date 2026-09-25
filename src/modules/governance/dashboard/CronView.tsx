import React, { useState } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Send,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { CronJob, Agent } from '../types';

interface CronViewProps {
  cronJobs: CronJob[];
  agents: Agent[];
  onToggleJob: (jobId: string) => void;
  onRunNow: (jobId: string) => void;
  onAddJob: (newJob: CronJob) => void;
  onDeleteJob: (jobId: string) => void;
}

export const CronView: React.FC<CronViewProps> = ({
  cronJobs,
  agents,
  onToggleJob,
  onRunNow,
  onAddJob,
  onDeleteJob
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSchedule, setNewSchedule] = useState('0 * * * *');
  const [newAgentId, setNewAgentId] = useState(agents[0].id);
  const [newPrompt, setNewPrompt] = useState('');
  const [newDeliveryMode, setNewDeliveryMode] = useState<'announce' | 'webhook' | 'none'>('announce');
  const [executingJobId, setExecutingJobId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const job: CronJob = {
      id: `cron-${Date.now().toString(36)}`,
      name: newTitle,
      schedule: newSchedule,
      agentId: newAgentId,
      prompt: newPrompt,
      deliveryMode: newDeliveryMode,
      enabled: true,
      nextRun: '2026-08-30 13:00:00',
      runCount: 0
    };

    onAddJob(job);
    setShowAddModal(false);
    setNewTitle('');
    setNewPrompt('');
  };

  const handleExecute = (id: string) => {
    setExecutingJobId(id);
    onRunNow(id);
    setTimeout(() => {
      setExecutingJobId(null);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Autonomous Automation & Cron (Clawflow)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Background daemon scheduling, scheduled pull request recaps, and memory distillation cycles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Scheduled Job</span>
        </button>
      </div>

      {/* Cron List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cronJobs.map((job) => {
          const agent = agents.find(a => a.id === job.agentId);
          const isRunning = executingJobId === job.id;

          return (
            <div
              key={job.id}
              className={`p-4 rounded-xl border space-y-3 transition flex flex-col justify-between ${
                job.enabled
                  ? 'bg-zinc-900/60 border-zinc-800'
                  : 'bg-zinc-950/40 border-zinc-800/40 opacity-70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-zinc-100 line-clamp-1">{job.name}</h4>
                  <button
                    onClick={() => onToggleJob(job.id)}
                    className="text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {job.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 font-bold">
                    {job.schedule}
                  </span>
                  <span className="text-zinc-400">
                    via {agent?.name || job.agentId}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/60 font-sans line-clamp-3">
                  {job.prompt}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                  <span>Delivery: <strong className="text-zinc-200 uppercase">{job.deliveryMode}</strong></span>
                  <span>Runs: <strong className="text-emerald-400">{job.runCount}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleExecute(job.id)}
                    disabled={isRunning}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                  </button>

                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Cron Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-zinc-100 text-sm">Schedule Autonomous Job</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 bg-zinc-800 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Job Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily AST Security Sweep"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-100 rounded-lg p-2.5 border border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Cron Expression</label>
                  <input
                    type="text"
                    required
                    placeholder="0 * * * *"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 font-mono rounded-lg p-2.5 border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Assigned Agent</label>
                  <select
                    value={newAgentId}
                    onChange={(e) => setNewAgentId(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 rounded-lg p-2.5 border border-zinc-700 font-mono"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Agent Prompt / Task Directive</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the instructions the agent should execute on schedule..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-100 rounded-lg p-2.5 border border-zinc-700 resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Delivery Mode</label>
                <select
                  value={newDeliveryMode}
                  onChange={(e) => setNewDeliveryMode(e.target.value as any)}
                  className="w-full bg-zinc-950 text-zinc-100 rounded-lg p-2.5 border border-zinc-700 font-mono"
                >
                  <option value="announce">Announce to Discord/Slack channel</option>
                  <option value="webhook">Deliver to HTTP Webhook URL</option>
                  <option value="none">Internal only (Memory & Diary)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
