export type AiContextKind = 'pr' | 'issue' | 'action';

// Evento disparado quando o agente muda o estado remoto (PR/push). As telas que
// listam PRs/Issues/Actions escutam para recarregar e evitar mostrar cache velho.
export const GIT_DATA_REFRESH_EVENT = 'chronokairo:git-data-refresh';

export function requestGitDataRefresh(repoFullName?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GIT_DATA_REFRESH_EVENT, { detail: { repoFullName } }));
}

export function focusAiContext(input: { repoFullName: string; kind: AiContextKind; id: string | number; title: string; details: string }) {
  if (typeof window === 'undefined') return;
  const focus = `${input.kind.toUpperCase()} #${input.id}: ${input.title}. ${input.details}`;
  window.dispatchEvent(new CustomEvent('chronokairo:ai-context', {
    detail: {
      repoFullName: input.repoFullName,
      focus,
      prompt: `Analise ${input.kind.toUpperCase()} #${input.id} no repositório ${input.repoFullName} e proponha como resolver. Verifique o contexto atual antes de alterar qualquer coisa.`,
    },
  }));
}
