/**
 * Node.js-only sandbox runtime.
 * Import from '@chronokairo/sdk/sandbox' — never from the main entry point.
 * This module requires vm2 and cannot be bundled for browser/renderer contexts.
 */
export { SandboxManager, SandboxViolationStore, SandboxRuntimeConfigSchema } from './src/sandbox.js'
