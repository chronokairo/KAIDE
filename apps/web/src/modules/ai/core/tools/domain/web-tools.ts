import type { AiToolDefinition, DomainToolMetadata } from './types';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'core', sensitivity: 'public', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const webTools: AiToolDefinition[] = [
  {
    name: 'web.search',
    description: 'Busca informações na web usando um provedor de busca configurado.',
    domain: 'Core',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('web.search'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { query: string; maxResults?: number };
      if (!input.query) throw new Error('query é obrigatório.');

      // Placeholder - in production, integrate with Tavily, SerpAPI, or Exa
      // For now, return a structured response indicating the tool is available
      return {
        query: input.query,
        results: [],
        message: 'Web search tool is available but requires API key configuration. Set NEXT_PUBLIC_WEB_SEARCH_API_KEY environment variable.',
        provider: process.env.NEXT_PUBLIC_WEB_SEARCH_PROVIDER || 'none',
      };
    },
  },
  {
    name: 'web.fetch',
    description: 'Busca conteúdo de uma URL e extrai texto.',
    domain: 'Core',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('web.fetch'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { url: string };
      if (!input.url) throw new Error('url é obrigatória.');

      try {
        const response = await fetch(input.url, {
          headers: {
            'User-Agent': 'Chronokairo-ERP/1.0',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          return { url: input.url, error: `HTTP ${response.status}`, content: null };
        }

        const html = await response.text();

        // Simple HTML to text extraction
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000); // Limit to 5000 chars

        return { url: input.url, content: text, length: text.length };
      } catch (error) {
        return { url: input.url, error: error instanceof Error ? error.message : 'Fetch failed', content: null };
      }
    },
  },
  {
    name: 'browser.scrape',
    description: 'Acessa uma página web pública, extrai o texto semântico e detecta contatos comerciais (e-mails, telefones, CNPJ, links sociais).',
    domain: 'Core',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('browser.scrape'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { url: string };
      if (!input.url) throw new Error('url é obrigatória.');

      try {
        const { harnessClient } = await import('@/modules/dev/harness-client');
        const res = await harnessClient.scrapePage(input.url);
        return res.data || { url: input.url, error: 'Falha na extração', contacts: null };
      } catch (err) {
        return { url: input.url, error: String(err), contacts: null };
      }
    },
  },
  {
    name: 'browser.validate_cnpj',
    description: 'Valida dígitos verificadores e formata um CNPJ de empresa brasileira.',
    domain: 'Core',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('browser.validate_cnpj'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { cnpj: string };
      if (!input.cnpj) throw new Error('cnpj é obrigatório.');

      try {
        const { harnessClient } = await import('@/modules/dev/harness-client');
        const res = await harnessClient.validateCnpj(input.cnpj);
        return res.data || { ok: false, error: 'Validação falhou' };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
  },
  {
    name: 'browser.extract_contacts',
    description: 'Varre um texto livre ou documento e extrai e-mails, telefones do Brasil, CNPJs e perfis sociais.',
    domain: 'Core',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('browser.extract_contacts'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { text: string };
      if (!input.text) throw new Error('text é obrigatório.');

      try {
        const { harnessClient } = await import('@/modules/dev/harness-client');
        const res = await harnessClient.extractContacts(input.text);
        return res.data || { emails: [], phones: [], cnpjs: [], social_links: [] };
      } catch (err) {
        return { error: String(err), emails: [], phones: [], cnpjs: [], social_links: [] };
      }
    },
  },
];

export const WEB_DOMAIN_TOOLS = webTools;
