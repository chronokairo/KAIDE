import { mock } from "bun:test";

// --- Minimal AssistantMessageEventStream implementation ---
class EventStream<T> {
  private queue: T[] = [];
  private waiting: Array<(r: { value: T | undefined; done: boolean }) => void> = [];
  private done = false;
  private finalResolve!: (v: unknown) => void;
  readonly finalResultPromise: Promise<unknown>;
  constructor(
    private isComplete: (e: T) => boolean,
    private extractResult: (e: T) => unknown,
  ) {
    this.finalResultPromise = new Promise((r) => { this.finalResolve = r; });
  }
  push(event: T) {
    if (this.done) return;
    if (this.isComplete(event)) {
      this.done = true;
      this.finalResolve(this.extractResult(event));
    }
    const w = this.waiting.shift();
    if (w) w({ value: event, done: false });
    else this.queue.push(event);
  }
  end(result?: unknown) {
    this.done = true;
    if (result !== undefined) this.finalResolve(result);
    while (this.waiting.length > 0) this.waiting.shift()!({ value: undefined, done: true });
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.queue.length > 0) yield this.queue.shift()!;
      else if (this.done) return;
      else {
        const r = await new Promise<{ value: T | undefined; done: boolean }>((res) => this.waiting.push(res));
        if (r.done) return;
        yield r.value!;
      }
    }
  }
  result() { return this.finalResultPromise; }
}
class AssistantMessageEventStream extends EventStream<Record<string, unknown>> {
  constructor() {
    super(
      (e: Record<string, unknown>) => e.type === "done" || e.type === "error",
      (e: Record<string, unknown>) => (e.type === "done" ? e.message : e.error),
    );
  }
}

// Mock @mariozechner/pi-ai with minimal stubs
mock.module("@mariozechner/pi-ai", () => ({
  createAssistantMessageEventStream: () => new AssistantMessageEventStream(),
  streamSimple: async function* () {},
  // Type stubs (not needed at runtime but included for completeness)
}));

// Stub code/plugin-sdk virtual modules (only available in the bundled build)
mock.module("code/plugin-sdk/ssrf-runtime", () => ({
  fetchWithSsrFGuard: async () => { throw new Error("fetchWithSsrFGuard: not mocked per-test"); },
}));

mock.module("code/plugin-sdk/error-runtime", () => ({
  formatErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

const LOCAL_MARKER_SUFFIXES = ["-local", "-key", "-apikey"];
mock.module("code/plugin-sdk/provider-auth", () => ({
  isNonSecretApiKeyMarker: (key: unknown) =>
    typeof key === "string" && LOCAL_MARKER_SUFFIXES.some((s) => key.toLowerCase().endsWith(s)),
}));

mock.module("code/plugin-sdk/provider-model-shared", () => ({
  DEFAULT_CONTEXT_TOKENS: 200000,
  normalizeProviderId: (id: unknown) => (typeof id === "string" ? id.toLowerCase() : ""),
}));

mock.module("code/plugin-sdk/provider-stream-shared", () => ({
  resolveMoonshotThinkingType: ({ thinkingLevel }: { thinkingLevel?: unknown }) => {
    if (thinkingLevel === "high" || thinkingLevel === "max" || thinkingLevel === "xhigh") return "enabled";
    if (thinkingLevel === "off") return "disabled";
    return undefined;
  },
  createMoonshotThinkingWrapper: (
    fn: (m: unknown, c: unknown, o: Record<string, unknown> | undefined) => unknown,
    thinkingType: string | undefined,
  ) => {
    if (!thinkingType) return fn;
    return (model: unknown, context: unknown, options: Record<string, unknown> | undefined) => {
      const wrappedOptions = options
        ? {
            ...options,
            onPayload: (body: Record<string, unknown>, ...args: unknown[]) => {
              body.thinking = { type: thinkingType };
              (options.onPayload as ((...a: unknown[]) => void) | undefined)?.(body, ...args);
            },
          }
        : options;
      return fn(model, context, wrappedOptions);
    };
  },
  streamWithPayloadPatch: (
    fn: (m: unknown, c: unknown, o: unknown) => unknown,
    model: unknown,
    context: unknown,
    options: Record<string, unknown> | undefined,
    patch: (p: Record<string, unknown>) => void,
  ) => {
    const wrappedOptions = options
      ? {
          ...options,
          onPayload: (body: Record<string, unknown>, ...args: unknown[]) => {
            patch(body);
            (options.onPayload as ((...a: unknown[]) => void) | undefined)?.(body, ...args);
          },
        }
      : options;
    return fn(model, context, wrappedOptions);
  },
}));

mock.module("code/plugin-sdk/runtime-env", () => ({
  createSubsystemLogger: (_name: string) => ({
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }),
}));

mock.module("code/plugin-sdk/text-runtime", () => ({
  normalizeLowercaseStringOrEmpty: (s: unknown) => (typeof s === "string" ? s.toLowerCase() : ""),
  readStringValue: (v: unknown) => (typeof v === "string" ? v : undefined),
}));
