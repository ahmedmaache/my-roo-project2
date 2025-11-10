import { describe, it, expect, afterAll } from 'vitest';
import { generatePlan } from '../src/generators/plan.js';
import { OpenAIProvider } from '../src/providers/openai.js';
import { fileExists, resolvePath } from '../src/util/fs.js';
import fs from 'fs/promises';

describe('Plan Generator', () => {
  const testOutputPath = '../../out/test_plan.md';

  afterAll(async () => {
    // Clean up test file
    try {
      await fs.unlink(resolvePath(testOutputPath));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate plan with required sections in DRY_RUN mode', async () => {
    // Create provider in DRY_RUN mode
    const provider = new OpenAIProvider(undefined, 'gpt-4o-mini', true);

    const config = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      outDir: '../../out',
      promptDir: '../../ai_prompts',
      locale: 'global',
      guardrails: { maxRequests: 8, dryRunFallback: true },
    };

    const envConfig = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      rateLimitRps: 2,
      maxOutputTokens: 2000,
      dryRun: true,
      costPer1kInput: 0,
      costPer1kOutput: 0,
    };

    const options = {
      regions: 'EMEA,LATAM',
      budget: '8000',
      target: '300',
      days: '90',
      out: testOutputPath,
    };

    // Generate plan
    await generatePlan(provider, options, config, envConfig);

    // Verify output exists
    const outputExists = await fileExists(resolvePath(testOutputPath));
    expect(outputExists).toBe(true);

    // Read and verify content
    const content = await fs.readFile(resolvePath(testOutputPath), 'utf-8');

    // Check for required sections
    expect(content).toContain('# 30/60/90');
    expect(content).toContain('## Goals & KPIs');
    expect(content).toContain('## ICPs');
    expect(content).toContain('## Messaging');
    expect(content).toContain('## Channels');
    expect(content).toContain('## Calendar');
    expect(content).toContain('## Experiment');
    expect(content).toContain('## Budget');
    expect(content).toContain('## Risks');

    // Verify parameters were injected
    expect(content).toContain('EMEA');
    expect(content).toContain('300');
    expect(content).toContain('8000');
  });
});