import { createHash } from "node:crypto";
import { stableStringify } from "./stable-stringify.js";

export type ToolCallRecord = {
  signature: string;
  resultSignature?: string;
};

export class ToolLoopDetector {
  private readonly history: ToolCallRecord[] = [];

  constructor(
    private readonly warningThreshold: number = 4,
    private readonly maxHistory: number = 30,
  ) {}

  beforeCall(tool: string, args: unknown): string | undefined {
    const signature = hash({ tool, args });
    const repeats = this.history.filter((record) => record.signature === signature).length;
    if (repeats >= this.warningThreshold) {
      return `tool loop detected: ${tool} repeated ${repeats + 1} times with identical arguments`;
    }
    this.history.push({ signature });
    if (this.history.length > this.maxHistory) this.history.shift();
    return undefined;
  }

  recordOutcome(tool: string, args: unknown, outcome: unknown): void {
    const signature = hash({ tool, args });
    const record = [...this.history].reverse().find((entry) => entry.signature === signature && !entry.resultSignature);
    if (record) record.resultSignature = hash(outcome);
  }
}

function hash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}
