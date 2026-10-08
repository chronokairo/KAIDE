'use client'

import ChatPanel, { type ChatPanelPersona, type SlashCmd } from './ChatPanel'

// ── Slash commands for the Rapunzel content-creator TUI ──────────────────────
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
    name: 'briefing',
    description: 'Criar ou refinar um briefing de campanha/conteúdo',
    kind: 'prompt',
    prompt: 'Crie um briefing de campanha/conteúdo cobrindo objetivo, público, canais, formatos e restrições de marca para: {args}',
  },
  {
    name: 'formatos',
    description: 'Sugerir formatos e tamanhos (IG, Story, LinkedIn, X, Ads…)',
    kind: 'prompt',
    prompt: 'Sugira os formatos e tamanhos ideais para publicar este conteúdo (ex.: IG 1080x1350, IG 1080x1080, Story 1080x1920, LinkedIn 1200x627, Facebook, X, Ads), com justificativa por canal. Conteúdo: {args}',
  },
  {
    name: 'gerar',
    description: 'Gerar variações de conteúdo para um template',
    kind: 'prompt',
    prompt: 'Gere variações de texto/conteúdo prontas para renderizar neste template, respeitando headline, corpo, CTA e limites de linhas: {args}',
  },
  {
    name: 'revisar',
    description: 'Revisar conteúdo (tom, regras de marca, contraste, overflow)',
    kind: 'prompt',
    prompt: 'Faça uma revisão crítica do conteúdo discutido, apontando tom, aderência à marca, contraste mínimo, overflow de texto e melhorias: {args}',
  },
  {
    name: 'design-system',
    description: 'Mapear regras do Design System Engine (Brand/Regras)',
    kind: 'prompt',
    prompt: 'Liste as regras e configurações de Design System Engine aplicáveis a este conteúdo (Logo, Colors, Typography, Spacing, Grid, Components, Templates, Rules como max_headline_lines, logo_safe_area, min_contrast): {args}',
  },
  {
    name: 'csv',
    description: 'Gerar dados em massa (bulk CSV: produto, preco, imagem, cta)',
    kind: 'prompt',
    prompt: 'Gere uma tabela CSV de dados em massa (produto, preco, imagem, cta) pronta para o gerador de conteúdo em lote: {args}',
  },
  {
    name: 'skills',
    description: 'Listar habilidades e áreas de expertise da Rapunzel',
    kind: 'prompt',
    prompt: 'Liste todas as suas habilidades, especialidades e áreas de conhecimento como agente de criação de conteúdo.',
  },
  {
    name: 'memory',
    description: 'Mostrar o que a Rapunzel se lembra desta sessão',
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
    name: 'advisor',
    description: 'Obter conselho de conteúdo ou marketing',
    kind: 'prompt',
    prompt: 'Como consultor sênior de conteúdo e marketing, dê sua opinião honesta e recomendações sobre: {args}',
  },
  {
    name: 'init',
    description: 'Inicializar uma nova campanha de conteúdo',
    kind: 'prompt',
    prompt: 'Ajude-me a inicializar uma nova campanha de conteúdo: {args}. Sugira estrutura, formatos, templates e próximos passos.',
  },
]

const RAPUNZEL_PERSONA: ChatPanelPersona = {
  name: 'Rapunzel',
  role: 'Agente de Conteúdo IA',
  ariaLabel: 'Agente Rapunzel',
  welcome: 'Olá! Sou a Rapunzel, sua agente de criação de conteúdo.\nDigite / para ver os comandos disponíveis.',
  apiPath: '/api/rapunzel',
  footer: 'Rapunzel · powered by Claude',
  commands: SLASH_COMMANDS,
  quickPrompts: [
    'Como estruturar um briefing de campanha?',
    'Quais formatos usar para este conteúdo?',
    'Como gerar variações para cada formato?',
  ],
}

export default function RapunzelChat({ open, width = 340, onWidthChange }: { open: boolean; width?: number; onWidthChange?: (w: number) => void }) {
  return (
    <ChatPanel
      persona={RAPUNZEL_PERSONA}
      open={open}
      width={width}
      onWidthChange={onWidthChange}
    />
  )
}