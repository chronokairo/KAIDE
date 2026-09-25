import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NVIDIA LLM Ranking",
  description: "Recomendacao automatica de modelo NVIDIA por latencia e disponibilidade",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
