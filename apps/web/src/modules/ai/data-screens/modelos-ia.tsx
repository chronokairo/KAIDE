"use client";

import { useState } from "react";

const models = [
  { id: "1", name: "Previsão de Churn", type: "Classificação", icon: "📉", accuracy: 94.2, date: "2024-12-15", status: "Em Produção" },
  { id: "2", name: "Score de Crédito", type: "Regressão", icon: "💰", accuracy: 91.7, date: "2025-01-20", status: "Em Produção" },
  { id: "3", name: "Segmentação Clientes", type: "Clusterização", icon: "👥", accuracy: 88.3, date: "2025-02-10", status: "Treinando" },
  { id: "4", name: "Detecção Fraude", type: "Classificação", icon: "🛡️", accuracy: 97.1, date: "2025-03-05", status: "Em Produção" },
  { id: "5", name: "Recomendação Produtos", type: "NLP", icon: "🎯", accuracy: 85.6, date: "2025-01-28", status: "Aguardando" },
  { id: "6", name: "Classificação NPS", type: "Classificação", icon: "⭐", accuracy: 89.4, date: "2024-11-22", status: "Em Produção" },
  { id: "7", name: "Previsão Demanda", type: "Regressão", icon: "📊", accuracy: 93.8, date: "2025-03-12", status: "Treinando" },
  { id: "8", name: "Anomalia Estoque", type: "Visão", icon: "🔍", accuracy: 96.5, date: "2025-02-28", status: "Em Produção" },
];

const typeColors: Record<string, string> = {
  Classificação: "bg-blue-100 text-blue-700",
  Regressão: "bg-emerald-100 text-emerald-700",
  Clusterização: "bg-violet-100 text-violet-700",
  NLP: "bg-amber-100 text-amber-700",
  Visão: "bg-rose-100 text-rose-700",
};

const statusStyles: Record<string, string> = {
  "Em Produção": "bg-green-100 text-green-700 border-green-300",
  Treinando: "bg-amber-100 text-amber-700 border-amber-300",
  Aguardando: "bg-slate-100 text-slate-600 border-slate-300",
};

const features = [
  { name: "receita_ultimo_mes", importance: 0.92 },
  { name: "frequencia_compra", importance: 0.87 },
  { name: "ticket_medio", importance: 0.81 },
  { name: "dias_ultima_compra", importance: 0.74 },
  { name: "categoria_preferida", importance: 0.65 },
  { name: "regiao_cliente", importance: 0.52 },
  { name: "produto_mais_visto", importance: 0.48 },
  { name: "forma_pagamento", importance: 0.41 },
];

const versions = [
  { version: "v3.2.1", date: "2025-03-15", accuracy: 94.2, status: "Atual" },
  { version: "v3.2.0", date: "2025-02-28", accuracy: 93.6, status: "Arquivada" },
  { version: "v3.1.0", date: "2025-01-10", accuracy: 91.8, status: "Arquivada" },
  { version: "v3.0.0", date: "2024-11-20", accuracy: 88.4, status: "Arquivada" },
  { version: "v2.5.0", date: "2024-09-05", accuracy: 85.1, status: "Arquivada" },
];

function CircularProgress({ value, size = 56 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} className="text-cyan-500" strokeLinecap="round" />
    </svg>
  );
}

export default function ModelosIAScreen() {
  const [viewMode, setViewMode] = useState<"catalogo" | "detalhe">("catalogo");
  const [selectedModel, setSelectedModel] = useState<(typeof models)[0] | null>(null);

  const handleSelect = (m: (typeof models)[0]) => {
    setSelectedModel(m);
    setViewMode("detalhe");
  };

  const selected = selectedModel ?? models[0];

  if (viewMode === "detalhe" && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode("catalogo")} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">← Voltar</button>
            <span className="text-2xl">{selected.icon}</span>
            <h2 className="text-2xl font-semibold text-slate-900">{selected.name}</h2>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${typeColors[selected.type]}`}>{selected.type}</span>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusStyles[selected.status]}`}>{selected.status}</span>
          </div>
          <div className="flex gap-2">
            {["🔄 Retreinar", "📝 Versionar", "🚀 Publicar", "📊 Monitorar"].map((btn) => (
              <button key={btn} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700">{btn}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Acurácia", value: "94,2%", pct: 94 },
            { label: "Precisão", value: "92,8%", pct: 93 },
            { label: "Recall", value: "89,5%", pct: 90 },
            { label: "F1-Score", value: "91,1%", pct: 91 },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{m.value}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Importância das Features</h3>
            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="w-44 text-sm text-slate-700">{f.name}</span>
                  <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600" style={{ width: `${f.importance * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs font-medium text-slate-500">{(f.importance * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Histórico de Versões</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 font-medium">Versão</th>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Acurácia</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.version} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{v.version}</td>
                    <td className="py-2 text-slate-600">{v.date}</td>
                    <td className="py-2 text-slate-700">{v.accuracy}%</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.status === "Atual" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Endpoint da API</h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">https://api.dadosia.com/v1/models/{selected.id}/predict</code>
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-cyan-50 hover:border-cyan-400">📋 Copiar</button>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-600">Chave de Autenticação</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 outline-none focus:border-cyan-400" defaultValue="sk-proj-4f8a...3b2c" readOnly />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Modelos de IA</h2>
          <p className="text-sm text-slate-500">Catálogo e gestão de modelos preditivos</p>
        </div>
        <div className="flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
          {["📦 Catálogo", "📋 Detalhe"].map((tab) => {
            const val = tab.includes("Catálogo") ? "catalogo" : "detalhe";
            return (
              <button key={tab} onClick={() => { setViewMode(val as "catalogo" | "detalhe"); if (val === "catalogo") setSelectedModel(null); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === val ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{tab}</button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {models.map((m) => (
          <button key={m.id} onClick={() => handleSelect(m)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-cyan-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <h3 className="font-semibold text-slate-900">{m.name}</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[m.type]}`}>{m.type}</span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CircularProgress value={m.accuracy} />
                <span className="text-sm font-medium text-slate-600">{m.accuracy}%</span>
              </div>
              <div className="text-xs text-slate-400">Treinado em {m.date}</div>
            </div>
            <div className="mt-4">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[m.status]}`}>{m.status}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
