import './globals.css';
import { OrganizationProvider } from '@/providers/OrganizationProvider';
import { HarnessModeProvider } from '@/providers/HarnessModeProvider';
import { LayoutPanelsProvider } from '@/providers/LayoutPanelsProvider';
import { TauriRuntimeProvider } from '@/modules/ai/components/TauriRuntimeProvider';

export const metadata = {
  title: 'ChronoKairo AI',
  description: 'ChronoKairo AI Platform & Coding Agent',
};

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-sans antialiased overflow-hidden select-none">
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
