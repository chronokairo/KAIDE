"use client";

import { useState } from "react";

const datasets = [
  { id: "d1", name: "Produtos_2024", images: 12453, annotated: true, color: "bg-blue-100" },
  { id: "d2", name: "Clientes_Faces", images: 8921, annotated: true, color: "bg-green-100" },
  { id: "d3", name: "Documentos_OCR", images: 5678, annotated: true, color: "bg-amber-100" },
  { id: "d4", name: "Placas_Veículos", images: 4210, annotated: true, color: "bg-rose-100" },
  { id: "d5", name: "Quality_Control", images: 7890, annotated: true, color: "bg-violet-100" },
  { id: "d6", name: "Segurança", images: 15234, annotated: true, color: "bg-cyan-100" },
];

const metrics = [
  { class: "Produto_A", precision: 96.2, recall: 94.8 },
  { class: "Produto_B", precision: 93.5, recall: 91.2 },
  { class: "Defeito", precision: 88.7, recall: 85.3 },
  { class: "Embalagem", precision: 95.1, recall: 93.6 },
];

const viewTabs = [
  { id: "anotar", icon: "🖼️", label: "Anotar" },
  { id: "inferencia", icon: "🔍", label: "Inferência" },
  { id: "camera", icon: "📹", label: "Câmera ao Vivo" },
];

export default function VisaoComputacionalScreen() {
  const [selectedDataset, setSelectedDataset] = useState(datasets[0].id);
  const [viewMode, setViewMode] = useState<"anotar" | "inferencia" | "camera">("anotar");
  const [selectedModel, setSelectedModel] = useState("YOLOv8");
  const [isStreaming, setIsStreaming] = useState(false);
  const [datasetSearch, setDatasetSearch] = useState("");

  const filteredDatasets = datasets.filter((d) => d.name.toLowerCase().includes(datasetSearch.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-5">
      <div className="w-64 shrink-0 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datasets</h3>
        <input value={datasetSearch} onChange={(e) => setDatasetSearch(e.target.value)} placeholder="Buscar datasets..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400" />
        <div className="grid grid-cols-2 gap-3">
          {filteredDatasets.map((ds) => (
            <button key={ds.id} onClick={() => setSelectedDataset(ds.id)}
              className={`rounded-xl border-2 p-3 text-left transition hover:shadow-sm ${selectedDataset === ds.id ? "border-cyan-400 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
              <div className={`flex h-16 items-center justify-center rounded-lg ${ds.color} mb-2`}>
                <span className="text-2xl">📷</span>
              </div>
              <p className="text-xs font-medium text-slate-800 truncate">{ds.name}</p>
              <p className="text-[10px] text-slate-400">{ds.images.toLocaleString()} img</p>
              {ds.annotated && <span className="mt-1 inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">🖍️ Annotated</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          {viewTabs.map((tab) => (
            <button key={tab.id} onClick={() => setViewMode(tab.id as "anotar" | "inferencia" | "camera")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === tab.id ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          {viewMode === "anotar" && (
            <div className="relative w-full max-w-2xl">
              <div className="flex gap-2 mb-4">
                {["🖍️ Bounding Box", "🏷️ Label", "✂️ Segmentação"].map((tool) => (
                  <button key={tool} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50">{tool}</button>
                ))}
              </div>
              <div className="relative aspect-[4/3] w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-4">
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl opacity-30">🖼️</span>
                </div>
                <div className="absolute left-[20%] top-[25%] rounded-lg border-2 border-blue-500 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700">Produto_A</div>
                <div className="absolute right-[25%] bottom-[30%] rounded-lg border-2 border-green-500 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700">Produto_B</div>
                <div className="absolute left-[40%] top-[55%] rounded-lg border-2 border-red-500 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700">Defeito</div>
              </div>
            </div>
          )}
          {viewMode === "inferencia" && (
            <div className="relative w-full max-w-2xl">
              <div className="relative aspect-[4/3] w-full rounded-2xl border-2 border-slate-200 bg-slate-100 p-4">
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl opacity-30">🔍</span>
                </div>
                <div className="absolute left-[20%] top-[25%] rounded-lg border-2 border-cyan-500 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700">Produto_A <span className="font-bold">98.2%</span></div>
                <div className="absolute right-[25%] bottom-[30%] rounded-lg border-2 border-cyan-500 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700">Produto_B <span className="font-bold">94.7%</span></div>
                <div className="absolute left-[40%] top-[55%] rounded-lg border-2 border-orange-500 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-700">Defeito <span className="font-bold">87.3%</span></div>
              </div>
            </div>
          )}
          {viewMode === "camera" && (
            <div className="w-full max-w-2xl space-y-4">
              <div className="relative flex aspect-[4/3] w-full items-center justify-center rounded-2xl border-2 border-slate-700 bg-slate-900">
                <span className="text-6xl">📹</span>
                {isStreaming && (
                  <span className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Streaming
                  </span>
                )}
              </div>
              <button onClick={() => setIsStreaming(!isStreaming)}
                className={`w-full rounded-xl py-3 text-sm font-medium text-white transition ${isStreaming ? "bg-red-500 hover:bg-red-600" : "bg-cyan-500 hover:bg-cyan-600"}`}>
                {isStreaming ? "⏹️ Parar" : "▶️ Iniciar"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-72 shrink-0 space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="text-xs font-medium text-slate-500">Modelo</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400">
            {["YOLOv8", "ResNet-50", "EfficientDet"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium text-slate-500">Métricas por Classe</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Classe</th>
                <th className="pb-2 font-medium">Precision</th>
                <th className="pb-2 font-medium">Recall</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.class} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{m.class}</td>
                  <td className="py-2 text-slate-600">{m.precision}%</td>
                  <td className="py-2 text-slate-600">{m.recall}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <button className="w-full rounded-xl border border-cyan-300 bg-cyan-50 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100">📤 Exportar Modelo</button>
          <button className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">📊 Ver Métricas Completas</button>
        </div>
      </div>
    </div>
  );
}
