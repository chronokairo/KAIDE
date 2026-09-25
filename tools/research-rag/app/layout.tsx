import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ThemeContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Athena - Assistente IA',
  description: 'Assistente Acadêmico RAG',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('theme');
              if (theme === 'light' || theme === 'dark') {
                document.documentElement.classList.add(theme);
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          `
        }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
