import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateScore } from '../src/generators/score.js';
import { OpenAIProvider } from '../src/providers/openai.js';
import { readJSON, writeJSON, fileExists, resolvePath } from '../src/util/fs.js';
import { ApplicationScoreSchema } from '../src/zodSchemas.js';
import fs from 'fs/promises';
import path from 'path';

describe('Score Generator', () => {
  const testInputPath = '../../data/apps/test_application.json';
  const testOutputPath = '../../out/test_score.json';

  beforeAll(async () => {
    // Create test application data
    const testApp = {
      startup_name: 'Test Startup',
      one_liner: 'Test product',
      founders: [{ name: 'Test Founder', role: 'CEO', background: 'Test background' }],
      location: 'Test Location',
      problem: 'Test problem',
      solution: 'Test solution',
      traction: 'Test traction',
      business_model: 'Test model',
      why_gloven: 'Test reason',
    };

    const inputPath = resolvePath(testInputPath);
    await writeJSON(inputPath, testApp);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(resolvePath(testInputPath));
      await fs.unlink(resolvePath(testOutputPath));
      await fs.unlink(resolvePath(testOutputPath.replace('.json', '.md')));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate valid schema-compliant JSON in DRY_RUN mode', async () => {
    // Create provider in DRY_RUN mode (no API key)
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

    // Generate score
    await generateScore(
      provider,
      { input: testInputPath, out: testOutputPath },
      config,
      envConfig
    );

    // Verify output file exists
    const outputExists = await fileExists(resolvePath(testOutputPath));
    expect(outputExists).toBe(true);

    // Read and validate JSON
    const scoreData = await readJSON(resolvePath(testOutputPath));
    
    // Validate against zod schema
    const validationResult = ApplicationScoreSchema.safeParse(scoreData);
    expect(validationResult.success).toBe(true);

    if (validationResult.success) {
      const score = validationResult.data;
      
      // Verify required fields
      expect(score.startup_name).toBeDefined();
      expect(score.weighted_total_0to100).toBeGreaterThanOrEqual(0);
      expect(score.weighted_total_0to100).toBeLessThanOrEqual(100);
      expect(['GO', 'NO_GO', 'WAITLIST']).toContain(score.decision);
      expect(Array.isArray(score.red_flags)).toBe(true);
      expect(Array.isArray(score.followup_questions)).toBe(true);
      expect(score.summary.length).toBeGreaterThan(50);
    }
  });

  it('should create human-readable summary markdown file', async () => {
    const mdPath = resolvePath(testOutputPath.replace('.json', '.md'));
    const mdExists = await fileExists(mdPath);
    expect(mdExists).toBe(true);

    // Verify markdown content has required sections
    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# Application Score:');
    expect(mdContent).toContain('## Overall Assessment');
    expect(mdContent).toContain('**Decision:**');
    expect(mdContent).toContain('**Weighted Score:**');
    expect(mdContent).toContain('## Detailed Scores');
  });
});