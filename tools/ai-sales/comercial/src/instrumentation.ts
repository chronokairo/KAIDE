/**
 * Next.js Instrumentation — executa no startup do servidor Node.js.
 * Registra handlers globais para impedir que unhandled rejections
 * derrubem o processo durante o desenvolvimento.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason: unknown) => {
      console.error('[ANNA] ⚠️  Unhandled Promise Rejection:', reason);
      // NÃO relança — evita crash do servidor em dev
    });

    process.on('uncaughtException', (error: Error) => {
      // Log mas não para o servidor em dev
      console.error('[ANNA] ⚠️  Uncaught Exception:', error?.message ?? error);
      console.error(error?.stack ?? '');
    });
  }
}
