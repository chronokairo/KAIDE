export function truncateUtf16Safe(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const end = Math.max(0, maxChars - 1);
  const candidate = value.slice(0, end);
  const last = candidate.charCodeAt(candidate.length - 1);
  const safe = last >= 0xd800 && last <= 0xdbff ? candidate.slice(0, -1) : candidate;
  return `${safe}…`;
}

export function formatAndTruncateToolResult(value: unknown, maxChars: number): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    text = String(value);
  }
  return truncateUtf16Safe(text, maxChars);
}
