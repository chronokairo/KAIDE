import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IA — Chronokairo AI Enterprise",
  description: "Módulos de Inteligência Artificial: modelos, LLMs, NLP, visão computacional e agentes.",
};

export default function IALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
