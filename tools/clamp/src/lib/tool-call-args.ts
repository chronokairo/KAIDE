import { extractBalancedJsonPrefix } from "./balanced-json.js";

const MAX_TOOLCALL_REPAIR_LEADING_CHARS = 96;
const TOOLCALL_REPAIR_ALLOWED_LEADING_RE = /^[a-z0-9\s"'`.:/_\\-]+$/i;
const TOOLCALL_REPAIR_ALLOWED_TRAILING_RE = /^[^\s{}[\]":,\\]{1,3}$/;

export type ToolCallArgumentRepair = {
  args: Record<string, unknown>;
  kind: "preserved" | "repaired";
};

function decodeHtmlEntities(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }
  if (Array.isArray(value)) {
    return value.map((item) => decodeHtmlEntities(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = decodeHtmlEntities(val);
    }
    return out;
  }
  return value;
}

function isAllowedToolCallRepairLeadingPrefix(prefix: string): boolean {
  if (!prefix) {
    return true;
  }
  if (prefix.length > MAX_TOOLCALL_REPAIR_LEADING_CHARS) {
    return false;
  }
  if (!TOOLCALL_REPAIR_ALLOWED_LEADING_RE.test(prefix)) {
    return false;
  }
  return /^[.:'"`-]/.test(prefix) || /^(?:functions?|tools?)[._:/-]?/i.test(prefix);
}

export function tryExtractUsableToolCallArguments(
  raw: string,
  opts: { decodeHtml?: boolean } = {},
): ToolCallArgumentRepair | undefined {
  if (!raw.trim()) {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const args = opts.decodeHtml
      ? (decodeHtmlEntities(parsed) as Record<string, unknown>)
      : (parsed as Record<string, unknown>);
    return { args, kind: "preserved" };
  }

  const extracted = extractBalancedJsonPrefix(raw);
  if (!extracted) {
    return undefined;
  }
  const leadingPrefix = raw.slice(0, extracted.startIndex).trim();
  if (!isAllowedToolCallRepairLeadingPrefix(leadingPrefix)) {
    return undefined;
  }
  const suffix = raw.slice(extracted.startIndex + extracted.json.length).trim();
  if (leadingPrefix.length === 0 && suffix.length === 0) {
    return undefined;
  }
  if (
    suffix.length > 3 ||
    (suffix.length > 0 && !TOOLCALL_REPAIR_ALLOWED_TRAILING_RE.test(suffix))
  ) {
    return undefined;
  }
  try {
    const repaired = JSON.parse(extracted.json) as unknown;
    if (!repaired || typeof repaired !== "object" || Array.isArray(repaired)) {
      return undefined;
    }
    const args = opts.decodeHtml
      ? (decodeHtmlEntities(repaired) as Record<string, unknown>)
      : (repaired as Record<string, unknown>);
    return { args, kind: "repaired" };
  } catch {
    return undefined;
  }
}
