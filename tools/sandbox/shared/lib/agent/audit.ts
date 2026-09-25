import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "audit.log");

export async function writeAuditLog(event: string, payload: unknown): Promise<void> {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    payload,
  };

  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
}
