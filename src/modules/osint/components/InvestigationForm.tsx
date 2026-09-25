import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Scale, 
  UserCheck, 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  Cpu, 
  ArrowRight,
  Globe,
  RefreshCw
} from 'lucide-react';
import { InvestigationDossier, ProviderSettings } from '../types';

interface InvestigationFormProps {
  onStartInvestigation: (targetType: string, targetName: string, targetDoc: string, providerSettings: ProviderSettings) => void;
  isProcessing: boolean;
  activeDossier: InvestigationDossier | null;
  providerSettings: ProviderSettings;
  onOpenSettings: () => void;
  progressStep?: number;
  progressMessage?: string;
}

export const InvestigationForm: React.FC<InvestigationFormProps> = ({
  onStartInvestigation,
  isProcessing,
  activeDossier,
  providerSettings,
  onOpenSettings,
  progressStep,
  progressMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [targetType, setTargetType] = useState<'person' | 'company' | 'legal'>('person');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const steps = [
    'Construindo Queries OSINT...',
    'Consultando Web Harness & Base Interna...',
    'Raciocínio Investigativo via Planner (GLM-5.2) & Executor (Nemotron 550)...',
    'Gerando Grafo & Hashes SHA-256 LGPD...',
  ];

  useEffect(() => {
    if (progressStep !== undefined) {
      setCurrentStep(progressStep);
      return;
    }
    if (!isProcessing) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, [isProcessing, progressStep]);

  const displayMessage = progressMessage || steps[currentStep] || 'Processando...';

  // Helper to parse single input query into target_name, target_doc and detected target_type
  const parseQuery = (raw: string) => {
    const trimmed = raw.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');

    // CNPJ check (14 digits)
    if (digitsOnly.length === 14) {
      const formattedDoc = digitsOnly.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      return { type: 'company', name: trimmed, doc: formattedDoc };
    }
    // CPF check (11 digits)
    if (digitsOnly.length === 11) {
      const formattedDoc = digitsOnly.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
      return { type: 'person', name: trimmed, doc: formattedDoc };
    }
    // Process number pattern check (e.g. 0001429-12.2024.8.26.0100)
    if (trimmed.includes('-') && (trimmed.includes('.8.') || trimmed.includes('.8.26') || trimmed.includes('.8.04'))) {
      return { type: 'legal', name: `Processo ${trimmed}`, doc: trimmed };
    }

    // Heuristic for Company Name vs Person Name
    const lower = trimmed.toLowerCase();
    const isCompanyKeyword = lower.includes('ltda') || lower.includes('s/a') || lower.includes('sa') || lower.includes('inc') || lower.includes('grupo') || lower.includes('holding') || lower.includes('empresa') || lower.includes('me') || lower.includes('eireli');
    const autoType = isCompanyKeyword ? 'company' : targetType;

    return { type: autoType, name: trimmed, doc: '' };
  };

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    if (validationError) setValidationError(null);

    // Auto-detect type as user types
    const parsed = parseQuery(val);
    if (parsed.type && val.trim().length > 3) {
      setTargetType(parsed.type as 'person' | 'company' | 'legal');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setValidationError('Por favor, informe o Nome, CNPJ, CPF ou Número do Processo do Alvo.');
      return;
    }
    setValidationError(null);
    const parsed = parseQuery(searchQuery);
    onStartInvestigation(targetType || parsed.type, parsed.name, parsed.doc, providerSettings);
  };

  const handleQuickFill = (queryStr: string, typeVal: 'person' | 'company' | 'legal') => {
    setSearchQuery(queryStr);
    setTargetType(typeVal);
    setValidationError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Unified Single Input Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Investigação de Alvo Único (Busca Unificada)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-Detecção: Nome • CPF • CNPJ • Processo
            </span>
          </div>

          {/* Unified Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Digite o Nome Completo, Razão Social, CPF, CNPJ ou Número do Processo..."
              className={`w-full pl-5 pr-12 py-4 rounded-xl bg-slate-900/90 border text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:ring-2 font-mono transition-all shadow-inner ${
                validationError
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
              }`}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="absolute right-2 top-2 bottom-2 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Investigar</span>
            </button>
          </div>
        </div>

        {/* Target Type Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Escopo do Alvo:</span>
            <button
              type="button"
              onClick={() => setTargetType('person')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                targetType === 'person'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Pessoa Física
            </button>

            <button
              type="button"
              onClick={() => setTargetType('company')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                targetType === 'company'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Pessoa Jurídica
            </button>

            <button
              type="button"
              onClick={() => setTargetType('legal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                targetType === 'legal'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Processo
            </button>
          </div>

          {/* Quick-fill Example Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Exemplos:</span>
            <button
              type="button"
              onClick={() => handleQuickFill('Grupo Areosa Ltda (04.123.456/0001-89)', 'company')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-400 font-mono border border-slate-800 transition-all"
            >
              + Grupo Areosa (CNPJ)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Carlos Eduardo Areosa (123.456.789-00)', 'person')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-purple-400 font-mono border border-slate-800 transition-all"
            >
              + Carlos Areosa (CPF)
            </button>
          </div>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium font-mono flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Processing Step Tracker */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-medium font-mono">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {displayMessage}
              </span>
              <span>Passo {currentStep + 1} de {steps.length}</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action & Model Info Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> IA primária: <strong className="text-slate-200">
                {providerSettings.primaryAiProvider === 'nvidia' ? 'NVIDIA NIM' : providerSettings.primaryAiProvider === 'kilo' ? 'Kilo Code ACP' : 'OpenCode ACP'}
              </strong>
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Modelo: <strong className="text-slate-200">
                {providerSettings.primaryAiProvider === 'nvidia' ? providerSettings.nvidiaExecutorModel : providerSettings.primaryAiProvider === 'kilo' ? providerSettings.kiloModel : providerSettings.openCodeModel}
              </strong>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> LGPD Audit SHA-256
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 border border-cyan-300/30 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Processando no Harness OSINT...
              </>
            ) : (
              <>
                Iniciar Investigação OSINT <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
