import './globals.css';
import { OrganizationProvider } from '@/providers/OrganizationProvider';
import { HarnessModeProvider } from '@/providers/HarnessModeProvider';
import { LayoutPanelsProvider } from '@/providers/LayoutPanelsProvider';
import { TauriRuntimeProvider } from '@/modules/ai/components/TauriRuntimeProvider';

export const metadata = {
  title: 'ChronoKairo Desktop',
  description: 'Ambiente Desktop com Agentes Autônomos, Automações e Ferramentas Locais',
};

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#0d0f12] text-[#f2f2f2] font-sans antialiased overflow-hidden select-none">
        <OrganizationProvider>
          <HarnessModeProvider>
            <TauriRuntimeProvider>
              <LayoutPanelsProvider>
                {children}
              </LayoutPanelsProvider>
            </TauriRuntimeProvider>
          </HarnessModeProvider>
        </OrganizationProvider>
      </body>
    </html>
  );
}
