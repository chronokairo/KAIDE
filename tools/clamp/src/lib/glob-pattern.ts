export type CompiledGlobPattern =
  | { kind: "all" }
  | { kind: "exact"; value: string }
  | { kind: "regex"; value: RegExp };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compileGlobPattern(params: {
  raw: string;
  normalize: (value: string) => string;
}): CompiledGlobPattern {
  const normalized = params.normalize(params.raw);
  if (!normalized) {
    return { kind: "exact", value: "" };
  }
  if (normalized === "*") {
    return { kind: "all" };
  }
  if (!normalized.includes("*")) {
    return { kind: "exact", value: normalized };
  }
  return {
    kind: "regex",
    value: new RegExp(`^${escapeRegex(normalized).replaceAll("\\*", ".*")}$`),
  };
}

export function matchesAnyGlobPattern(
  value: string,
  patterns: CompiledGlobPattern[],
): boolean {
  for (const pattern of patterns) {
    if (pattern.kind === "all") {
      return true;
    }
    if (pattern.kind === "exact" && value === pattern.value) {
      return true;
    }
    if (pattern.kind === "regex" && pattern.value.test(value)) {
      return true;
    }
  }
  return false;
}

export function wildcardMatch(input: string, pattern: string): boolean {
  let str = input.replaceAll("\\", "/");
  let pat = pattern.replaceAll("\\", "/");
  let escaped = pat
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  if (escaped.endsWith(" .*")) {
    escaped = escaped.slice(0, -3) + "( .*)?";
  }

  const flags = process.platform === "win32" ? "si" : "s";
  return new RegExp("^" + escaped + "$", flags).test(str);
}

export function wildcardMatchFirst(
  input: string,
  patterns: Record<string, unknown>,
): unknown {
  const entries = Object.entries(patterns).sort(([keyA], [keyB]) => keyA.length - keyB.length);
  let result: unknown;
  for (const [pattern, value] of entries) {
    if (wildcardMatch(input, pattern)) {
      result = value;
    }
  }
  return result;
}

export function wildcardMatchFirstStructured(
  input: { head: string; tail: string[] },
  patterns: Record<string, unknown>,
): unknown {
  const entries = Object.entries(patterns).sort(([keyA], [keyB]) => keyA.length - keyB.length);
  let result: unknown;
  for (const [pattern, value] of entries) {
    const parts = pattern.split(/\s+/);
    if (!wildcardMatch(input.head, parts[0] ?? "")) continue;
    if (parts.length === 1 || matchSequence(input.tail, parts.slice(1))) {
      result = value;
    }
  }
  return result;
}

function matchSequence(items: string[], patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const [pattern, ...rest] = patterns;
  if (pattern === "*") return matchSequence(items, rest);
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as string;
    const pat = pattern as string;
    if (wildcardMatch(item, pat) && matchSequence(items.slice(i + 1), rest)) {
      return true;
    }
  }
  return false;
}
