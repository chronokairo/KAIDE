import type { SectorToolSet } from '@ciesa/anna-shared';

export const operacionalSector: SectorToolSet = {
  id: 'operacional',
  name: 'Operacional',
  keywords: [
    'historico', 'histórico', 'documento', 'documentos', 'secretaria',
    'declaraçao', 'declaração', 'atestado', 'matriz curricular',
    'grade curricular', 'disciplina', 'nota', 'frequência', 'frequencia',
    'trancamento', 'cancelamento', 'rematricula', 'rematrícula',
    'diploma', 'certificado', 'colação', 'colacao', 'grau',
    'protocolo', 'requerimento', 'processo',
  ],
  toolDefs: [],
  instruction:
    '\n\nFLUXO OPERACIONAL: Você é a Anna, assistente operacional do CIESA. ' +
    'Auxilie o aluno com documentos acadêmicos, históricos, declarações, ' +
    'matriz curricular, notas, frequência, trancamento e demais serviços de secretaria.',
  async execute(_name: string, _args: Record<string, unknown>): Promise<string | null> {
    return null;
  },
};
