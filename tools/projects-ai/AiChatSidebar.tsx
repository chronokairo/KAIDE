'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@chronokairo/platform/auth';
import { approveAiToolAction, getAiRepositoryContextAction, listAiModelsAction, runAiAgentAction, saveAiRepositorySessionAction, listChatSessionsAction, getChatSessionAction, saveChatSessionAction, deleteChatSessionAction, toggleChatSessionPinnedAction } from '@/app/actions/projectActions';
import { requestGitDataRefresh } from '@/app/aiContext';
import type { AiToolCall } from '@/core/application/ports/out/IGateways';

type Message = { role: 'user' | 'assistant'; content: string; reasoning?: string | null };
type AiRepositoryContext = { repoFullName: string; branch: string; focus?: string };
type TurnStats = { totalTokens: number; promptTokens: number; completionTokens: number; ms: number };

const GREETING: Message = { role: 'assistant', content: 'Olá. Posso ajudar a analisar **entregas**, PRs, Issues e evidências do workspace.' };

// Highlighter mínimo caseiro (sem lib externa, respeitando o ADR-023 "Quase Zero Lib").
// Cobre tokens comuns: comentários, strings, números e palavras-chave frequentes.
const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'extends', 'new', 'await', 'async', 'type', 'interface', 'public', 'private', 'readonly', 'void', 'null', 'undefined', 'true', 'false', 'def', 'end', 'do', 'then', 'fn', 'pub', 'struct', 'enum', 'impl', 'match', 'use', 'package', 'func', 'select', 'update', 'insert', 'delete', 'create', 'table', 'where']);
function keywordize(text: string, seed: string): React.ReactNode {
  return text.split(/(\b\w+\b)/).map((segment, index) => KEYWORDS.has(segment) ? <span key={`${seed}-${index}`} className="font-bold text-fuchsia-500">{segment}</span> : <span key={`${seed}-${index}`}>{segment}</span>);
}
function highlightCode(line: string, key: number) {
  const commentMatch = line.match(/(\/\/|#|--)\s.*$/);
  if (commentMatch && commentMatch.index !== undefined) {
    return <span key={key}>{keywordize(line.slice(0, commentMatch.index), `pre${key}`)}<span className="text-emerald-500">{line.slice(commentMatch.index)}</span></span>;
  }
  const parts: React.ReactNode[] = [];
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b)/g;
  let lastIndex = 0; let match: RegExpExecArray | null; let idx = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={`t${idx++}`}>{keywordize(line.slice(lastIndex, match.index), `k${key}-${idx}`)}</span>);
    const token = match[0];
    parts.push(<span key={`s${idx++}`} className={/^["'`]/.test(token) ? 'text-amber-400' : 'text-sky-400'}>{token}</span>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < line.length) parts.push(<span key={`t${idx++}`}>{keywordize(line.slice(lastIndex), `k${key}-end`)}</span>);
  return <span key={key}>{parts}</span>;
}
function CodeBlock({ code }: { code: string }) {
  return <pre className="my-2 overflow-x-auto rounded-lg bg-black/80 p-2 font-mono text-xs text-white/90">{code.split('\n').map((line, index) => <div key={index}>{line ? highlightCode(line, index) : '\u00a0'}</div>)}</pre>;
}

function inlineMarkdown(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\))/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (link && /^https?:\/\//.test(link[2])) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="underline">{link[1]}</a>;
    return <span key={index}>{part}</span>;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/); const blocks: React.ReactNode[] = []; let code: string[] = []; let inCode = false;
  lines.forEach((line, index) => { if (line.trim().startsWith('```')) { if (inCode) blocks.push(<CodeBlock key={`code-${index}`} code={code.join('\n')} />); code = []; inCode = !inCode; return; } if (inCode) { code.push(line); return; } if (!line.trim()) return; const heading = line.match(/^(#{1,3})\s+(.+)$/); if (heading) { blocks.push(<p key={index} className="mt-2 font-bold">{inlineMarkdown(heading[2])}</p>); return; } if (/^[-*]\s+/.test(line)) { blocks.push(<p key={index} className="pl-3 before:mr-2 before:content-['•']">{inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</p>); return; } blocks.push(<p key={index}>{inlineMarkdown(line)}</p>); });
  if (inCode && code.length) blocks.push(<CodeBlock key="code-end" code={code.join('\n')} />);
  return <div className="space-y-1 leading-5">{blocks}</div>;
}

function TextSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-2 text-xs font-bold"><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function toolCallingText(value: unknown) {
  const audit = value && typeof value === 'object' && 'audit' in value && Array.isArray(value.audit) ? value.audit as Array<{ tool?: string }> : [];
  return audit.length ? `\n\n🔧 Tool calling: ${audit.map((item) => item.tool || 'tool').join(' → ')}` : '';
}

function didMutateRemote(value: unknown) {
  return Boolean(value && typeof value === 'object' && 'mutatedRemote' in value && (value as { mutatedRemote?: boolean }).mutatedRemote);
}

export function AiChatSidebar() {
  const user = useUser(); const pathname = usePathname();
  const [repositoryContext, setRepositoryContext] = useState<AiRepositoryContext | null>(null);
  const [provider, setProvider] = useState<'nvidia-nim' | 'openrouter'>('nvidia-nim'); const [models, setModels] = useState<string[]>([]); const [model, setModel] = useState(''); const [modelsLoading, setModelsLoading] = useState(true);
  const [thinking, setThinking] = useState<'off' | 'low' | 'medium' | 'high'>('off'); const [executionMode, setExecutionMode] = useState<'strategy' | 'build' | 'auto'>('strategy'); const [preferencesReady, setPreferencesReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]); const [input, setInput] = useState(''); const [autoPrompt, setAutoPrompt] = useState<{ repoFullName: string; prompt: string } | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [pendingApproval, setPendingApproval] = useState<{ call: AiToolCall; preview: unknown } | null>(null); const contextRequest = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptHistory = useRef<string[]>([]); const historyIndex = useRef(-1); const draftBeforeHistory = useRef('');
  const runToken = useRef(0); const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [lastStats, setLastStats] = useState<TurnStats | null>(null);
  const [toolStatus, setToolStatus] = useState<{ name: string; running: boolean } | null>(null);
  const CONVERSATION_KEY = 'chronokairo.ai.conversation';
  const sessionId = useRef<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; updatedAt: string; pinned: boolean }>>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => { if (!user) return; const loadRepository = (repoFullName: string, focus?: string) => { const requestId = ++contextRequest.current; setRepositoryContext(null); void getAiRepositoryContextAction(repoFullName).then((result) => { if (requestId !== contextRequest.current) return; if (result.success) { const resolvedFocus = focus || result.data.focus || undefined; setRepositoryContext({ repoFullName: result.data.repoFullName, branch: result.data.branch, focus: resolvedFocus }); if (focus) void saveAiRepositorySessionAction({ repoFullName, branch: result.data.branch, focus }); } else setRepositoryContext(null); }); }; const match = pathname?.match(/^\/repositorios\/([^/]+)\/([^/]+)/); const repoFullName = match ? `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}` : null; if (repoFullName) loadRepository(repoFullName); else { contextRequest.current += 1; setRepositoryContext(null); } const onAiContext = (event: Event) => { const detail = (event as CustomEvent<{ repoFullName: string; focus: string; prompt: string }>).detail; if (!detail?.repoFullName) return; loadRepository(detail.repoFullName, detail.focus); setInput(detail.prompt); setAutoPrompt({ repoFullName: detail.repoFullName, prompt: detail.prompt }); setError(null); }; window.addEventListener('chronokairo:ai-context', onAiContext); return () => window.removeEventListener('chronokairo:ai-context', onAiContext); }, [pathname, user]);
  useEffect(() => { if (!user) return; try { const saved = JSON.parse(localStorage.getItem('chronokairo.ai.preferences') || '{}') as { provider?: string; thinking?: string; executionMode?: string }; if (saved.provider === 'nvidia-nim' || saved.provider === 'openrouter') setProvider(saved.provider); if (saved.thinking === 'off' || saved.thinking === 'low' || saved.thinking === 'medium' || saved.thinking === 'high') setThinking(saved.thinking); if (saved.executionMode === 'strategy' || saved.executionMode === 'build' || saved.executionMode === 'auto') setExecutionMode(saved.executionMode); } catch { /* preferências inválidas são ignoradas */ } setPreferencesReady(true); }, [user]);
  useEffect(() => { if (!user || !preferencesReady) return; setModelsLoading(true); void listAiModelsAction(provider).then((result) => { if (result.success) { setModels(result.data); let savedModel = ''; try { const saved = JSON.parse(localStorage.getItem('chronokairo.ai.preferences') || '{}') as { models?: Record<string, string> }; savedModel = saved.models?.[provider] || ''; } catch { /* cache inválido */ } setModel(savedModel && result.data.includes(savedModel) ? savedModel : result.data[0] || ''); } else if ('error' in result) setError(result.error); setModelsLoading(false); }); }, [provider, user, preferencesReady]);
  useEffect(() => { if (!preferencesReady) return; try { const saved = JSON.parse(localStorage.getItem('chronokairo.ai.preferences') || '{}') as Record<string, unknown>; const models = saved.models && typeof saved.models === 'object' ? saved.models as Record<string, string> : {}; localStorage.setItem('chronokairo.ai.preferences', JSON.stringify({ ...saved, provider, thinking, executionMode, models: { ...models, ...(model ? { [provider]: model } : {}) } })); } catch { /* armazenamento local indisponível */ } }, [provider, model, thinking, executionMode, preferencesReady]);
  // Mantém a última mensagem visível (auto-scroll), inspirado no "newest line stays visible" do Copilot CLI.
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading, pendingApproval]);
  // Restaura a conversa salva ao montar (persistência de sessão entre reloads).
  useEffect(() => { if (!user) return; try { const saved = JSON.parse(localStorage.getItem(CONVERSATION_KEY) || 'null') as Message[] | null; if (Array.isArray(saved) && saved.length) setMessages(saved); } catch { /* conversa inválida ignorada */ } }, [user]);
  // Persiste a conversa a cada mudança (limita para não estourar o localStorage).
  useEffect(() => { if (!user) return; try { localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages.slice(-50))); } catch { /* armazenamento indisponível */ } }, [messages, user]);
  // Persiste a conversa no backend de sessões (disco ~/.chronokairo/sessions), com debounce.
  useEffect(() => {
    if (!user || loading) return;
    if (!messages.some((message) => message.role === 'user')) return;
    const timer = setTimeout(() => {
      void saveChatSessionAction({ id: sessionId.current || undefined, messages: messages.map((message) => ({ role: message.role, content: message.content })), repoFullName: repositoryContext?.repoFullName ?? null, branch: repositoryContext?.branch ?? null, focus: repositoryContext?.focus ?? null }).then((result) => { if (result.success) sessionId.current = result.data.id; });
    }, 800);
    return () => clearTimeout(timer);
  }, [messages, loading, user, repositoryContext]);
  if (!user) return null;

  const changeProvider = (nextProvider: typeof provider) => { setProvider(nextProvider); setModels([]); setModel(''); };
  const sendPrompt = async (rawContent: string) => { const content = rawContent.trim(); if (!content || loading) return; if (promptHistory.current[promptHistory.current.length - 1] !== content) promptHistory.current.push(content); historyIndex.current = -1; const token = ++runToken.current; const startedAt = Date.now(); const controller = new AbortController(); abortRef.current = controller; const next = [...messages, { role: 'user' as const, content }]; setMessages(next); setInput(''); setLoading(true); setError(null);
    // Sempre via SSE do agente (tem tools de leitura do workspace, mesmo sem repositório selecionado).
    try {
      const response = await fetch('/api/ai/agent-stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, messages: next.map((message) => ({ role: message.role, content: message.content })), model, thinking, mode: executionMode, context: repositoryContext || undefined }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error(`Falha ao iniciar o agente (${response.status}).`);
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let acc = ''; let assistantAdded = false; const auditTools: string[] = [];
      const ensureAssistant = () => { if (!assistantAdded) { assistantAdded = true; setMessages((current) => [...current, { role: 'assistant', content: '' }]); } };
      while (true) {
        const { done, value } = await reader.read();
        if (done || token !== runToken.current) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const evt of events) {
          const eventLine = evt.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
          const dataLine = evt.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim();
          if (!dataLine) continue;
          const data = JSON.parse(dataLine) as Record<string, unknown>;
          if (eventLine === 'tool') { const name = String(data.name); const status = String(data.status); if (status === 'start') setToolStatus({ name, running: true }); else { setToolStatus(null); auditTools.push(name); } }
          else if (eventLine === 'delta') { ensureAssistant(); acc += String(data.text); setMessages((current) => { const copy = [...current]; copy[copy.length - 1] = { role: 'assistant', content: acc }; return copy; }); }
          else if (eventLine === 'approval') { setPendingApproval({ call: data.call as AiToolCall, preview: data.preview }); }
          else if (eventLine === 'done') { const audit = Array.isArray(data.audit) ? (data.audit as Array<{ tool?: string }>).map((item) => item.tool || 'tool') : auditTools; if (audit.length) { ensureAssistant(); setMessages((current) => { const copy = [...current]; const last = copy[copy.length - 1]; copy[copy.length - 1] = { role: 'assistant', content: `${last.content}\n\n🔧 Tool calling: ${audit.join(' → ')}` }; return copy; }); } if (data.mutatedRemote) requestGitDataRefresh(repositoryContext?.repoFullName); }
          else if (eventLine === 'error') setError(String(data.message));
        }
      }
      if (token === runToken.current) setLastStats({ totalTokens: 0, promptTokens: 0, completionTokens: 0, ms: Date.now() - startedAt });
    } catch (agentError) { if (token === runToken.current && !(agentError instanceof DOMException && agentError.name === 'AbortError')) setError(agentError instanceof Error ? agentError.message : 'Falha no agente.'); }
    finally { if (abortRef.current === controller) abortRef.current = null; if (token === runToken.current) { setToolStatus(null); setLoading(false); } }
  };
  const send = async (event: React.FormEvent) => { event.preventDefault(); submitPrompt(input); };
  // Enfileira quando o agente está ocupado (steering/queue do Copilot CLI); senão envia direto.
  const submitPrompt = (raw: string) => {
    const content = raw.trim(); if (!content) return;
    if (loading) { setQueue((current) => [...current, content]); setInput(''); return; }
    void sendPrompt(content);
  };
  // Ao terminar o turno, dispara automaticamente o próximo prompt da fila.
  useEffect(() => {
    if (loading || pendingApproval || !queue.length) return;
    const [next, ...rest] = queue; setQueue(rest); void sendPrompt(next);
  }, [loading, pendingApproval, queue]);
  // Limpa a conversa e reinicia (inspirado no /clear e /new do Copilot CLI).
  const clearConversation = useCallback(() => { runToken.current += 1; sessionId.current = null; setMessages([GREETING]); setInput(''); setQueue([]); setError(null); setPendingApproval(null); setLoading(false); setLastStats(null); setToolStatus(null); historyIndex.current = -1; try { localStorage.removeItem(CONVERSATION_KEY); } catch { /* ignore */ } }, []);
  // Lista as sessões salvas no disco (backend de sessões), fixadas primeiro.
  const refreshSessions = useCallback(() => { void listChatSessionsAction().then((result) => { if (result.success) setSessions(result.data.map((session) => ({ id: session.id, title: session.title, updatedAt: new Date(session.updatedAt).toISOString(), pinned: session.pinned })).sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))); }); }, []);
  const openSessions = useCallback(() => { setShowSessions((current) => { const next = !current; if (next) refreshSessions(); return next; }); }, [refreshSessions]);
  // Retoma uma sessão salva no chat.
  const loadSession = useCallback((id: string) => { void getChatSessionAction(id).then((result) => { if (!result.success) return; sessionId.current = result.data.id; setMessages(result.data.messages.length ? result.data.messages.map((message) => ({ role: message.role, content: message.content })) : [GREETING]); setShowSessions(false); setError(null); setPendingApproval(null); }); }, []);
  // Exclui uma sessão salva.
  const removeSession = useCallback((id: string) => { void deleteChatSessionAction(id).then((result) => { if (result.success) { setSessions((current) => current.filter((session) => session.id !== id)); if (sessionId.current === id) sessionId.current = null; } }); }, []);
  // Fixa/desafixa uma sessão (reusa o backend pinned).
  const togglePin = useCallback((id: string, pinned: boolean) => { void toggleChatSessionPinnedAction(id, !pinned).then((result) => { if (result.success) refreshSessions(); }); }, [refreshSessions]);
  // Renomeia uma sessão salva.
  const commitRename = useCallback((id: string) => { const title = renameValue.trim(); setRenamingId(null); if (!title) return; void saveChatSessionAction({ id, title }).then((result) => { if (result.success) refreshSessions(); }); }, [renameValue, refreshSessions]);
  // Exporta a conversa como Markdown (inspirado no /share e /copy html do Copilot CLI).
  const exportMarkdown = useCallback(() => {
    const header = `# Conversa Chronokairo IA\n\n${repositoryContext ? `Repositório: ${repositoryContext.repoFullName} (${repositoryContext.branch})\n` : ''}Exportado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    const body = messages.map((message) => `## ${message.role === 'user' ? 'Você' : 'Assistente'}\n\n${message.content}`).join('\n\n');
    const blob = new Blob([header + body + '\n'], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `chat-chronokairo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.md`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }, [messages, repositoryContext]);
  // Cancela o turno em execução (inspirado no "Ctrl+C stops the running turn" do Copilot CLI).
  const cancelRun = useCallback(() => { if (!loading) return; runToken.current += 1; abortRef.current?.abort(); abortRef.current = null; setLoading(false); setToolStatus(null); setMessages((current) => [...current, { role: 'assistant', content: '_Execução cancelada._' }]); }, [loading]);
  // Copia a resposta (inspirado no /copy do Copilot CLI).
  const copyMessage = useCallback((content: string, index: number) => { void navigator.clipboard?.writeText(content).then(() => { setCopiedIndex(index); setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500); }).catch(() => { /* clipboard indisponível */ }); }, []);
  // Edita a última mensagem do usuário: repõe no input e trunca a conversa a partir dela (inspirado no "take it back for editing").
  const editLastUserMessage = useCallback(() => {
    if (loading) return;
    let lastUserIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) { if (messages[index].role === 'user') { lastUserIndex = index; break; } }
    if (lastUserIndex === -1) return;
    setInput(messages[lastUserIndex].content);
    setMessages(messages.slice(0, lastUserIndex));
  }, [loading, messages]);
  // Enter envia; Shift+Enter quebra linha; ↑/↓ navegam o histórico de prompts quando o cursor está nas bordas.
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitPrompt(input); return; }
    if (event.key === 'Escape' && loading) { event.preventDefault(); cancelRun(); return; }
    const target = event.currentTarget;
    if (event.key === 'ArrowUp' && target.selectionStart === 0 && promptHistory.current.length) {
      event.preventDefault();
      if (historyIndex.current === -1) { draftBeforeHistory.current = input; historyIndex.current = promptHistory.current.length; }
      historyIndex.current = Math.max(0, historyIndex.current - 1);
      setInput(promptHistory.current[historyIndex.current]);
      return;
    }
    if (event.key === 'ArrowDown' && target.selectionStart === input.length && historyIndex.current !== -1) {
      event.preventDefault();
      historyIndex.current += 1;
      if (historyIndex.current >= promptHistory.current.length) { historyIndex.current = -1; setInput(draftBeforeHistory.current); }
      else setInput(promptHistory.current[historyIndex.current]);
    }
  };
  useEffect(() => { if (!autoPrompt || !repositoryContext || repositoryContext.repoFullName !== autoPrompt.repoFullName || modelsLoading || !model || loading) return; setAutoPrompt(null); void sendPrompt(autoPrompt.prompt); }, [autoPrompt, repositoryContext, modelsLoading, model, loading]);
  const approve = async () => { if (!pendingApproval) return; const approvedCall = pendingApproval.call; setLoading(true); setError(null); const result = await approveAiToolAction(approvedCall, repositoryContext || undefined); if (result.success) { if (didMutateRemote(result.data)) requestGitDataRefresh(repositoryContext?.repoFullName); setPendingApproval(null); setMessages((current) => [...current, { role: 'assistant', content: `Operação aprovada e executada: **${approvedCall.name}**.${toolCallingText(result.data)}` }]); const continuation = [...messages, { role: 'user' as const, content: `A tool ${approvedCall.name} foi aprovada e executada com sucesso. Resultado: ${JSON.stringify(result.data).slice(0, 6000)}. Continue o fluxo do agente a partir desse resultado; se houver outra etapa necessária, use a próxima tool apropriada.` }]; const next = await runAiAgentAction(provider, continuation, { model, thinking }, repositoryContext || undefined, executionMode); if (next.success) { if (didMutateRemote(next.data)) requestGitDataRefresh(repositoryContext?.repoFullName); if ('approvalRequired' in next.data && next.data.approvalRequired) setPendingApproval(next.data.approvalRequired as { call: AiToolCall; preview: unknown }); if (next.data.content || toolCallingText(next.data)) setMessages((current) => [...current, { role: 'assistant', content: `${next.data.content || ''}${toolCallingText(next.data)}` }]); } else if ('error' in next) setError(next.error); } else if ('error' in result) { setError(result.error); const repairMessages = [...messages, { role: 'user' as const, content: `A tool ${approvedCall.name} falhou após aprovação com este erro: ${result.error}. Corrija os argumentos ou gere um patch válido e tente novamente. Não repita exatamente a chamada inválida.` }]; const retry = await runAiAgentAction(provider, repairMessages, { model, thinking }, repositoryContext || undefined, executionMode); if (retry.success) { if ('approvalRequired' in retry.data && retry.data.approvalRequired) setPendingApproval(retry.data.approvalRequired as { call: AiToolCall; preview: unknown }); if (retry.data.content || toolCallingText(retry.data)) setMessages((current) => [...current, { role: 'assistant', content: `${retry.data.content || ''}${toolCallingText(retry.data)}` }]); } else if ('error' in retry) setError(retry.error); } setLoading(false); };

  return <aside className="fixed right-0 top-16 z-20 flex h-[calc(100vh-4rem)] w-[min(22rem,100vw)] flex-col border-l border-outline-variant/60 bg-surface shadow-xl max-md:hidden" aria-label="Chat de IA"><div className="flex items-center justify-between gap-2 border-b border-outline-variant/60 px-3 py-2"><span className="text-xs font-bold text-on-surface-variant">Chat de IA</span><div className="relative flex items-center gap-1"><button type="button" onClick={openSessions} title="Sessões salvas" aria-label="Sessões salvas" className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"><span className="material-symbols-outlined text-[18px]">history</span></button><button type="button" onClick={clearConversation} title="Nova conversa" aria-label="Nova conversa" className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"><span className="material-symbols-outlined text-[18px]">add_comment</span></button><button type="button" onClick={exportMarkdown} disabled={messages.length <= 1} title="Exportar como Markdown" aria-label="Exportar como Markdown" className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">download</span></button>{showSessions && <div className="absolute right-0 top-9 z-30 max-h-96 w-80 overflow-y-auto rounded-xl border border-outline-variant bg-surface p-1 shadow-2xl"><p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Sessões salvas</p><input type="search" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Buscar sessões…" aria-label="Buscar sessões" className="mb-1 w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 text-xs" />{(() => { const filtered = sessions.filter((session) => session.title.toLowerCase().includes(sessionSearch.trim().toLowerCase())); return filtered.length === 0 ? <p className="px-2 py-2 text-xs text-on-surface-variant">{sessions.length ? 'Nenhuma sessão corresponde à busca.' : 'Nenhuma sessão salva.'}</p> : filtered.map((session) => <div key={session.id} className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-container">{renamingId === session.id ? <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(session.id); if (event.key === 'Escape') setRenamingId(null); }} onBlur={() => commitRename(session.id)} aria-label="Novo nome da sessão" className="min-w-0 flex-1 rounded border border-outline-variant bg-surface px-1 py-0.5 text-xs" /> : <button type="button" onClick={() => loadSession(session.id)} className="flex min-w-0 flex-1 flex-col items-start text-left"><span className="flex w-full items-center gap-1"><span className="truncate font-medium text-on-surface">{session.title}</span>{session.pinned && <span className="material-symbols-outlined shrink-0 text-[13px] text-primary">keep</span>}</span><span className="text-[10px] text-on-surface-variant">{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(session.updatedAt))}</span></button>}<button type="button" onClick={() => togglePin(session.id, session.pinned)} title={session.pinned ? 'Desafixar' : 'Fixar'} aria-label={session.pinned ? 'Desafixar' : 'Fixar'} className={`shrink-0 rounded p-1 ${session.pinned ? 'text-primary' : 'text-on-surface-variant opacity-0 group-hover:opacity-100'} transition-opacity hover:text-primary`}><span className="material-symbols-outlined text-[14px]">keep</span></button><button type="button" onClick={() => { setRenamingId(session.id); setRenameValue(session.title); }} title="Renomear" aria-label="Renomear sessão" className="shrink-0 rounded p-1 text-on-surface-variant opacity-0 transition-opacity hover:text-on-surface group-hover:opacity-100"><span className="material-symbols-outlined text-[14px]">edit</span></button><button type="button" onClick={() => removeSession(session.id)} title="Excluir" aria-label="Excluir sessão" className="shrink-0 rounded p-1 text-on-surface-variant opacity-0 transition-opacity hover:text-error group-hover:opacity-100"><span className="material-symbols-outlined text-[14px]">delete</span></button></div>); })()}</div>}</div></div><div className="border-b border-outline-variant/60 px-4 py-3">{repositoryContext ? <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="truncate font-bold text-primary">{repositoryContext.repoFullName}</span><span className="shrink-0 font-mono text-primary">{repositoryContext.branch}</span></div>{repositoryContext.focus && <p className="mt-1 truncate text-[10px] text-primary/80">Contexto: {repositoryContext.focus}</p>}</div> : <p className="text-xs text-on-surface-variant">Nenhum repositório selecionado</p>}</div><div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-busy={loading}>{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`group relative rounded-xl p-3 text-sm ${message.role === 'user' ? 'ml-6 bg-primary text-on-primary' : 'mr-6 bg-surface-container text-on-surface'}`}>{message.role === 'assistant' && message.reasoning ? <details className="mb-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"><summary className="cursor-pointer px-2 py-1 font-bold text-on-surface-variant">Raciocínio</summary><div className="border-t border-outline-variant/60 p-2 text-on-surface-variant"><MarkdownMessage content={message.reasoning} /></div></details> : null}<MarkdownMessage content={message.content} />{message.role === 'assistant' && <button type="button" onClick={() => copyMessage(message.content, index)} title="Copiar resposta" aria-label="Copiar resposta" className="absolute right-1 top-1 rounded p-1 text-on-surface-variant opacity-0 transition-opacity hover:text-on-surface group-hover:opacity-100"><span className="material-symbols-outlined text-[16px]">{copiedIndex === index ? 'check' : 'content_copy'}</span></button>}{message.role === 'user' && index === messages.length - 1 && !loading && <button type="button" onClick={editLastUserMessage} title="Editar e reenviar" aria-label="Editar e reenviar" className="absolute right-1 top-1 rounded p-1 text-on-primary/70 opacity-0 transition-opacity hover:text-on-primary group-hover:opacity-100"><span className="material-symbols-outlined text-[16px]">edit</span></button>}</div>)}{loading && <div className="mr-6 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700">{toolStatus?.running ? <>🔧 Executando <span className="font-mono font-bold">{toolStatus.name}</span>…</> : 'Consultando provider…'} <button type="button" onClick={cancelRun} className="ml-1 font-bold underline">Parar (Esc)</button></div>}{error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700">{error}</div>}{pendingApproval && <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800"><p className="font-bold">Aprovação necessária: {pendingApproval.call.name}</p><pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-2">{JSON.stringify(pendingApproval.preview, null, 2)}</pre><button type="button" onClick={() => void approve()} disabled={loading} className="mt-2 w-full rounded-lg bg-amber-600 px-3 py-2 font-bold text-white disabled:opacity-50">Aprovar e executar</button></div>}{queue.map((item, index) => <div key={`queued-${index}`} className="ml-6 flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-2 text-xs text-on-surface-variant"><span className="material-symbols-outlined text-[14px]">schedule</span><span className="min-w-0 flex-1 truncate">{item}</span><button type="button" onClick={() => setQueue((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remover da fila" aria-label="Remover da fila" className="shrink-0 hover:text-error"><span className="material-symbols-outlined text-[14px]">close</span></button></div>)}<div ref={messagesEndRef} /></div><form onSubmit={(event) => void send(event)} className="border-t border-outline-variant/60 p-3"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onInputKeyDown} rows={3} placeholder={loading ? 'Enfileirar próximo prompt… (Enter)' : 'Pergunte sobre a entrega… (Enter envia, Shift+Enter nova linha, ↑ histórico)'} className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm" /><details className="mt-2 rounded-xl border border-outline-variant/60 bg-surface-container"><summary className="cursor-pointer px-3 py-2 text-xs font-bold text-on-surface-variant">Configurações da IA</summary><div className="space-y-2 border-t border-outline-variant/60 p-3"><div className="grid grid-cols-2 gap-2"><TextSelect label="Provider" value={provider} options={['nvidia-nim', 'openrouter']} onChange={(value) => changeProvider(value as typeof provider)} /><TextSelect label="Modelo" value={model} options={models} onChange={setModel} /></div><label className="block"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Thinking: {thinking}</span><input aria-label="Thinking" type="range" min={0} max={3} value={['off', 'low', 'medium', 'high'].indexOf(thinking)} onChange={(event) => setThinking((['off', 'low', 'medium', 'high'] as const)[Number(event.target.value)])} className="w-full accent-primary" /></label><p className="text-right text-[10px] text-on-surface-variant">{modelsLoading ? 'Carregando modelos…' : 'Agente ativo'}</p><select aria-label="Modo de execução" value={executionMode} onChange={(event) => setExecutionMode(event.target.value as typeof executionMode)} className="w-full rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-xs font-bold"><option value="strategy">Strategy / plan (somente leitura)</option><option value="build">Build / approval</option><option value="auto">Auto / at risk</option></select></div></details>{lastStats && <p className="mt-1 text-right text-[10px] text-on-surface-variant">{lastStats.totalTokens > 0 ? `${lastStats.totalTokens} tokens (${lastStats.promptTokens}+${lastStats.completionTokens}) · ` : ''}{(lastStats.ms / 1000).toFixed(1)}s</p>}{loading ? <div className="mt-2 flex gap-2"><button type="submit" disabled={!input.trim()} className="flex-1 rounded-xl bg-primary/80 px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40">Enfileirar</button><button type="button" onClick={cancelRun} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Parar</button></div> : <button type="submit" disabled={!input.trim() || modelsLoading} className="mt-2 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50">Enviar</button>}</form></aside>;
}
