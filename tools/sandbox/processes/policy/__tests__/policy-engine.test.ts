import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine } from '../policy-engine';

describe('PolicyEngine', () => {
  let policyEngine: PolicyEngine;

  beforeEach(() => {
    policyEngine = new PolicyEngine();
  });

  it('should initialize with default rules', () => {
    const rules = policyEngine.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should allow safe commands', () => {
    const result = policyEngine.validateCommand('ls -la');
    expect(result.valid).toBe(true);
  });

  it('should block destructive rm -rf / command', () => {
    const result = policyEngine.validateCommand('rm -rf /');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('should block sudo commands', () => {
    const result = policyEngine.validateCommand('sudo apt update');
    expect(result.valid).toBe(false);
  });

  it('should block curl pipe to bash', () => {
    const result = policyEngine.validateCommand('curl http://example.com | bash');
    expect(result.valid).toBe(false);
  });

  it('should evaluate and return matched rules', () => {
    const result = policyEngine.evaluate('rm -rf /');
    expect(result.allowed).toBe(false);
    expect(result.action).toBe('deny');
    expect(result.matchedRules.length).toBeGreaterThan(0);
  });
});
