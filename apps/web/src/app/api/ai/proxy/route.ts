import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptVaultSecret } from '@/shared/crypto-vault';

export const dynamic = 'force-static';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrgNvidiaNimKey(request: NextRequest): Promise<{ apiKey: string; baseUrl: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { apiKey: '', baseUrl: '', error: 'Não autorizado' };
  }
  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { apiKey: '', baseUrl: '', error: 'Token inválido' };
  }
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);
  if (!memberships?.length) {
    return { apiKey: '', baseUrl: '', error: 'Usuário sem organização ativa' };
  }
  const orgId = memberships[0].organization_id;
  const { data: org } = await supabase
    .from('organizations')
    .select('metadata')
    .eq('id', orgId)
    .single();
  if (!org) {
    return { apiKey: '', baseUrl: '', error: 'Organização não encontrada' };
  }
  const nvidiaNim = org.metadata?.nvidia_nim;
  if (!nvidiaNim?.api_key) {
    return { apiKey: '', baseUrl: '', error: 'NVIDIA NIM não configurado para esta organização. Configure em Configurações > Integrações.' };
  }
  let apiKey = '';
  try {
    apiKey = await decryptVaultSecret(nvidiaNim.api_key);
  } catch {
    return { apiKey: '', baseUrl: '', error: 'Erro ao descriptografar API key' };
  }
  if (!apiKey || apiKey.startsWith('•••')) {
    return { apiKey: '', baseUrl: '', error: 'API key inválida ou corrompida' };
  }
  return {
    apiKey,
    baseUrl: (nvidiaNim.base_url || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, ''),
  };
}

export async function POST(request: NextRequest) {
  const { apiKey, baseUrl, error: authError } = await getOrgNvidiaNimKey(request);
  if (authError) {
    return Response.json({ error: authError }, { status: 401 });
  }

  const body = await request.json();
  const { model, messages, temperature, max_tokens, stream } = body;

  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens, stream: !!stream }),
  });

  if (!upstreamResponse.ok) {
    const text = await upstreamResponse.text();
    return new Response(text, {
      status: upstreamResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstreamResponse.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch {
          // stream aborted
        } finally {
          controller.close();
        }
      },
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const data = await upstreamResponse.json();
  return Response.json(data);
}
