'use client';

import React, { useState } from 'react';
import { useHarnessSkills } from '@/modules/dev/hooks/useHarness';

interface SkillsBrowserProps {
  workspace?: string;
}

export const SkillsBrowser: React.FC<SkillsBrowserProps> = ({ workspace }) => {
  const { result: skillsResult, loading, error } = useHarnessSkills(workspace);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const skills = skillsResult?.data ?? [];
  
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || skill.source === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(skills.map((s) => s.source).filter((s): s is string => Boolean(s))));

  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[14px]">error</span>
          <p className="text-[10px] text-red-700">{error}</p>
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/40 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary">Skills</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {skills.length} skills disponíveis
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-outline-variant/30 space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar skills..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F8FAFC] border border-outline-variant/60 text-xs focus:outline-none focus:ring-1 focus:ring-secondary text-primary placeholder:text-on-surface-variant/50"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Todas ({skills.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat} ({skills.filter((s) => s.source === cat).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skills List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant text-xs">
            <span className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin mx-auto" />
            <p className="mt-2">Carregando skills...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-3xl opacity-30">psychology</span>
            <p className="mt-2">Nenhuma skill encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {filteredSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-4 hover:bg-surface-container-low/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary">{skill.name}</span>
                      {skill.source && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-surface-container text-on-surface-variant">
                          {skill.source}
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                        {skill.description}
                      </p>
                    )}
                  </div>
                </div>

                {skill.body && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-container-high text-on-surface-variant line-clamp-1">
                      {skill.body.substring(0, 80)}...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
