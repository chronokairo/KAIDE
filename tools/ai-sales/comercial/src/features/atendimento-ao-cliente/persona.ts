export const ANNA = {
  name: 'Anna',
  source: 'anna',
  greeting:
    'Oi! Eu sou a **Anna**, **assistente virtual** do CIESA. 😊\n' +
    'Posso te ajudar com matrícula, transferência, portador de diploma e qualquer dúvida sobre a faculdade.\n\n' +
    'Quer começar? Me conta seu nome, o curso que te interessa e o que você já sabe sobre turno ou modalidade. Se tiver documentos, pode anexar ali no clipe — eu leio e preencho seus dados automaticamente!',
  pendingText: 'Anna está pensando…',
  errorPrefix: 'Anna indisponível',
  contextHint: (label: string) =>
    `Agora em **${label}**. Posso te ajudar aqui ou com qualquer outra coisa acadêmica.`,
  fallbackHint:
    'Posso te ajudar com matrícula, transferência ou portador de diploma — e o que mais precisar!',
  fallbackSuggestions: [
    'quero me matricular em Direito',
    'quero transferir meu curso para o CIESA',
    'sou portador de diploma e quero fazer pós',
  ],
} as const;
