import { realpath } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

export function resolveWithinRoot(root: string, input: string): string {
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, input);
  const rel = relative(resolvedRoot, target);
  if (rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error(`path escapes workspace: ${input}`);
  }
  return target;
}

export async function assertPathWithinRoot(root: string, target: string): Promise<void> {
  const realRoot = await realpath(root);
  let existing = target;
  try {
    await realpath(existing);
  } catch {
    existing = dirname(target);
  }
  const realTarget = await realpath(existing);
  const rel = relative(realRoot, realTarget);
  if (rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error(`path resolves outside workspace: ${target}`);
  }
}

export async function resolveSafePath(root: string, input: string): Promise<string> {
  const target = resolveWithinRoot(root, input);
  await assertPathWithinRoot(root, target);
  return target;
}
