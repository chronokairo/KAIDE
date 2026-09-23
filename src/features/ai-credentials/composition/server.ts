// Composition da feature ai-credentials (NVIDIA NIM) — camada server.
// Consolida auth + persistência de credenciais de provedores de LLM no ai.

import { supabase } from '@/shared/supabase';
import { decryptVaultSecret, encryptVaultSecret } from '@/shared/crypto-vault';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

export interface ResolvedCredential {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface NvidiaCredentialService {
  service: {
    resolve(userId: string): Promise<ResolvedCredential | null>;
    getStatus(userId: string): Promise<{ configured: boolean; model: string }>;
    save(userId: string, apiKey: string, model?: string): Promise<void>;
    delete(userId: string): Promise<void>;
  };
}

export async function authenticateRequest(authHeader: string | null): Promise<{ id: string }> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('UNAUTHORIZED');
  return { id: user.id };
}

export function createNvidiaCredentialService(): NvidiaCredentialService {
  return {
    service: {
      async resolve(userId: string): Promise<ResolvedCredential | null> {
        const { data, error } = await supabase
          .from('organizations')
          .select('metadata')
          .eq('id', userId)
          .single();
        if (error || !data) return null;

        const raw = data.metadata?.nvidia_nim;
        if (!raw?.api_key) return null;

        let apiKey = raw.api_key;
        try {
          apiKey = await decryptVaultSecret(apiKey);
        } catch {
          return null;
        }

        return { apiKey, baseUrl: raw.base_url || NVIDIA_BASE_URL, model: raw.model || DEFAULT_MODEL };
      },

      async getStatus(userId: string) {
        const credential = await this.resolve(userId);
        return { configured: Boolean(credential), model: credential?.model || DEFAULT_MODEL };
      },

      async save(userId: string, apiKey: string, model?: string) {
        const metadata = { nvidia_nim: { api_key: await encryptVaultSecret(apiKey), base_url: NVIDIA_BASE_URL, model: model || DEFAULT_MODEL } };
        const { error } = await supabase.from('organizations').update({ metadata }).eq('id', userId);
        if (error) throw error;
      },

      async delete(userId: string) {
        const { data, error } = await supabase
          .from('organizations')
          .select('metadata')
          .eq('id', userId)
          .single();
        if (error || !data) return;
        const metadata = { ...(data.metadata || {}), nvidia_nim: undefined };
        await supabase.from('organizations').update({ metadata }).eq('id', userId);
      },
    },
  };
}