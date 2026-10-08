export function hasCapabilityAccess(role: string, allowedRoles: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}
