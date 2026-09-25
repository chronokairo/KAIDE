import { describe, it, expect } from 'vitest';
import { AdaptiveOrchestratorService } from '../AdaptiveOrchestratorService';

describe('AdaptiveOrchestratorService', () => {
  const service = new AdaptiveOrchestratorService();

  it('builds a multi-step plan with adaptive reasoning', () => {
    const plan = service.buildPlan({
      objective: 'Design and implement a secure multi-service architecture with continuous validation',
      constraints: ['zero downtime', 'strict audit trail', 'multi-tenant'],
      availableModalities: ['text', 'image'],
      contextBudgetTokens: 12000,
      priority: 'high',
      deadlineMinutes: 90,
    });

    expect(plan.steps.length).toBeGreaterThanOrEqual(5);
    expect(['standard', 'extended']).toContain(plan.reasoningMode);
    expect(plan.steps.some((step) => step.capabilities.includes('auto-task-decomposition'))).toBe(true);
    expect(plan.steps.some((step) => step.capabilities.includes('multimodal-analysis'))).toBe(true);
  });

  it('removes sensitive offensive capabilities in defensive mode by default', () => {
    const plan = service.buildPlan({
      objective: 'Perform security and attack simulation analysis for the platform',
      constraints: ['defensive validation only'],
      availableModalities: ['text'],
    });

    const evaluated = service.enforcePolicy(plan, {
      mode: 'defensive',
      allowAttackSimulation: false,
      allowExploitChaining: false,
      allowRestrictionEvasionTesting: false,
      allowVulnerabilityDiscovery: false,
    });

    expect(evaluated.blockedCapabilities.length).toBeGreaterThan(0);
    expect(evaluated.plan.steps.every((step) => !step.capabilities.includes('attack-simulation'))).toBe(true);
    expect(evaluated.warnings.some((w) => w.includes('defensive policy'))).toBe(true);
  });

  it('supports controlled red-team policy when explicitly allowed', () => {
    const plan = service.buildPlan({
      objective: 'Run controlled exploit chain simulation in an approved test environment',
      constraints: ['lab only'],
      availableModalities: ['text'],
    });

    const evaluated = service.enforcePolicy(plan, {
      mode: 'controlled-red-team',
      allowAttackSimulation: true,
      allowExploitChaining: true,
      allowRestrictionEvasionTesting: true,
      allowVulnerabilityDiscovery: true,
      approvedTestScope: ['staging-lab'],
    });

    const allCapabilities = evaluated.plan.steps.flatMap((step) => step.capabilities);
    expect(allCapabilities.includes('attack-simulation')).toBe(true);
    expect(allCapabilities.includes('exploit-chain-analysis')).toBe(true);
    expect(evaluated.blockedCapabilities).toHaveLength(0);
  });

  it('tracks continuous operation state and checkpoints', () => {
    const plan = service.buildPlan({
      objective: 'Implement autonomous software improvement loop with checkpoints',
      constraints: ['must be resumable'],
      availableModalities: ['text'],
    });

    const state = service.startContinuousOperation(plan, { checkpointEverySteps: 2 });
    expect(state.status).toBe('running');

    const stepA = service.applyStepFeedback(state, {
      success: true,
      stepId: plan.steps[0].id,
      note: 'Initial context indexed',
    });
    expect(stepA.currentStep).toBe(1);

    const stepB = service.applyStepFeedback(stepA, {
      success: true,
      stepId: plan.steps[1].id,
    });

    expect(stepB.currentStep).toBe(2);
    expect(stepB.notes.some((note) => note.includes('Checkpoint reached'))).toBe(true);

    const failed = service.applyStepFeedback(stepB, {
      success: false,
      stepId: plan.steps[2].id,
      note: 'Toolchain timeout',
    });

    expect(failed.status).toBe('failed');
  });
});
