import type { SectorToolSet } from '@ciesa/anna-shared';

export const financeiroSector: SectorToolSet = {
  id: 'financeiro',
  name: 'Financeiro',
  keywords: [
    'boleto', 'boletos', 'mensalidade', 'pagamento', 'pagamentos', 'financeiro',
    'divida', 'dívida', 'parcelamento', 'juros', 'multa', 'taxa',
    'fatura', '2 via', 'segunda via', 'comprovante', 'negociaçao', 'negociação',
    'renegociar', 'desconto', 'bolsa', 'financiamento', 'fies', 'prouni',
  ],
  toolDefs: [],
  instruction:
    '\n\nFLUXO FINANCEIRO: Você é a Anna, assistente financeira do CIESA. ' +
    'Auxilie o aluno com informações sobre boletos, mensalidades, parcelamentos, ' +
    'negociações de débitos, bolsas e financiamentos. ' +
    'Sempre confirme os dados do aluno antes de prosseguir com qualquer operação.',
  async execute(_name: string, _args: Record<string, unknown>): Promise<string | null> {
    return null;
  },
};
