"use client";

import { useState } from "react";

const savedPrompts = [
  { name: "Análise de Sentimento", preview: "Analise o sentimento do texto a seguir..." },
  { name: "Resumo Executivo", preview: "Produza um resumo executivo do relatório..." },
  { name: "Classificação de Ticket", preview: "Classifique o ticket de suporte em..." },
  { name: "Extração de Dados", preview: "Extraia as seguintes informações do documento..." },
];

const personas = [
  { name: "Assistente Técnico", avatar: "🔧", desc: "Responde dúvidas técnicas detalhadas" },
  { name: "Analista de Dados", avatar: "📊", desc: "Ajuda com análises e visualizações" },
  { name: "Atendente", avatar: "🎧", desc: "Atendimento cordial e resolutivo" },
];

const sessions = [
  { date: "10/05/2026 09:32", tokens: 2847 },
  { date: "09/05/2026 14:15", tokens: 1523 },
  { date: "08/05/2026 11:48", tokens: 3210 },
  { date: "07/05/2026 16:02", tokens: 891 },
  { date: "06/05/2026 10:30", tokens: 4376 },
];

const knowledgeBases = [
  { name: "Documentos Técnicos", type: "PDF", count: "45 docs", status: "Conectado" },
  { name: "Base de Clientes", type: "CSV", count: "12k linhas", status: "Conectado" },
  { name: "Manual do Produto", type: "PDF", count: "1 doc", status: "Conectado" },
];

export default function LLMsScreen() {
  const [activeLeftTab, setActiveLeftTab] = useState<"prompts" | "personas">("prompts");
  const [activeRightTab, setActiveRightTab] = useState<"uso" | "rag">("uso");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [selectedModel, setSelectedModel] = useState("GPT-4");

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-5">
      <div className="w-72 shrink-0 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {["Prompts", "Personas"].map((tab) => {
            const val = tab.toLowerCase() as "prompts" | "personas";
            return (
              <button key={tab} onClick={() => setActiveLeftTab(val)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${activeLeftTab === val ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{tab}</button>
            );
          })}
        </div>

        {activeLeftTab === "prompts" ? (
          <div className="space-y-2">
            <button className="w-full rounded-xl border border-dashed border-cyan-300 py-2.5 text-sm font-medium text-cyan-600 transition hover:bg-cyan-50">📝 Novo Prompt</button>
            {savedPrompts.map((p) => (
              <button key={p.name} onClick={() => setPrompt(p.preview)}
                className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50">
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{p.preview}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {personas.map((p) => (
              <button key={p.name}
                className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-cyan-300">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {[
            { role: "user", text: "Analise o sentimento do texto: 'O novo produto é incrível, superou todas as expectativas!'" },
            { role: "assistant", text: "📊 **Análise de Sentimento**\n\n**Sentimento:** Positivo 😊\n**Confiança:** 98.7%\n**Tópicos:** Produto, Satisfação, Expectativas\n\nO texto expressa uma visão claramente positiva com entusiasmo genuíno sobre o produto." },
            { role: "user", text: "Pode gerar um resumo executivo desse feedback?" },
          ].map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-cyan-500 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.text}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400" />
            <button className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600">Enviar</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Temp:</span>
              <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-20 accent-cyan-500" />
              <span className="text-xs font-medium text-slate-700">{temperature.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tokens:</span>
              <input type="range" min="100" max="4096" step="100" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} className="w-24 accent-cyan-500" />
              <span className="text-xs font-medium text-slate-700">{maxTokens}</span>
            </div>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-cyan-400">
              {["GPT-4", "GPT-3.5", "Claude-3", "Llama-3"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="w-64 shrink-0 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {["Uso", "RAG"].map((tab) => {
            const val = tab.toLowerCase() as "uso" | "rag";
            return (
              <button key={tab} onClick={() => setActiveRightTab(val)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${activeRightTab === val ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{tab}</button>
            );
          })}
        </div>

        {activeRightTab === "uso" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Tokens Consumidos</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">12,847</p>
              <div className="mt-3 h-12 flex items-end gap-1">
                {[40, 65, 35, 80, 55, 90, 70, 45, 85, 60, 95, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-cyan-400/60" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Custo Estimado</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">R$ 0,42</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Sessões Recentes</p>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.date} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs">
                    <span className="text-slate-600">{s.date}</span>
                    <span className="font-medium text-slate-700">{s.tokens.toLocaleString()} tok</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeBases.map((kb) => (
              <div key={kb.name} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{kb.name}</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">{kb.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{kb.type} — {kb.count}</p>
                <button className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Configurar</button>
              </div>
            ))}
            <button className="w-full rounded-xl border border-dashed border-cyan-300 py-3 text-sm font-medium text-cyan-600 transition hover:bg-cyan-50">➕ Conectar Nova Base</button>
          </div>
        )}
      </div>
    </div>
  );
}
