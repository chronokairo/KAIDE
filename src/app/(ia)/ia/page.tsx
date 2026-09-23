"use client";

import Link from "next/link";

const iaModules = [
  {
    name: "Modelos de IA",
    icon: "🧠",
    desc: "Catálogo e gestão de modelos preditivos com métricas, versões e endpoints",
    href: "/ia/modelos-de-ia",
    color: "border-l-cyan-500",
  },
  {
    name: "LLMs",
    icon: "💬",
    desc: "Playground interativo para linguagem natural com prompts, personas e RAG",
    href: "/ia/llms",
    color: "border-l-violet-500",
  },
  {
    name: "Automação Inteligente",
    icon: "⚡",
    desc: "Construtor visual de fluxos automatizados com blocos de IA",
    href: "/ia/automacao-inteligente",
    color: "border-l-amber-500",
  },
  {
    name: "NLP",
    icon: "📝",
    desc: "Processamento de linguagem natural: sentimento, entidades, classificação e tradução",
    href: "/ia/nlp",
    color: "border-l-emerald-500",
  },
  {
    name: "Visão Computacional",
    icon: "👁️",
    desc: "Análise de imagens e vídeos com anotação, inferência e câmera ao vivo",
    href: "/ia/visao-computacional",
    color: "border-l-rose-500",
  },
  {
    name: "Agentes Autônomos",
    icon: "🤖",
    desc: "Painel de controle de agentes IA com chain-of-thought e auditoria",
    href: "/ia/agentes-autonomos",
    color: "border-l-blue-500",
  },
];

export default function IAPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400">
              🤖 Inteligência Artificial
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Módulo de IA
            </h2>
            <p className="text-base leading-7 text-slate-400">
              Seis submódulos que cobrem o ciclo completo de inteligência artificial:
              modelos preditivos, LLMs, automação inteligente, NLP, visão computacional
              e agentes autônomos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 shrink-0">
            {[
              { label: "Submódulos", value: "6" },
              { label: "Modelos", value: "8" },
              { label: "Agentes", value: "6" },
            ].map((m) => (
              <div key={m.label} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-sm text-slate-400">{m.label}</p>
                <p className="mt-1 text-3xl font-semibold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {iaModules.map((mod) => (
          <Link
            key={mod.name}
            href={mod.href}
            className={`rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.3)] transition hover:bg-white/10 border-l-4 ${mod.color}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{mod.icon}</span>
              <h3 className="text-lg font-semibold text-white">{mod.name}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{mod.desc}</p>
            <div className="mt-4 flex items-center text-xs font-medium text-cyan-400">
              Acessar →
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
