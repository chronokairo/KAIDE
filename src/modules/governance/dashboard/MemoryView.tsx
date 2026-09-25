import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Search, 
  BookOpen, 
  Tag, 
  Database,
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { DreamEntry } from '../types';

interface MemoryViewProps {
  dreams: DreamEntry[];
  onTriggerDreamCycle: () => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  dreams,
  onTriggerDreamCycle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDreamId, setExpandedDreamId] = useState<string>(dreams[0]?.id || '');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleTrigger = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      onTriggerDreamCycle();
    }, 1500);
  };

  const filteredDreams = dreams.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.insights.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <span>Memory Engine & Dream Diary</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Autonomous nightly transcript distillation, LanceDB active memory vector indexing, and identity persistence.
          </p>
        </div>

        <button
          onClick={handleTrigger}
          disabled={isSynthesizing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-purple-950/50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSynthesizing ? 'Distilling Knowledge...' : 'Trigger Dream Cycle'}</span>
        </button>
      </div>

      {/* Vector Index & Memory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Vector Store (LanceDB)</span>
          </div>
          <div className="text-xl font-bold text-zinc-100 font-mono">6,420</div>
          <div className="text-[11px] text-zinc-400">Embedding vectors indexed across active sessions</div>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Dream Synthesis Cycles</span>
          </div>
          <div className="text-xl font-bold text-purple-300 font-mono">48 Completed</div>
          <div className="text-[11px] text-zinc-400">Next scheduled cycle at 03:00 UTC</div>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Compacted Transcripts</span>
          </div>
          <div className="text-xl font-bold text-sky-300 font-mono">142 Sessions</div>
          <div className="text-[11px] text-zinc-400">Pruned safely into persistent long-term knowledge</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search Dream Diary & distilled insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/90 text-zinc-100 text-xs rounded-xl pl-9 pr-4 py-2 border border-zinc-800 focus:border-purple-500"
        />
      </div>

      {/* Dream Entries Accordion */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Dream Diary History & Distilled Cycles
        </h3>

        {filteredDreams.map((dream) => {
          const isExpanded = expandedDreamId === dream.id;

          return (
            <div
              key={dream.id}
              className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden"
            >
              {/* Header */}
              <div
                onClick={() => setExpandedDreamId(isExpanded ? '' : dream.id)}
                className="p-4 bg-zinc-900/90 flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{dream.title}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono">{dream.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
                    {dream.prunedSessionsCount} sessions pruned
                  </span>
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="p-5 space-y-4 border-t border-zinc-800/80 text-xs">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Cycle Executive Summary
                    </div>
                    <p className="text-zinc-200 leading-relaxed font-sans bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      {dream.summary}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Synthesized Insights & Behavioral Adjustments</span>
                    </div>
                    <ul className="space-y-1.5 pl-2">
                      {dream.insights.map((insight, idx) => (
                        <li key={idx} className="text-zinc-300 flex items-start gap-2">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Active Long-Term Knowledge Rules</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dream.distilledKnowledge.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-zinc-950 text-emerald-300 border border-emerald-500/30 font-mono text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
