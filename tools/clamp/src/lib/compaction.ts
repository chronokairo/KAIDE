import { estimate } from "./token.js";
import { truncateUtf16Safe } from "./tool-result-truncation.js";

export function compactContext(text: string, maxTokens: number): string {
  const maxChars = Math.max(256, maxTokens * 4);
  if (estimate(text) <= maxTokens) return text;
  const headChars = Math.floor(maxChars * 0.7);
  const tailChars = Math.floor(maxChars * 0.25);
  const head = truncateUtf16Safe(text, headChars).replace(/…$/, "");
  const tail = text.slice(-tailChars);
  return `${head}\n\n[... context compacted ...]\n\n${tail}`;
}
