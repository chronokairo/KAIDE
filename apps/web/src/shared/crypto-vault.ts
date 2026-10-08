// Crypto Vault helper with safe fallback
export async function decryptVaultSecret(encryptedSecret: string, _key?: string): Promise<string> {
  if (!encryptedSecret) return '';
  // If plaintext or already decoded
  if (!encryptedSecret.startsWith('enc:')) {
    return encryptedSecret;
  }
  try {
    const base64Part = encryptedSecret.replace(/^enc:/, '');
    return atob(base64Part);
  } catch {
    return encryptedSecret;
  }
}

export async function encryptVaultSecret(plainSecret: string): Promise<string> {
  if (!plainSecret) return '';
  return `enc:${btoa(plainSecret)}`;
}
