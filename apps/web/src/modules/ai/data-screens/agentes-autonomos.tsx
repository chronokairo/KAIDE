"use client";

import { useState } from "react";

const agents = [
  { id: "a1", name: "Analista de Dados", avatar: "🤖", objective: "Analisar dados e gerar insights automáticos", tools: ["Web Search", "Database", "API"], status: "Ativo", lastActivity: "Análise de vendas Q1 concluída" },
  { id: "a2", name: "Assistente de Suporte", avatar: "🧠", objective: "Responder tickets de suporte nível 1 e 2", tools: ["Database", "Email", "API"], status: "Executando", lastActivity: "Respondendo ticket #4582" },
  { id: "a3", name: "Scraper Web", avatar: "🔬", objective: "Coletar e estruturar dados de fontes web", tools: ["Web Search", "API", "File System"], status: "Ativo", lastActivity: "Coleta de preços concorrentes OK" },
  { id: "a4", name: "Monitor de Sistemas", avatar: "📊", objective: "Monitorar métricas e alertar anomalias", tools: ["API", "Email", "Web Search"], status: "Ocioso", lastActivity: "Nenhuma anomalia detectada (08:00)" },
  { id: "a5", name: "Email Analyzer", avatar: "🛡️", objective: "Classificar e responder emails automatizados", tools: ["Email", "Database", "API"], status: "Ativo", lastActivity: "Classificados 145 emails hoje" },
  { id: "a6", name: "Data Quality Guardian", avatar: "⚡", objective: "Validar qualidade e consistência dos dados", tools: ["Database", "File System", "API"], status: "Executando", lastActivity: "Validando schema tabela clientes" },
];

const statusConfig: Record<string, { dot: string; bg: string; text: string }> = {
  Ativo: { dot: "bg-green-500 animate-pulse", bg: "bg-green-100", text: "text-green-700" },
  Ocioso: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  Executando: { dot: "bg-blue-500 animate-pulse", bg: "bg-blue-100", text: "text-blue-700" },
};

const timelineSteps = [
  { time: "10:32:15", step: 1, thought: "Recebendo solicitação de análise de vendas Q1", tool: "---", result: true },
  { time: "10:32:18", step: 2, thought: "Consultando banco de dados de vendas", tool: "Database", result: true },
  { time: "10:32:22", step: 3, thought: "Agregando dados por mês e categoria", tool: "Database", result: true },
  { time: "10:32:28", step: 4, thought: "Calculando variação percentual vs Q4", tool: "API", result: true },
  { time: "10:32:35", step: 5, thought: "Gerando relatório com gráficos", tool: "File System", result: true },
  { time: "10:32:42", step: 6, thought: "Enviando relatório por email para stakeholders", tool: "Email", result: true },
];

const auditLog = [
  { time: "10/05 10:32", action: "Análise Vendas Q1", status: "Concluído", duration: "27s" },
  { time: "10/05 09:15", action: "Atualização Base Clientes", status: "Concluído", duration: "1m 12s" },
  { time: "10/05 08:00", action: "Monitoramento Diário", status: "Concluído", duration: "4s" },
  { time: "09/05 23:00", action: "Backup Estrutura", status: "Concluído", duration: "45s" },
  { time: "09/05 18:30", action: "Classificação Emails", status: "Erro", duration: "12s" },
  { time: "09/05 15:00", action: "Validação Qualidade", status: "Concluído", duration: "2m 05s" },
  { time: "09/05 12:00", action: "Scraping Concorrentes", status: "Concluído", duration: "3m 30s" },
  { time: "09/05 09:00", action: "Relatório Executivo", status: "Concluído", duration: "55s" },
];

export default function AgentesAutonomosScreen() {
  const [viewMode, setViewMode] = useState<"agentes" | "detalhe" | "configurar">("agentes");
  const [selectedAgent, setSelectedAgent] = useState<(typeof agents)[0] | null>(null);

  const agent = selectedAgent ?? agents[0];

  const TabButton = ({ tab, label }: { tab: typeof viewMode; label: string }) => (
    <button onClick={() => setViewMode(tab)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === tab ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Agentes Autônomos</h2>
          <p className="text-sm text-slate-500">Painel de controle de agentes com IA</p>
        </div>
        <div className="flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
          <TabButton tab="agentes" label="📋 Agentes" />
          <TabButton tab="detalhe" label="🔍 Detalhe" />
          <TabButton tab="configurar" label="✏️ Configurar" />
        </div>
      </div>

      {viewMode === "agentes" && (
        <div className="grid grid-cols-3 gap-5">
          {agents.map((a) => (
            <button key={a.id} onClick={() => { setSelectedAgent(a); setViewMode("detalhe"); }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-cyan-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{a.avatar}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{a.name}</h3>
                    <p className="text-xs text-slate-500">{a.objective}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[a.status].bg} ${statusConfig[a.status].text}`}>
                  <span className={`h-2 w-2 rounded-full ${statusConfig[a.status].dot}`} />
                  {a.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.tools.map((tool) => (
                  <span key={tool} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">{tool}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Última atividade: {a.lastActivity}</p>
            </button>
          ))}
        </div>
      )}

      {viewMode === "detalhe" && agent && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{agent.avatar}</span>
              <div>
                <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                <p className="text-sm text-slate-500">{agent.objective}</p>
              </div>
            </div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Chain-of-Thought</h4>
            <div className="relative space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex gap-4 pb-6">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${step.result ? "bg-green-500" : "bg-red-500"}`}>{step.result ? "✓" : "✕"}</div>
                    {i < timelineSteps.length - 1 && <div className="mt-1 h-full w-0.5 bg-slate-200" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">{step.time}</span>
                      <span className="text-[10px] font-medium text-slate-500">Passo {step.step}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{step.thought}</p>
                    {step.tool !== "---" && (
                      <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">🔧 {step.tool}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Ferramentas</h4>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map((tool) => (
                <span key={tool} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">{tool}</span>
              ))}
            </div>
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Estatísticas</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sessões", value: "147" },
                  { label: "Taxa Sucesso", value: "96.3%" },
                  { label: "Tempo Médio", value: "12.4s" },
                  { label: "Passos/Sessão", value: "8.2" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "configurar" && agent && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label className="text-sm font-medium text-slate-700">Objetivo</label>
              <textarea className="mt-1 h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-cyan-400 resize-none" defaultValue={agent.objective} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ferramentas Autorizadas</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["Web Search", "Database Query", "Email Send", "API Call", "File Read", "File Write"].map((tool) => (
                  <label key={tool} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 cursor-pointer transition hover:border-cyan-300">
                    <input type="checkbox" defaultChecked={agent.tools.some((t) => tool.includes(t))} className="accent-cyan-500" />
                    {tool}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Memórias Persistentes</label>
              <textarea className="mt-1 h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-cyan-400 resize-none" defaultValue="Base de conhecimento atualizada em 10/05/2026. Preferência por análises consolidadas e reports executivos." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Máximo de Passos", value: "50" },
                { label: "Timeout (min)", value: "30" },
                { label: "Ações por Minuto", value: "10" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-sm font-medium text-slate-700">{f.label}</label>
                  <input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400" defaultValue={f.value} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600">💾 Salvar Configuração</button>
              <button className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancelar</button>
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">🛡️ Auditoria</h4>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Data/Hora</th>
                    <th className="pb-2 font-medium">Ação</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Dur.</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 text-slate-600">{log.time}</td>
                      <td className="py-2 font-medium text-slate-700">{log.action}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${log.status === "Concluído" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.status}</span>
                      </td>
                      <td className="py-2 text-slate-500">{log.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
