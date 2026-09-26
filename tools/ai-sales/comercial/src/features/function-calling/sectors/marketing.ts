import type { SectorToolSet } from '@ciesa/anna-shared';

export const marketingSector: SectorToolSet = {
  id: 'marketing',
  name: 'Marketing',
  keywords: [
    'campanha', 'campanhas', 'marketing', 'divulgaçao', 'divulgação',
    'lead', 'leads', 'captaçao', 'captação', 'anuncio', 'anúncio',
    'redes sociais', 'instagram', 'facebook', 'whatsapp marketing',
    'e-mail marketing', 'newsletter', 'público', 'publico', 'audiência', 'audiencia',
  ],
  toolDefs: [],
  instruction:
    '\n\nFLUXO DE MARKETING: Você é a Anna, assistente de marketing do CIESA. ' +
    'Auxilie com informações sobre campanhas, captação de leads, ' +
    'divulgação de cursos e estratégias de marketing institucional.',
  async execute(_name: string, _args: Record<string, unknown>): Promise<string | null> {
    return null;
  },
};
