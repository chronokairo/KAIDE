export interface ErpModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

export const ERP_MODULES: ErpModuleConfig[] = [
  {
    id: 'chat',
    name: 'Chronokairo IA',
    description: 'Assistente e chat conversacional com ferramentas de raciocínio e execução local',
    icon: 'psychology',
    path: '/?tab=chat',
  },
  {
    id: 'projetos',
    name: 'Projetos & Git',
    description: 'Gestão de workspaces, repositórios clonados e worktrees',
    icon: 'folder_open',
    path: '/?tab=projetos',
  },
  {
    id: 'notifications',
    name: 'Notificações GitHub & CI',
    description: 'Central de notificações de CI/CD do GitHub com diagnóstico e correção por IA',
    icon: 'notifications',
    path: '/?tab=notifications',
  },
  {
    id: 'sessoes',
    name: 'Sessões & Histórico',
    description: 'Histórico de threads de raciocínio, checkpoints e branches',
    icon: 'history',
    path: '/?tab=sessoes',
  },
  {
    id: 'agentes',
    name: 'Agentes Autônomos',
    description: 'Painel de execução de agentes autônomos, delegação e orquestração',
    icon: 'smart_toy',
    path: '/?tab=agentes',
  },
  {
    id: 'automacoes',
    name: 'Automações & Workflows',
    description: 'Automações agendadas, pipelines e gatilhos de eventos',
    icon: 'precision_manufacturing',
    path: '/?tab=automacoes',
  },
  {
    id: 'skills',
    name: 'Skills & Ferramentas',
    description: 'Catálogo de habilidades especializadas e instruções modulares',
    icon: 'extension',
    path: '/?tab=skills',
  },
  {
    id: 'toolbox',
    name: 'Toolbox de Domínio',
    description: 'Ferramentas de execução: Financeiro, CRM, Fiscal, Contratos e BI',
    icon: 'handyman',
    path: '/?tab=toolbox',
  },
  {
    id: 'memoria',
    name: 'Memória Semântica',
    description: 'Grafo de conhecimento, base vetorial e sessões do SQLite',
    icon: 'database',
    path: '/?tab=memoria',
  },
  {
    id: 'browser',
    name: 'Navegador & Scraping',
    description: 'Sessão de navegação headless/interativa, enriquecimento e OSINT',
    icon: 'travel_explore',
    path: '/?tab=browser',
  },
  {
    id: 'intelligence',
    name: 'Inteligência & Dossiê',
    description: 'Investigações profundas de empresas, sócios, fontes públicas e relatórios',
    icon: 'policy',
    path: '/?tab=intelligence',
  },
  {
    id: 'patches',
    name: 'Patches & Diff Viewer',
    description: 'Visualizador de alterações de código, revisão e aplicação de patches',
    icon: 'difference',
    path: '/?tab=patches',
  },
  {
    id: 'contexto',
    name: 'Contexto & Fragmentos',
    description: 'Fragmentos de contexto montados para o planner de IA',
    icon: 'format_list_bulleted',
    path: '/?tab=contexto',
  },
  {
    id: 'hooks',
    name: 'Sistema de Hooks',
    description: 'Interceptores e hooks de ciclo de vida do harness',
    icon: 'webhook',
    path: '/?tab=hooks',
  },
  {
    id: 'prompts',
    name: 'Templates de Prompts',
    description: 'Biblioteca de prompts do sistema, personas e variáveis',
    icon: 'text_snippet',
    path: '/?tab=prompts',
  },
  {
    id: 'diagnostics',
    name: 'Diagnósticos & Performance',
    description: 'Métricas de saúde, latência, uso de tokens e benchmarks',
    icon: 'monitoring',
    path: '/?tab=diagnostics',
  },
  {
    id: 'policy',
    name: 'Políticas de Execução',
    description: 'Regras de segurança para chamadas de ferramentas e comandos bash',
    icon: 'security',
    path: '/?tab=policy',
  },
  {
    id: 'files',
    name: 'Busca de Arquivos',
    description: 'Indexação rápida e busca em arquivos do repositório',
    icon: 'search',
    path: '/?tab=files',
  },
  {
    id: 'attribution',
    name: 'Atribuição Git',
    description: 'Métricas de contribuição e autoria assistida por IA',
    icon: 'commit',
    path: '/?tab=attribution',
  },
  {
    id: 'configuracoes',
    name: 'Configurações & Provedores',
    description: 'Provedores de LLM (NVIDIA NIM, Ollama, OpenAI, Anthropic, Gemini)',
    icon: 'settings',
    path: '/?tab=configuracoes',
  },
];

export function getActiveModuleFromPathname(pathname: string | null): ErpModuleConfig {
  if (!pathname) return ERP_MODULES[0];
  const found = ERP_MODULES.find((m) => pathname.includes(m.id));
  return found || ERP_MODULES[0];
}
