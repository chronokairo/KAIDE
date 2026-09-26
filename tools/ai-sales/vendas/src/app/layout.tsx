import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anna — Vendas',
  description: 'Assistente de Vendas do CIESA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-on-surface min-h-screen">
        {children}
      </body>
    </html>
  );
}
