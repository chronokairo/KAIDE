import { getAuthSession } from '@/shared/supabase';

export async function sendNvidiaAgentMessage(input: {
  agentName: string;
  content: string;
  model: string;
}): Promise<string> {
  const session = await getAuthSession();
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      messages: [{ role: 'user', content: `[Agente: ${input.agentName}]\n${input.content}` }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Falha no NVIDIA NIM (${response.status}).`);
  return data.choices?.[0]?.message?.content || 'Resposta vazia da NVIDIA NIM.';
}
