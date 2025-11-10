import type { LLMProvider } from '../providers/base.js';
import { ApplicationScoreSchema, createDryRunApplicationScore } from '../zodSchemas.js';
import { loadSystemPrompt, buildUserPrompt } from '../promptLoader.js';
import { writeFile, writeJSON, readJSON, resolvePath } from '../util/fs.js';
import { logCostEstimate } from '../util/costGuard.js';
import type { EnvConfig, GlovenConfig } from '../config.js';

export interface ScoreOptions {
  input: string;
  out: string;
}

/**
 * Generate application score using AI
 */
export async function generateScore(
  provider: LLMProvider,
  options: ScoreOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  console.log('\n📊 Generating application score...');
  console.log(`📄 Input: ${options.input}`);

  // Read application data
  const inputPath = resolvePath(options.input);
  const applicationData = await readJSON(inputPath);

  // Handle DRY_RUN mode
  if (envConfig.dryRun) {
    console.log('🏃 DRY-RUN mode: Using placeholder data');
    const dryRunScore = createDryRunApplicationScore(
      (applicationData as { startup_name?: string }).startup_name || 'DRY-RUN Startup'
    );

    // Write JSON output
    const jsonPath = resolvePath(options.out);
    await writeJSON(jsonPath, dryRunScore);
    console.log(`✅ Score saved to: ${jsonPath}`);

    // Write human-readable summary
    const mdPath = jsonPath.replace('.json', '.md');
    const summary = generateScoreSummary(dryRunScore);
    await writeFile(mdPath, summary);
    console.log(`✅ Summary saved to: ${mdPath}`);
    return;
  }

  // Load prompts
  const systemPrompt = await loadSystemPrompt(config.promptDir);
  const userPrompt = await buildUserPrompt('score', config.promptDir, {
    application_data: JSON.stringify(applicationData, null, 2),
  });

  const fullPrompt = `${userPrompt}\n\n${JSON.stringify(applicationData, null, 2)}`;

  // Log cost estimate
  logCostEstimate(
    systemPrompt + fullPrompt,
    envConfig.maxOutputTokens,
    envConfig.costPer1kInput,
    envConfig.costPer1kOutput
  );

  try {
    // Generate score from LLM
    const response = await provider.generate({
      system: systemPrompt,
      prompt: fullPrompt,
      json: true,
      maxTokens: envConfig.maxOutputTokens,
    });

    // Parse and validate response
    let scoreData;
    try {
      const parsed = JSON.parse(response);
      scoreData = ApplicationScoreSchema.parse(parsed);
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response as valid JSON');
      console.error('Attempting retry with schema correction...');

      // Retry once with explicit schema instruction
      const retryPrompt = `${fullPrompt}\n\nIMPORTANT: Your previous response was invalid. Please respond with ONLY valid JSON matching the schema exactly. No additional text.`;
      const retryResponse = await provider.generate({
        system: systemPrompt,
        prompt: retryPrompt,
        json: true,
        maxTokens: envConfig.maxOutputTokens,
      });

      try {
        const parsed = JSON.parse(retryResponse);
        scoreData = ApplicationScoreSchema.parse(parsed);
      } catch (retryError) {
        // Save raw output for debugging
        const errorPath = resolvePath(options.out.replace('.json', '.error.txt'));
        await writeFile(errorPath, retryResponse);
        throw new Error(
          `Failed to validate score after retry. Raw output saved to ${errorPath}.\n${(retryError as Error).message}`
        );
      }
    }

    // Write JSON output
    const jsonPath = resolvePath(options.out);
    await writeJSON(jsonPath, scoreData);
    console.log(`✅ Score saved to: ${jsonPath}`);

    // Write human-readable summary
    const mdPath = jsonPath.replace('.json', '.md');
    const summary = generateScoreSummary(scoreData);
    await writeFile(mdPath, summary);
    console.log(`✅ Summary saved to: ${mdPath}`);
  } catch (error) {
    throw new Error(`Score generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generate human-readable summary from score data
 */
function generateScoreSummary(score: unknown): string {
  const s = score as {
    startup_name: string;
    weighted_total_0to100: number;
    decision: string;
    team?: { score: number };
    problem_size?: { score: number };
    insight?: { score: number };
    traction?: { score: number };
    timing?: { score: number };
    fit?: { score: number };
    impact?: { score: number };
    red_flags?: string[];
    followup_questions?: string[];
    summary: string;
  };

  return `# Application Score: ${s.startup_name}

## Overall Assessment

**Decision:** ${s.decision}
**Weighted Score:** ${s.weighted_total_0to100}/100

${s.summary}

## Detailed Scores

| Criterion | Score (1-5) |
|-----------|-------------|
| Team (25%) | ${s.team?.score || 'N/A'} |
| Problem Size (20%) | ${s.problem_size?.score || 'N/A'} |
| Insight (15%) | ${s.insight?.score || 'N/A'} |
| Traction (15%) | ${s.traction?.score || 'N/A'} |
| Timing (10%) | ${s.timing?.score || 'N/A'} |
| Fit (10%) | ${s.fit?.score || 'N/A'} |
| Impact (5%) | ${s.impact?.score || 'N/A'} |

${
  s.red_flags && s.red_flags.length > 0
    ? `## 🚩 Red Flags\n\n${s.red_flags.map((flag) => `- ${flag}`).join('\n')}\n`
    : ''
}

${
  s.followup_questions && s.followup_questions.length > 0
    ? `## Follow-up Questions\n\n${s.followup_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : ''
}

---
*Generated by Gloven CLI*
`;
}