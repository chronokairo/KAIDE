/** Configuration input port: environment supplied by the CLI adapter. */
export function requireApiKey(environment) {
  const key = environment.SECURITY_AI_API_KEY;
  if (typeof key !== 'string' || !key.trim()) throw new Error('Configure SECURITY_AI_API_KEY before starting the proxy.');
  if (/[\r\n]/.test(key)) throw new Error('Invalid SECURITY_AI_API_KEY.');
  return key.trim();
}
