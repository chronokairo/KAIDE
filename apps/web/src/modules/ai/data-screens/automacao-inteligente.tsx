"use client";

import { useState } from "react";

const blockCategories = [
  {
    name: "Gatilhos",
    blocks: [
      { id: "trigger-1", icon: "⏰", label: "Agendamento" },
      { id: "trigger-2", icon: "📧", label: "Email Recebido" },
      { id: "trigger-3", icon: "🔗", label: "Webhook" },
      { id: "trigger-4", icon: "📁", label: "Arquivo Novo" },
    ],
  },
  {
    name: "Condições",
    blocks: [
      { id: "cond-1", icon: "🔀", label: "Se/Então" },
      { id: "cond-2", icon: "🔍", label: "Filtro" },
      { id: "cond-3", icon: "📐", label: "Comparação" },
    ],
  },
  {
    name: "Ações de IA",
    blocks: [
      { id: "ai-1", icon: "🤖", label: "Chamar Modelo" },
      { id: "ai-2", icon: "📝", label: "Gerar Texto" },
      { id: "ai-3", icon: "🏷️", label: "Classificar" },
    ],
  },
  {
    name: "Ações Resultantes",
    blocks: [
      { id: "action-1", icon: "📧", label: "Enviar Email" },
      { id: "action-2", icon: "💾", label: "Atualizar BD" },
      { id: "action-3", icon: "🔌", label: "Acionar API" },
      { id: "action-4", icon: "📄", label: "Gerar Relatório" },
    ],
  },
];

const initialFlowBlocks = [
  { id: "f1", icon: "⏰", label: "Agendamento", subtitle: "Diário 08:00", type: "trigger" },
  { id: "f2", icon: "🔍", label: "Filtrar Novos Pedidos", subtitle: "", type: "condition" },
  { id: "f3", icon: "🤖", label: "Classificar Prioridade", subtitle: "", type: "ai" },
  { id: "f4", icon: "🔀", label: "Se Prioridade Alta", subtitle: "", type: "condition" },
  { id: "f5", icon: "📧", label: "Notificar Gerente", subtitle: "", type: "action" },
  { id: "f6", icon: "💾", label: "Atualizar CRM", subtitle: "", type: "action" },
];

const executionHistory = [
  { id: "e1", date: "10/05/2026 08:00", status: "Sucesso", duration: "1.2s", path: "Agendamento → Filtrar → Classificar → Alta → Notificar Gerente → Atualizar CRM" },
  { id: "e2", date: "09/05/2026 08:00", status: "Sucesso", duration: "1.5s", path: "Agendamento → Filtrar → Classificar → Alta → Notificar Gerente → Atualizar CRM" },
  { id: "e3", date: "08/05/2026 08:00", status: "Erro", duration: "0.8s", path: "Agendamento → Filtrar → [Falha no modelo de classificação]" },
  { id: "e4", date: "07/05/2026 08:00", status: "Sucesso", duration: "1.3s", path: "Agendamento → Filtrar → Classificar → Média → Atualizar CRM" },
  { id: "e5", date: "06/05/2026 08:00", status: "Sucesso", duration: "1.1s", path: "Agendamento → Filtrar → Classificar → Alta → Notificar Gerente → Atualizar CRM" },
  { id: "e6", date: "05/05/2026 08:00", status: "Sucesso", duration: "1.4s", path: "Agendamento → Filtrar → Classificar → Baixa → Atualizar CRM" },
];

const flowArrows = [
  { from: "f1", to: "f2" },
  { from: "f2", to: "f3" },
  { from: "f3", to: "f4" },
  { from: "f4", to: "f5" },
  { from: "f4", to: "f6" },
];

const typeColors: Record<string, string> = {
  trigger: "border-blue-300 bg-blue-50 text-blue-800",
  condition: "border-amber-300 bg-amber-50 text-amber-800",
  ai: "border-violet-300 bg-violet-50 text-violet-800",
  action: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export default function AutomacaoInteligenteScreen() {
  const [blocks] = useState(initialFlowBlocks);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const getBlockById = (id: string) => blocks.find((b) => b.id === id);

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-5">
      <div className="w-64 shrink-0 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Blocos Disponíveis</h3>
        {blockCategories.map((cat) => (
          <div key={cat.name}>
            <p className="mb-2 text-xs font-medium text-slate-600">{cat.name}</p>
            <div className="space-y-1.5">
              {cat.blocks.map((b) => (
                <button key={b.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-700">
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative flex-1 overflow-auto bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[length:24px_24px] p-8">
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {flowArrows.map((arrow, i) => {
              const fromBlock = getBlockById(arrow.from);
              const toBlock = getBlockById(arrow.to);
              if (!fromBlock || !toBlock) return null;
              const fromIdx = blocks.indexOf(fromBlock);
              const toIdx = blocks.indexOf(toBlock);
              const row = Math.floor(fromIdx / 3);
              const col = fromIdx % 3;
              const toRow = Math.floor(toIdx / 3);
              const toCol = toIdx % 3;
              const x1 = 180 + col * 220 + 100;
              const y1 = 40 + row * 120 + 40;
              const x2 = 180 + toCol * 220;
              const y2 = 40 + toRow * 120 + 40;
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#06b6d4" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrowhead)" />
              );
            })}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
              </marker>
            </defs>
          </svg>

          <div className="relative flex flex-wrap gap-6">
            {blocks.map((block, i) => (
              <div key={block.id}
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => setHoveredBlock(null)}
                className="relative flex w-[200px] flex-col items-center">
                <div className={`relative w-full rounded-xl border-2 p-4 text-center shadow-sm transition ${typeColors[block.type]} ${hoveredBlock === block.id ? "shadow-md scale-105" : ""}`}>
                  <span className="text-2xl">{block.icon}</span>
                  <p className="mt-1 text-sm font-semibold">{block.label}</p>
                  {block.subtitle && <p className="text-xs opacity-70">{block.subtitle}</p>}
                  {hoveredBlock === block.id && (
                    <button className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow transition hover:bg-red-600">✕</button>
                  )}
                </div>
                {i < blocks.length - 1 && (
                  <div className="mt-1 text-cyan-400 text-xs">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-cyan-600">
            📋 Histórico de Execuções {showHistory ? "▲" : "▼"}
          </button>
          {showHistory && (
            <div className="mt-3 max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Data/Hora</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Duração</th>
                    <th className="pb-2 font-medium">Caminho</th>
                  </tr>
                </thead>
                <tbody>
                  {executionHistory.map((ex) => (
                    <tr key={ex.id} onClick={() => setSelectedExecution(selectedExecution === ex.id ? null : ex.id)}
                      className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${selectedExecution === ex.id ? "bg-cyan-50" : ""}`}>
                      <td className="py-2 text-slate-700">{ex.date}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ex.status === "Sucesso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ex.status}</span>
                      </td>
                      <td className="py-2 text-slate-600">{ex.duration}</td>
                      <td className="py-2 text-xs text-slate-500">{ex.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedExecution && (
            <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm font-medium text-cyan-800">Detalhamento do Fluxo</p>
              {executionHistory.find((e) => e.id === selectedExecution)?.path.split(" → ").map((step, i) => (
                <div key={i} className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${step.includes("Falha") ? "bg-red-500" : "bg-green-500"}`}>{step.includes("Falha") ? "✕" : "✓"}</span>
                  <span className={step.includes("Falha") ? "text-red-600" : "text-slate-700"}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
