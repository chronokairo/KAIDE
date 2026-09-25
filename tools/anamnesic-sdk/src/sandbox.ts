import type {
  SandboxDependencyCheck,
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  NetworkRestrictionConfig,
  IgnoreViolationsConfig,
  SandboxOptions,
  SandboxRuntimeConfig,
  SandboxViolationEvent,
  NetworkHostPattern,
} from './types.js';
import { SandboxError, SandboxViolationError, SandboxInitializationError } from './errors.js';
import { VM } from 'vm2';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_SANDBOX_OPTIONS: Required<SandboxOptions> = {
  timeout: 5000,
  restrictGlobals: true,
  restrictFileSystem: true,
  restrictNetwork: true,
  allowedHosts: [],
  fsReadRestrictions: {},
  fsWriteRestrictions: {},
  ignoreViolations: {},
  runtimeConfig: {},
  onViolation: () => {},
};

const KEYWORDS_BLACKLIST = [
  'eval', 'require', 'process', 'Buffer', 'fs', 'child_process', 'exec', 'spawn',
  'setTimeout', 'setInterval', 'Function', '__proto__', 'constructor',
];

/**
 * Validate if code contains dangerous patterns
 */
export function validateCode(code: string): boolean {
  const normalizedCode = code.toLowerCase();
  return !KEYWORDS_BLACKLIST.some((keyword) => normalizedCode.includes(keyword));
}

// ─── SandboxViolationStore ────────────────────────────────────────────────────

export class SandboxViolationStore {
  private listeners = new Set<(event: SandboxViolationEvent) => void>();
  private violations: SandboxViolationEvent[] = [];

  subscribe(listener: (event: SandboxViolationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTotalCount(): number {
    return this.violations.length;
  }

  addViolation(violation: SandboxViolationEvent): void {
    this.violations.push(violation);
    for (const listener of this.listeners) listener(violation);
  }

  clear(): void {
    this.violations = [];
    for (const listener of this.listeners) listener({ type: 'clear' });
  }
}

const defaultSandboxStore = new SandboxViolationStore();

// ─── SandboxRuntimeConfigSchema ──────────────────────────────────────────────

export const SandboxRuntimeConfigSchema = {
  parse<T>(value: T): T {
    return value;
  },
  safeParse<T>(value: T): { success: true; data: T } {
    return { success: true, data: value };
  },
};

// ─── SandboxVM ───────────────────────────────────────────────────────────────

export class SandboxVM {
  private vm: VM;
  private options: Required<SandboxOptions>;

  constructor(options: SandboxOptions = {}) {
    this.options = { ...DEFAULT_SANDBOX_OPTIONS, ...options };

    this.vm = new VM({
      timeout: this.options.timeout,
      sandbox: {},
      require: {
        external: false,
        builtin: this.options.restrictFileSystem ? [] : ['fs', 'child_process'],
      },
    });
  }

  /**
   * Execute code in sandbox
   */
  run(code: string, context?: Record<string, unknown>): unknown {
    if (!validateCode(code)) {
      throw new SandboxViolationError(
        { type: 'code_validation', details: { code } },
        'Dangerous code patterns detected',
      );
    }

    try {
      return this.vm.run(code);
    } catch (err) {
      if (err instanceof Error) {
        throw new SandboxError(`Sandbox runtime error: ${err.message}`);
      }
      throw new SandboxError('Unknown sandbox error');
    }
  }

  /**
   * Dispose sandbox
   */
  dispose(): void {
    this.vm.destroy();
  }
}

// ─── SandboxManager ───────────────────────────────────────────────────────────

export class SandboxManager {
  private static instances = new Map<string, SandboxVM>();
  private static globalOptions: SandboxOptions = {};

  static checkDependencies(_args?: unknown): SandboxDependencyCheck {
    try {
      require.resolve('vm2'); // Test if vm2 is installed
      return { errors: [], warnings: [] };
    } catch {
      return { errors: ['vm2 is not installed. Install with: npm install vm2'] };
    }
  }

  static isSupportedPlatform(): boolean {
    return true;
  }

  static wrapWithSandbox(command: string): string {
    return command;
  }

  static async initialize(config?: SandboxOptions): Promise<void> {
    if (config) this.globalOptions = config;
    const deps = this.checkDependencies();
    if (deps.errors.length > 0) {
      throw new SandboxInitializationError(deps.errors.join(', '));
    }
  }

  static updateConfig(config: SandboxOptions): void {
    this.globalOptions = { ...this.globalOptions, ...config };
  }

  static async reset(): Promise<void> {
    this.instances.forEach((vm) => vm.dispose());
    this.instances.clear();
  }

  static isSandboxingEnabled(): boolean {
    return true;
  }

  static isAutoAllowBashIfSandboxedEnabled(): boolean {
    return false;
  }

  static getFsReadConfig(): FsReadRestrictionConfig {
    return this.globalOptions.fsReadRestrictions || {};
  }

  static getFsWriteConfig(): FsWriteRestrictionConfig {
    return this.globalOptions.fsWriteRestrictions || {};
  }

  static getNetworkRestrictionConfig(): NetworkRestrictionConfig {
    return {
      allowedHosts: this.globalOptions.allowedHosts || [],
    };
  }

  static getIgnoreViolations(): IgnoreViolationsConfig {
    return this.globalOptions.ignoreViolations || {};
  }

  static getAllowUnixSockets(): boolean {
    return false;
  }

  static getAllowLocalBinding(): boolean {
    return false;
  }

  static getEnableWeakerNestedSandbox(): boolean {
    return false;
  }

  static getProxyPort(): number | undefined {
    return undefined;
  }

  static getSocksProxyPort(): number | undefined {
    return undefined;
  }

  static getLinuxHttpSocketPath(): string | undefined {
    return undefined;
  }

  static getLinuxSocksSocketPath(): string | undefined {
    return undefined;
  }

  static async waitForNetworkInitialization(): Promise<boolean> {
    return Promise.resolve(true);
  }

  static annotateStderrWithSandboxFailures(_command: string, stderr: string): string {
    return stderr;
  }

  static cleanupAfterCommand(): void {
    return;
  }

  static getLinuxGlobPatternWarnings(): string[] {
    return [];
  }

  static getSandboxViolationStore(): SandboxViolationStore {
    return defaultSandboxStore;
  }

  /**
   * Create or get a sandbox instance by name
   */
  static getInstance(name = 'default', options?: SandboxOptions): SandboxVM {
    if (!this.instances.has(name)) {
      const instanceOptions = { ...this.globalOptions, ...options };
      this.instances.set(name, new SandboxVM(instanceOptions));
    }
    return this.instances.get(name)!;
  }
}
