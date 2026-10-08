'use client'

import ChatPanel, { type ChatPanelPersona, type SlashCmd } from './ChatPanel'

// ── Slash commands mirrored from the Froia TUI ──────────────────────────────
const SLASH_COMMANDS: SlashCmd[] = [
  {
    name: 'clear',
    aliases: ['reset', 'new'],
    description: 'Limpar histórico da conversa',
    kind: 'local',
  },
  {
    name: 'help',
    description: 'Mostrar comandos disponíveis',
    kind: 'local',
  },
  {
    name: 'compact',
    description: 'Compactar histórico mantendo um resumo no contexto',
    kind: 'prompt',
    prompt: 'Por favor, faça um resumo conciso de tudo que discutimos até agora nesta conversa, preservando as informações mais importantes. Em seguida, continue a partir desse resumo.',
  },
  {
    name: 'plan',
    description: 'Criar ou visualizar um plano para a tarefa atual',
    kind: 'prompt',
    prompt: 'Crie um plano detalhado passo a passo para: {args}',
  },
  {
    name: 'review',
    description: 'Revisar o design ou código discutido',
    kind: 'prompt',
    prompt: 'Faça uma revisão crítica do que discutimos até agora, apontando problemas, melhorias e boas práticas: {args}',
  },
  {
    name: 'diff',
    description: 'Analisar e explicar mudanças não commitadas',
    kind: 'prompt',
    prompt: 'Analise e explique as mudanças mais recentes que discutimos, como se fosse um diff de código. {args}',
  },
  {
    name: 'skills',
    description: 'Listar habilidades e áreas de expertise do Froia',
    kind: 'prompt',
    prompt: 'Liste todas as suas habilidades, especialidades e áreas de conhecimento como agente de design IA.',
  },
  {
    name: 'memory',
    description: 'Mostrar o que o Froia se lembra desta sessão',
    kind: 'prompt',
    prompt: 'Resuma tudo o que você aprendeu ou memorizou sobre mim e meus projetos nesta sessão.',
  },
  {
    name: 'status',
    description: 'Mostrar status do agente e configurações',
    kind: 'prompt',
    prompt: 'Mostre seu status atual: modelo em uso, configurações e capacidades disponíveis.',
  },
  {
    name: 'model',
    description: 'Informações sobre o modelo de IA em uso',
    kind: 'prompt',
    prompt: 'Qual modelo de IA você está usando atualmente? Descreva suas capacidades.',
  },
  {
    name: 'cost',
    description: 'Estimativa de custo e uso da sessão atual',
    kind: 'prompt',
    prompt: 'Dê uma estimativa do uso de tokens e custo desta conversa até agora.',
  },
  {
    name: 'commit',
    description: 'Sugerir uma mensagem de commit para as mudanças discutidas',
    kind: 'prompt',
    prompt: 'Baseado no que discutimos, sugira uma mensagem de commit convencional (conventional commits) para as mudanças: {args}',
  },
  {
    name: 'security',
    description: 'Revisar aspectos de segurança do código/design',
    kind: 'prompt',
    prompt: 'Faça uma revisão de segurança do que discutimos, identificando vulnerabilidades OWASP e boas práticas: {args}',
  },
  {
    name: 'advisor',
    description: 'Obter conselho de design ou arquitetura',
    kind: 'prompt',
    prompt: 'Como consultor sênior de design e UX, dê sua opinião honesta e recomendações sobre: {args}',
  },
  {
    name: 'init',
    description: 'Inicializar um novo projeto de design',
    kind: 'prompt',
    prompt: 'Ajude-me a inicializar um novo projeto de design: {args}. Sugira estrutura, ferramentas e próximos passos.',
  },
]

const FROIA_PERSONA: ChatPanelPersona = {
  name: 'Froia',
  role: 'Agente de Design IA',
  ariaLabel: 'Agente Froia',
  welcome: 'Olá! Sou o Froia, seu agente de design IA.\nDigite / para ver os comandos disponíveis.',
  apiPath: '/api/froia',
  footer: 'Froia · powered by Claude',
  commands: SLASH_COMMANDS,
  quickPrompts: [
    'O que é um design system?',
    'Boas práticas de acessibilidade',
    'Como criar um protótipo interativo?',
  ],
}

export default function FroiaChat({ open, width = 340, onWidthChange }: { open: boolean; width?: number; onWidthChange?: (w: number) => void }) {
  return (
    <ChatPanel
      persona={FROIA_PERSONA}
      open={open}
      width={width}
      onWidthChange={onWidthChange}
    />
  )
}