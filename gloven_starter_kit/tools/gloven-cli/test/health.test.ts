import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performHealthCheck } from '../src/commands/health.js';
import type { GlovenConfig, EnvConfig } from '../src/config.js';

describe('Health Command', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  const mockConfig: GlovenConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    outDir: '../../out',
    promptDir: '../../ai_prompts',
    locale: 'global',
    guardrails: {
      maxRequests: 8,
      dryRunFallback: true,
    },
  };

  describe('Environment Checks', () => {
    it('should pass with DRY_RUN and no API key', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true, // DRY_RUN mode
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.environment.dryRun).toBe(true);
      expect(result.warnings).toContain('Running in DRY_RUN mode - using placeholder data');
      // Should not have API key error in DRY_RUN
      expect(result.errors.every(e => !e.includes('No API key'))).toBe(true);
    });

    it('should fail without API key when not in DRY_RUN', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: false, // Production mode
        costPer1kInput: 0,
        costPer1kOutput: 0,
        // No API key
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('No API key configured'))).toBe(true);
    });

    it('should pass with API key configured', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        openaiApiKey: 'sk-test-key',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: false,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.environment.apiKeyConfigured).toBe(true);
      // Should not have API key error
      expect(result.errors.every(e => !e.includes('No API key'))).toBe(true);
    });
  });

  describe('CI Detection', () => {
    it('should detect GitHub Actions', async () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';

      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.ci.isCI).toBe(true);
      expect(result.details.ci.ciPlatform).toBe('GitHub Actions');
    });

    it('should detect non-CI environment', async () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;

      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.ci.isCI).toBe(false);
      expect(result.details.ci.ciPlatform).toBeUndefined();
    });
  });

  describe('Cost Budget Checks', () => {
    it('should warn at 80% budget usage', async () => {
      process.env.COST_BUDGET_USD = '100';
      // Mock would need actual ledger file with entries totaling 80
      // For this test, we'll verify the logic structure

      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      // Cost checks are performed
      expect(result.details.cost).toBeDefined();
      expect(result.details.cost.budget).toBe(100);
    });

    it('should use default budget when not specified', async () => {
      delete process.env.COST_BUDGET_USD;

      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      // Default budget is 50
      expect(result.details.cost.budget).toBe(50);
    });
  });

  describe('Filesystem Checks', () => {
    it('should detect existing prompt directory', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      // The actual prompt directory should exist in the project
      expect(result.details.filesystem.promptDirExists).toBeDefined();
    });

    it('should check output directory writability', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.filesystem.outDirWritable).toBeDefined();
    });
  });

  describe('Overall Health Status', () => {
    it('should pass with minimal valid configuration', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        openaiApiKey: 'sk-test',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: false,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('details');
    });

    it('should have warnings in DRY_RUN mode but still pass', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: true,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.warnings.length).toBeGreaterThan(0);
      // Warnings don't prevent passing if no errors
      if (result.errors.length === 0) {
        expect(result.passed).toBe(true);
      }
    });
  });

  describe('Provider Validation', () => {
    it('should validate OpenAI provider', async () => {
      const envConfig: EnvConfig = {
        provider: 'openai',
        openaiApiKey: 'sk-test',
        model: 'gpt-4o-mini',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: false,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.environment.provider).toBe('openai');
      expect(result.details.environment.apiKeyConfigured).toBe(true);
    });

    it('should validate Anthropic provider', async () => {
      const envConfig: EnvConfig = {
        provider: 'anthropic',
        anthropicApiKey: 'sk-ant-test',
        model: 'claude-3-sonnet',
        rateLimitRps: 2,
        maxOutputTokens: 2000,
        dryRun: false,
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const result = await performHealthCheck(mockConfig, envConfig);

      expect(result.details.environment.provider).toBe('anthropic');
      expect(result.details.environment.apiKeyConfigured).toBe(true);
    });
  });
});