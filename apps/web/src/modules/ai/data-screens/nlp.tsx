"use client";

import { useState } from "react";

const tasks = [
  { id: "sentimento", icon: "😊", label: "Análise de Sentimento" },
  { id: "entidades", icon: "🏷️", label: "Extração de Entidades" },
  { id: "classificacao", icon: "📑", label: "Classificação de Texto" },
  { id: "sumarizacao", icon: "📝", label: "Sumarização" },
  { id: "traducao", icon: "🌐", label: "Tradução" },
];

const sampleText = "A nova plataforma de dados superou nossas expectativas. O time de engenharia conseguiu reduzir o tempo de processamento em 40% e a equipe de vendas já está utilizando os dashboards diariamente. O CFO ficou impressionado com a redução de custos na infraestrutura.";

const resultContent: Record<string, { type: string; data: unknown }> = {
  sentimento: {
    type: "sentiment",
    data: {
      polarity: 0.87,
      label: "Positivo",
      smiley: "😊",
      details: { positivo: 0.87, neutro: 0.10, negativo: 0.03 },
    },
  },
  entidades: {
    type: "entities",
    data: {
      tokens: [
        { text: "plataforma de dados", label: "ORG", color: "bg-blue-200 text-blue-800" },
        { text: "time de engenharia", label: "ORG", color: "bg-blue-200 text-blue-800" },
        { text: "40%", label: "PERCENT", color: "bg-amber-200 text-amber-800" },
        { text: "equipe de vendas", label: "ORG", color: "bg-blue-200 text-blue-800" },
        { text: "CFO", label: "PERSON", color: "bg-green-200 text-green-800" },
        { text: "infraestrutura", label: "MISC", color: "bg-purple-200 text-purple-800" },
      ],
    },
  },
  classificacao: {
    type: "classification",
    data: {
      categories: [
        { name: "Tecnologia", confidence: 0.92 },
        { name: "Negócios", confidence: 0.78 },
        { name: "Finanças", confidence: 0.65 },
        { name: "Recursos Humanos", confidence: 0.31 },
      ],
    },
  },
  sumarizacao: {
    type: "summarization",
    data: {
      summary: "A nova plataforma de dados trouxe melhorias significativas para a empresa, reduzindo o tempo de processamento em 40% e impressionando a diretoria financeira com a redução de custos em infraestrutura. As equipes de engenharia e vendas já adotaram a ferramenta no dia a dia.",
    },
  },
  traducao: {
    type: "translation",
    data: {
      source: sampleText,
      target: "The new data platform exceeded our expectations. The engineering team managed to reduce processing time by 40% and the sales team is already using the dashboards daily. The CFO was impressed with the cost reduction in infrastructure.",
      sourceLang: "Português (PT-BR)",
      targetLang: "Inglês (EN)",
    },
  },
};

export default function NLPScreen() {
  const [selectedTask, setSelectedTask] = useState("sentimento");
  const [inputText, setInputText] = useState(sampleText);
  const [showResults, setShowResults] = useState(false);

  const task = tasks.find((t) => t.id === selectedTask);
  const result = resultContent[selectedTask];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Processamento de Linguagem Natural</h2>
        <p className="text-sm text-slate-500">Análise de sentimento, entidades, classificação, sumarização e tradução</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tasks.map((t) => (
          <button key={t.id} onClick={() => { setSelectedTask(t.id); setShowResults(false); }}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              selectedTask === t.id
                ? "border-cyan-400 bg-cyan-50 text-cyan-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Texto de Entrada</label>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
              className="mt-2 h-52 w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 resize-none"
              placeholder="Digite ou cole o texto aqui..." />
            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => setShowResults(true)}
                className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600">Processar</button>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                📤 Upload Documento
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {task?.icon} {task?.label}
          </h3>

          {showResults ? (
            <>
              {result.type === "sentiment" && (() => {
                const d = result.data as { polarity: number; label: string; smiley: string; details: Record<string, number> };
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{d.smiley}</span>
                      <div>
                        <p className="text-xl font-bold text-slate-900">{d.label}</p>
                        <p className="text-sm text-slate-500">Polaridade: {d.polarity.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-500" style={{ width: `${d.polarity * 100}%` }} />
                    </div>
                    <div className="flex gap-2 text-xs">
                      {Object.entries(d.details).map(([k, v]) => (
                        <span key={k} className="rounded-full border px-2 py-1 text-slate-600">{k}: {(v * 100).toFixed(0)}%</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {result.type === "entities" && (() => {
                const d = result.data as { tokens: Array<{ text: string; label: string; color: string }> };
                return (
                  <div className="space-y-3">
                    <p className="text-sm leading-8 text-slate-700">
                      {d.tokens.map((t, i) => (
                        <span key={i} className={`inline-block rounded-md px-1.5 py-0.5 mx-0.5 text-xs font-medium ${t.color}`}>{t.text}
                          <span className="ml-0.5 text-[10px] opacity-70">[{t.label}]</span>
                        </span>
                      ))}
                    </p>
                    <div className="mt-3 flex gap-2 text-xs">
                      {["PERSON", "ORG", "PERCENT", "MISC"].map((lbl) => {
                        const colors: Record<string, string> = { PERSON: "bg-green-200 text-green-800", ORG: "bg-blue-200 text-blue-800", PERCENT: "bg-amber-200 text-amber-800", MISC: "bg-purple-200 text-purple-800" };
                        return <span key={lbl} className={`rounded px-2 py-0.5 font-medium ${colors[lbl]}`}>{lbl}</span>;
                      })}
                    </div>
                  </div>
                );
              })()}

              {result.type === "classification" && (() => {
                const d = result.data as { categories: Array<{ name: string; confidence: number }> };
                return (
                  <div className="space-y-3">
                    {d.categories.map((c) => (
                      <div key={c.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{c.name}</span>
                          <span className="text-slate-500">{(c.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-1 h-3 w-full rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${c.confidence * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {result.type === "summarization" && (() => {
                const d = result.data as { summary: string };
                return (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-700">{d.summary}</p>
                  </div>
                );
              })()}

              {result.type === "translation" && (() => {
                const d = result.data as { source: string; target: string; sourceLang: string; targetLang: string };
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">{d.sourceLang}</p>
                      <p className="text-sm leading-relaxed text-slate-700">{d.source}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">{d.targetLang}</p>
                      <p className="text-sm leading-relaxed text-slate-700">{d.target}</p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-slate-400">Clique em "Processar" para ver os resultados</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-slate-600">Integração:</span>
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700">🔗 Conectar a Pipeline de Dados</button>
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700">⚡ Vincular a Fluxo de Automação</button>
      </div>
    </div>
  );
}
