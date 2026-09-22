import { supabase } from '@/shared/supabase';
import { decryptVaultSecret } from '@/shared/crypto-vault';

export interface NvidiaNimConfig {
  api_key?: string;
  base_url?: string;
  model?: string;
}

export async function getNvidiaNimConfig(organizationId: string): Promise<NvidiaNimConfig | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('metadata')
    .eq('id', organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  const metadata = data.metadata || {};
  const raw = metadata.nvidia_nim;
  if (!raw) return null;

  let decryptedKey = raw.api_key || '';
  if (decryptedKey) {
    try {
      decryptedKey = await decryptVaultSecret(decryptedKey);
    } catch {
      decryptedKey = '';
    }
  }

  return {
    api_key: decryptedKey,
    base_url: raw.base_url,
    model: raw.model,
  };
}
