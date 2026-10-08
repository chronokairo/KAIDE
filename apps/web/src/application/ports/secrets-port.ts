// Porta (ADR-0022): criptografia de segredos do vault (usada a partir da Fase 3).

export interface SecretsPort {
  encrypt(secret: string): Promise<string>;
  decrypt(vault: string): Promise<string>;
}
