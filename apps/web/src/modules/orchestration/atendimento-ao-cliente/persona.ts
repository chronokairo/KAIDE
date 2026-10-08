export const ANNA = {
  name: 'Anna',
  source: 'anna',
  greeting:
    'Olá! Sou a **Anna**, sua assistente acadêmica.\n' +
    'Posso ajudar com matrículas, históricos, importação de alunos, registros acadêmicos e muito mais.\n\n' +
    'Envie uma mensagem e, para documentos (PDF de histórico ou CSV de candidatos), use o Painel de Fontes na lateral.',
  pendingText: 'Anna está analisando…',
  errorPrefix: 'Anna indisponível',
  contextHint: (label: string) =>
    `Agora em **${label}**. Posso ajudar nesta tela ou em qualquer ação acadêmica.`,
  fallbackHint:
    'Posso ajudar com matrículas, importação de alunos, registros acadêmicos, secretaria e muito mais.',
  fallbackSuggestions: [
    'matrícula de novo aluno',
    'importar lista de candidatos',
    'registrar notas e frequência',
  ],
} as const;
