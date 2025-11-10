import type { LLMProvider } from '../providers/base.js';
import type { EnvConfig, GlovenConfig } from '../config.js';
import type { Application, ScoredApplication } from '../types.js';
import { ingestApplications } from '../pipelines/appIngest.js';
import { rankApplications } from '../pipelines/ranker.js';
import { exportAll } from '../pipelines/exporters.js';
import { ApplicationScoreSchema, createDryRunApplicationScore } from '../zodSchemas.js';
import { loadSystemPrompt, buildUserPrompt } from '../promptLoader.js';
import { writeFile, writeJSON, resolvePath } from '../util/fs.js';
import { estimateTokens } from '../util/costGuard.js';
import { logCost, getCurrentMonth } from '../observability/costLedger.js';
import { logger } from '../observability/logger.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Batch score command options
 */
export interface BatchScoreOptions {
  input: string;
  concurrency?: string;
  out?: string;
  dryRun?: boolean;
}

/**
 * Generate deterministic dry-run score based on app ID
 */
function generateDeterministicScore(app: Application): any {
  // Create stable hash from app ID
  const hash = crypto.createHash('md5').update(app.id).digest('hex');
  const seed = parseInt(hash.substring(0, 8), 16);
  
  // Deterministic pseudo-random score (60-95 range)
  const baseScore = 60 + (seed % 36);
  
  // Deterministic decision based on score
  let decision: 'GO' | 'WAITLIST' | 'NO_GO';
  if (baseScore >= 70) decision = 'GO';
  else if (baseScore >= 60) decision = 'WAITLIST';
  else decision = 'NO_GO';
  
  // Deterministic criterion scores
  const criterionScore = (offset: number) => {
    const val = ((seed + offset) % 5) + 1;
    return Math.max(1, Math.min(5, val));
  };

  return {
    ...createDryRunApplicationScore(app.company || 'DRY-RUN Startup'),
    startup_name: app.company,
    weighted_total_0to100: baseScore,
    decision,
    team: { ...createDryRunApplicationScore('').team, score: criterionScore(0) },
    problem_size: { ...createDryRunApplicationScore('').problem_size, score: criterionScore(1) },
    insight: { ...createDryRunApplicationScore('').insight, score: criterionScore(2) },
    traction: { ...createDryRunApplicationScore('').traction, score: criterionScore(3) },
    timing: { ...createDryRunApplicationScore('').timing, score: criterionScore(4) },
    fit: { ...createDryRunApplicationScore('').fit, score: criterionScore(5) },
    impact: { ...createDryRunApplicationScore('').impact, score: criterionScore(6) },
    summary: `DRY-RUN: Deterministic score for ${app.company}. This is placeholder data with score ${baseScore}/100.`,
  };
}

/**
 * Score a single application with retry logic
 */
async function scoreApplication(
  provider: LLMProvider,
  app: Application,
  config: GlovenConfig,
  envConfig: EnvConfig,
  runId: string
): Promise<ScoredApplication> {
  logger.info(`Scoring application: ${app.company}`, { id: app.id, runId });

  // Handle DRY_RUN mode
  if (envConfig.dryRun) {
    const dryScore = generateDeterministicScore(app);
    return { app, score: dryScore };
  }

  // Load prompts
  const systemPrompt = await loadSystemPrompt(config.promptDir);
  const applicationData = {
    startup_name: app.company,
    founder_name: app.founderName,
    email: app.email,
    region: app.region,
    stage: app.stage,
    description: app.summary,
    links: app.links,
  };

  const userPrompt = await buildUserPrompt('score', config.promptDir, {
    application_data: JSON.stringify(applicationData, null, 2),
  });

  const fullPrompt = `${userPrompt}\n\n${JSON.stringify(applicationData, null, 2)}`;

  // Log cost
  const inputTokens = estimateTokens(systemPrompt + fullPrompt);
  const outputTokens = envConfig.maxOutputTokens;
  const costUSD = (inputTokens / 1000) * envConfig.costPer1kInput + 
                  (outputTokens / 1000) * envConfig.costPer1kOutput;

  await logCost({
    timestamp: new Date().toISOString(),
    provider: envConfig.provider,
    model: envConfig.model,
    estTokensIn: inputTokens,
    estTokensOut: outputTokens,
    estCostUSD: costUSD,
    runId,
    cmd: 'batch-score',
  });

  let retries = 0;
  const maxRetries = 1;

  while (retries <= maxRetries) {
    try {
      const response = await provider.generate({
        system: systemPrompt,
        prompt: fullPrompt,
        json: true,
        maxTokens: envConfig.maxOutputTokens,
      });

      // Parse and validate
      const parsed = JSON.parse(response);
      const scoreData = ApplicationScoreSchema.parse(parsed);

      return { app, score: scoreData };
    } catch (error) {
      logger.warn(`Scoring failed for ${app.company} (attempt ${retries + 1}/${maxRetries + 1}): ${(error as Error).message}`);
      
      if (retries >= maxRetries) {
        throw new Error(`Failed to score ${app.company} after ${maxRetries + 1} attempts: ${(error as Error).message}`);
      }
      
      retries++;
      // Exponential backoff with jitter
      const backoff = Math.min(1000 * Math.pow(2, retries) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw new Error('Unreachable');
}

/**
 * Process applications in batches with concurrency control
 */
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];
  const queue = [...items];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const promises = batch.map(item =>
      processor(item)
        .then(result => results.push(result))
        .catch(error => errors.push({ item, error }))
    );

    await Promise.all(promises);
  }

  return { results, errors };
}

/**
 * Batch score command implementation
 */
export async function batchScore(
  provider: LLMProvider,
  options: BatchScoreOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  const runId = crypto.randomUUID();
  const concurrency = parseInt(options.concurrency || '3', 10);
  const outDir = resolvePath(options.out || '../../out');

  logger.info('Starting batch scoring', { runId, concurrency, input: options.input });

  // Ingest applications
  const { apps, duplicates } = await ingestApplications(options.input);

  if (apps.length === 0) {
    logger.warn('No applications to score');
    return;
  }

  // Create output directories
  const scoresDir = path.join(outDir, 'scores');
  const rawDir = path.join(outDir, 'raw');
  await fs.mkdir(scoresDir, { recursive: true });
  await fs.mkdir(rawDir, { recursive: true });

  // Score applications
  logger.info(`Scoring ${apps.length} applications with concurrency ${concurrency}`);
  
  const { results: scored, errors } = await processWithConcurrency(
    apps,
    concurrency,
    (app) => scoreApplication(provider, app, config, envConfig, runId)
  );

  logger.info(`Scoring complete: ${scored.length} succeeded, ${errors.length} failed`);

  if (errors.length > 0) {
    logger.warn('Some applications failed to score:', {
      failed: errors.map(e => ({ id: (e.item as Application).id, error: e.error.message })),
    });
  }

  // Write individual score files
  const jsonlLines: string[] = [];
  
  for (const { app, score } of scored) {
    // Write JSON
    const jsonPath = path.join(scoresDir, `${app.id}.json`);
    await writeJSON(jsonPath, score);

    // Write markdown summary
    const mdPath = path.join(scoresDir, `${app.id}.md`);
    const summary = generateScoreSummary(score);
    await writeFile(mdPath, summary);

    // Append to JSONL
    jsonlLines.push(JSON.stringify({ id: app.id, score }));
  }

  // Write scores.jsonl
  const jsonlPath = path.join(outDir, 'scores.jsonl');
  await writeFile(jsonlPath, jsonlLines.join('\n'));

  // Rank and export
  const ranked = rankApplications(scored);
  await exportAll(ranked, outDir);

  // Summary
  logger.info('Batch scoring complete', {
    total: apps.length,
    scored: scored.length,
    failed: errors.length,
    duplicates: duplicates.length,
    runId,
  });

  console.log(`\n✅ Batch scoring complete!`);
  console.log(`   Scored: ${scored.length}/${apps.length}`);
  console.log(`   Outputs: ${outDir}`);
  if (duplicates.length > 0) {
    console.log(`   ⚠️  Duplicates removed: ${duplicates.length}`);
  }
}

/**
 * Generate markdown summary from score
 */
function generateScoreSummary(score: any): string {
  return `# Application Score: ${score.startup_name}

## Overall Assessment

**Decision:** ${score.decision}
**Weighted Score:** ${score.weighted_total_0to100}/100

${score.summary}

## Detailed Scores

| Criterion | Score (1-5) |
|-----------|-------------|
| Team (25%) | ${score.team?.score || 'N/A'} |
| Problem Size (20%) | ${score.problem_size?.score || 'N/A'} |
| Insight (15%) | ${score.insight?.score || 'N/A'} |
| Traction (15%) | ${score.traction?.score || 'N/A'} |
| Timing (10%) | ${score.timing?.score || 'N/A'} |
| Fit (10%) | ${score.fit?.score || 'N/A'} |
| Impact (5%) | ${score.impact?.score || 'N/A'} |

${score.red_flags && score.red_flags.length > 0 ? `## 🚩 Red Flags\n\n${score.red_flags.map((flag: string) => `- ${flag}`).join('\n')}\n` : ''}

${score.followup_questions && score.followup_questions.length > 0 ? `## Follow-up Questions\n\n${score.followup_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n` : ''}

---
*Generated by Gloven CLI*
`;
}