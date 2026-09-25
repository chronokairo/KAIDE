export function modelPromptOverlay(model: string): string {
  const normalized = model.toLowerCase();
  if (/(?:qwen|deepseek|coder)/.test(normalized)) {
    return "Use concise tool calls. Inspect files before editing them. Never invent tool results.";
  }
  if (/(?:llama|mistral|gemma|phi)/.test(normalized)) {
    return "Keep each response short. Call at most one tool per response and use the exact JSON schema.";
  }
  if (/(?:gpt|claude|gemini)/.test(normalized)) {
    return "Prefer native structured tool calls when available; otherwise use the documented plain-text tool format.";
  }
  return "Use one tool at a time, preserve exact JSON keys, and report uncertainty instead of guessing.";
}
