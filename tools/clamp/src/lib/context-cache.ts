import { readFile, stat } from "node:fs/promises";

type CachedFile = { mtimeMs: number; content: string };

export class ContextCache {
  private readonly files = new Map<string, CachedFile>();

  async read(path: string): Promise<string> {
    const info = await stat(path);
    const cached = this.files.get(path);
    if (cached && cached.mtimeMs === info.mtimeMs) return cached.content;
    const content = await readFile(path, "utf8");
    this.files.set(path, { mtimeMs: info.mtimeMs, content });
    return content;
  }

  invalidate(path: string): void {
    this.files.delete(path);
  }

  clear(): void {
    this.files.clear();
  }
}
