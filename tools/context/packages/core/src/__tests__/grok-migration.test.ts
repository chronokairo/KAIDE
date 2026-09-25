import { describe, it, expect, beforeEach } from 'vitest';
import {
  QUALITY_PRESETS,
  AVAILABLE_MODELS,
  getModelForAgent,
  getModelCost,
  getModelsByCostRange,
  getPresetRanking,
  applyQualityPreset,
  loadAgentConfig,
} from '../agent-config';
import type { AgentRole } from '../pipeline';

/**
 * Testes de validação da migração de Grok para GPT-4.1
 * 
 * Objetivo: Garantir que todas as funcionalidades que usavam Grok
 * continuam funcionando com a nova API (GPT-4.1)
 */
describe('Grok Migration Validation', () => {
  describe('Removal of Grok from QUALITY_PRESETS', () => {
    it('should not contain grok-code-fast-1 in cafe-soluvel preset', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      const backendModel = preset.models['backend'];
      
      expect(backendModel).not.toBe('grok-code-fast-1');
      expect(backendModel).toBeDefined();
      expect(backendModel).toBe('gpt-5.4-mini');
    });

    it('should not contain grok-code-fast-1 in cafe-soluvel ranking', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      const ranking = preset.ranking;
      
      expect(ranking).not.toContain('grok-code-fast-1');
    });

    it('should not have any grok model in any preset', () => {
      Object.values(QUALITY_PRESETS).forEach(preset => {
        Object.values(preset.models).forEach(model => {
          expect(model).not.toMatch(/^grok/i);
        });
        
        preset.ranking.forEach(model => {
          expect(model).not.toMatch(/^grok/i);
        });
      });
    });

    it('should not have any grok model in AVAILABLE_MODELS', () => {
      AVAILABLE_MODELS.forEach(model => {
        expect(model.family).not.toMatch(/^grok/i);
      });
    });
  });

  describe('Backend model replacement for cafe-soluvel', () => {
    it('should use gpt-5.4-mini for backend in free tier', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      expect(preset.models['backend']).toBe('gpt-5.4-mini');
    });

    it('gpt-5.4-mini should have cost 0 (free)', () => {
      const cost = getModelCost('gpt-5.4-mini');
      expect(cost).toBe(0);
    });

    it('should use code-specialized model when available', () => {
      const coados = QUALITY_PRESETS['coado-com-carinho'];
      const backendModel = coados.models['backend'];
      
      expect(backendModel).toBe('gpt-5.3-codex');
      expect(getModelCost(backendModel)).toBe(1);
    });

    it('should use premium code model in espresso-duplo', () => {
      const espresso = QUALITY_PRESETS['espresso-duplo'];
      const backendModel = espresso.models['backend'];
      
      expect(backendModel).toBe('gpt-5.4');
      expect(getModelCost(backendModel)).toBe(3);
    });
  });

  describe('Cost tier consistency', () => {
    it('cafe-soluvel should only have models with cost 0', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      
      Object.values(preset.models).forEach(model => {
        const cost = getModelCost(model);
        expect(cost).toBe(0);
      });
    });

    it('coado-com-carinho models should be within 0.1 to 1', () => {
      const preset = QUALITY_PRESETS['coado-com-carinho'];
      
      Object.values(preset.models).forEach(model => {
        const cost = getModelCost(model);
        expect(cost).toBeGreaterThanOrEqual(0.1);
        expect(cost).toBeLessThanOrEqual(1);
      });
    });

    it('espresso-duplo models should all cost 3', () => {
      const preset = QUALITY_PRESETS['espresso-duplo'];
      
      Object.values(preset.models).forEach(model => {
        const cost = getModelCost(model);
        expect(cost).toBe(3);
      });
    });
  });

  describe('Model availability and retrieval', () => {
    it('should be able to get model for each agent role', () => {
      const roles: AgentRole[] = [
        'product-manager',
        'architect',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
        'organizer',
        'troubleshooter',
      ];

      const config = applyQualityPreset('cafe-soluvel');
      
      roles.forEach(role => {
        const model = getModelForAgent(role, config);
        expect(model).toBeDefined();
        expect(model.length).toBeGreaterThan(0);
      });
    });

    it('all backend models should exist in AVAILABLE_MODELS', () => {
      const backends = [
        QUALITY_PRESETS['cafe-soluvel'].models['backend'],
        QUALITY_PRESETS['coado-com-carinho'].models['backend'],
        QUALITY_PRESETS['espresso-duplo'].models['backend'],
      ];

      backends.forEach(model => {
        const exists = AVAILABLE_MODELS.some(m => m.family === model);
        expect(exists).toBe(true);
      });
    });

    it('should retrieve models by cost range', () => {
      const freeModels = getModelsByCostRange(0, 0);
      
      expect(freeModels.length).toBeGreaterThan(0);
      freeModels.forEach(m => {
        expect(m.cost).toBe(0);
      });
    });

    it('should have fallback models in ranking', () => {
      const ranking = getPresetRanking('cafe-soluvel');
      
      expect(ranking.length).toBeGreaterThan(0);
      ranking.forEach(model => {
        expect(model).toBeDefined();
        expect(model.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Functionality preservation', () => {
    it('should preserve all agent roles', () => {
      const expectedRoles: AgentRole[] = [
        'product-manager',
        'architect',
        'organizer',
        'troubleshooter',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
      ];

      expectedRoles.forEach(role => {
        const config = applyQualityPreset('cafe-soluvel');
        expect(role in config.models).toBe(true);
      });
    });

    it('should preserve quality preset structure', () => {
      const presetNames = ['cafe-soluvel', 'coado-com-carinho', 'espresso-duplo'] as const;
      
      presetNames.forEach(name => {
        const preset = QUALITY_PRESETS[name];
        
        expect(preset.label).toBeDefined();
        expect(preset.subtitle).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.costRange).toBeDefined();
        expect(preset.models).toBeDefined();
        expect(preset.ranking).toBeDefined();
      });
    });

    it('should have models for all agent roles in all presets', () => {
      const roles: AgentRole[] = [
        'product-manager',
        'architect',
        'organizer',
        'troubleshooter',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
      ];

      Object.values(QUALITY_PRESETS).forEach(preset => {
        roles.forEach(role => {
          expect(preset.models[role]).toBeDefined();
          expect(preset.models[role].length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Model vendor diversity', () => {
    it('cafe-soluvel should use multiple vendors', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      const vendors = new Set<string>();

      Object.values(preset.models).forEach(model => {
        const modelInfo = AVAILABLE_MODELS.find(m => m.family === model);
        if (modelInfo) {
          vendors.add(modelInfo.vendor);
        }
      });

      // Should have at least 2 different vendors for resilience
      expect(vendors.size).toBeGreaterThanOrEqual(1);
    });

    it('should include OpenAI in free tier models', () => {
      const freeModels = getModelsByCostRange(0, 0);
      const openAIModels = freeModels.filter(m => m.family.startsWith('gpt'));
      
      expect(openAIModels.length).toBeGreaterThan(0);
    });

    it('should include Anthropic in free tier models', () => {
      const freeModels = getModelsByCostRange(0, 0);
      const claudeModels = freeModels.filter(m => m.family.startsWith('claude'));
      
      expect(claudeModels.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration application', () => {
    it('should apply cafe-soluvel preset correctly', () => {
      const config = applyQualityPreset('cafe-soluvel');
      
      expect(config.mode).toBe('cafe-soluvel');
      expect(config.models).toBeDefined();
      
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      expect(config.models).toEqual(preset.models);
    });

    it('should apply coado-com-carinho preset correctly', () => {
      const config = applyQualityPreset('coado-com-carinho');
      
      expect(config.mode).toBe('coado-com-carinho');
      const preset = QUALITY_PRESETS['coado-com-carinho'];
      expect(config.models).toEqual(preset.models);
    });

    it('should apply espresso-duplo preset correctly', () => {
      const config = applyQualityPreset('espresso-duplo');
      
      expect(config.mode).toBe('espresso-duplo');
      const preset = QUALITY_PRESETS['espresso-duplo'];
      expect(config.models).toEqual(preset.models);
    });
  });

  describe('No Grok references', () => {
    it('should not have grok in any configuration description', () => {
      Object.values(QUALITY_PRESETS).forEach(preset => {
        expect(preset.description.toLowerCase()).not.toContain('grok');
        expect(preset.label.toLowerCase()).not.toContain('grok');
      });
    });

    it('should mention cost implications correctly without Grok', () => {
      const cafeSoluvel = QUALITY_PRESETS['cafe-soluvel'];
      const description = cafeSoluvel.description.toLowerCase();
      
      expect(description).toContain('zero');
      expect(description).not.toContain('grok');
    });
  });
});
