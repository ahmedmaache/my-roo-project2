import type { EnvConfig, GlovenConfig } from '../config.js';
import type { HealthCheckResult } from '../types.js';
import { getMonthlyTotal, getCurrentMonth } from '../observability/costLedger.js';
import { logger } from '../observability/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Health command options
 */
export interface HealthOptions {
  json?: boolean;
}

/**
 * Check if API key is configured for the provider
 */
function checkApiKey(envConfig: EnvConfig): boolean {
  switch (envConfig.provider) {
    case 'openai':
      return !!envConfig.openaiApiKey;
    case 'anthropic':
      return !!envConfig.anthropicApiKey;
    case 'openrouter':
      return !!envConfig.openrouterApiKey;
    default:
      return false;
  }
}

/**
 * Check filesystem access
 */
function checkFilesystem(config: GlovenConfig): { promptDirExists: boolean; outDirWritable: boolean } {
  // Check prompt directory exists
  const promptDir = path.resolve(config.promptDir);
  const promptDirExists = fs.existsSync(promptDir);

  // Check output directory is writable
  let outDirWritable = false;
  try {
    const outDir = path.resolve(config.outDir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.accessSync(outDir, fs.constants.W_OK);
    outDirWritable = true;
  } catch {
    outDirWritable = false;
  }

  return { promptDirExists, outDirWritable };
}

/**
 * Detect CI environment
 */
function detectCI(): { isCI: boolean; ciPlatform?: string } {
  const isCI = process.env.CI === 'true';
  
  let ciPlatform: string | undefined;
  if (process.env.GITHUB_ACTIONS === 'true') {
    ciPlatform = 'GitHub Actions';
  } else if (process.env.GITLAB_CI === 'true') {
    ciPlatform = 'GitLab CI';
  } else if (process.env.CIRCLECI === 'true') {
    ciPlatform = 'CircleCI';
  } else if (isCI) {
    ciPlatform = 'Unknown';
  }

  return { isCI, ciPlatform };
}

/**
 * Check cost budget
 */
async function checkCostBudget(): Promise<{ monthToDate: number; budget: number; percentUsed: number }> {
  const currentMonth = getCurrentMonth();
  const monthToDate = await getMonthlyTotal(currentMonth);
  const budget = parseFloat(process.env.COST_BUDGET_USD || '50');
  const percentUsed = budget > 0 ? (monthToDate / budget) * 100 : 0;

  return { monthToDate, budget, percentUsed };
}

/**
 * Perform health checks
 */
export async function performHealthCheck(
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<HealthCheckResult> {
  const apiKeyConfigured = checkApiKey(envConfig);
  const filesystem = checkFilesystem(config);
  const ci = detectCI();
  const cost = await checkCostBudget();

  const warnings: string[] = [];
  const errors: string[] = [];

  // Environment checks
  if (!apiKeyConfigured && !envConfig.dryRun) {
    errors.push(`No API key configured for provider: ${envConfig.provider}`);
  }

  if (envConfig.dryRun) {
    warnings.push('Running in DRY_RUN mode - using placeholder data');
  }

  // Filesystem checks
  if (!filesystem.promptDirExists) {
    errors.push(`Prompt directory does not exist: ${config.promptDir}`);
  }

  if (!filesystem.outDirWritable) {
    errors.push(`Output directory is not writable: ${config.outDir}`);
  }

  // Cost budget checks
  if (cost.percentUsed >= 100) {
    errors.push(`Cost budget exceeded: $${cost.monthToDate.toFixed(2)} / $${cost.budget.toFixed(2)} (${cost.percentUsed.toFixed(1)}%)`);
  } else if (cost.percentUsed >= 80) {
    warnings.push(`Cost budget at ${cost.percentUsed.toFixed(1)}%: $${cost.monthToDate.toFixed(2)} / $${cost.budget.toFixed(2)}`);
  }

  const passed = errors.length === 0;

  return {
    passed,
    warnings,
    errors,
    details: {
      environment: {
        provider: envConfig.provider,
        model: envConfig.model,
        dryRun: envConfig.dryRun,
        apiKeyConfigured,
      },
      filesystem,
      ci,
      cost,
    },
  };
}

/**
 * Health command implementation
 */
export async function health(
  options: HealthOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  logger.info('Running health checks');

  const result = await performHealthCheck(config, envConfig);

  if (options.json) {
    // JSON output
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Pretty terminal output
    console.log('\n🏥 Gloven Health Check\n');
    console.log('═'.repeat(50));

    // Environment
    console.log('\n📋 Environment');
    console.log(`   Provider: ${result.details.environment.provider}`);
    console.log(`   Model: ${result.details.environment.model}`);
    console.log(`   DRY_RUN: ${result.details.environment.dryRun ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   API Key: ${result.details.environment.apiKeyConfigured ? '✅ Configured' : '❌ Missing'}`);

    // Filesystem
    console.log('\n📁 Filesystem');
    console.log(`   Prompt Dir: ${result.details.filesystem.promptDirExists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   Output Dir: ${result.details.filesystem.outDirWritable ? '✅ Writable' : '❌ Not writable'}`);

    // CI
    console.log('\n🤖 CI Detection');
    console.log(`   Running in CI: ${result.details.ci.isCI ? '✅ Yes' : '❌ No'}`);
    if (result.details.ci.ciPlatform) {
      console.log(`   Platform: ${result.details.ci.ciPlatform}`);
    }

    // Cost
    console.log('\n💰 Cost Budget');
    console.log(`   Month-to-date: $${result.details.cost.monthToDate.toFixed(2)}`);
    console.log(`   Budget: $${result.details.cost.budget.toFixed(2)}`);
    console.log(`   Used: ${result.details.cost.percentUsed.toFixed(1)}%`);

    const costBar = '█'.repeat(Math.min(50, Math.floor(result.details.cost.percentUsed / 2)));
    const costEmpty = '░'.repeat(Math.max(0, 50 - costBar.length));
    let costColor = '';
    if (result.details.cost.percentUsed >= 100) costColor = '🔴';
    else if (result.details.cost.percentUsed >= 80) costColor = '🟡';
    else costColor = '🟢';
    console.log(`   ${costColor} [${costBar}${costEmpty}]`);

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`   • ${warning}`);
      }
    }

    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of result.errors) {
        console.log(`   • ${error}`);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(50));
    if (result.passed && result.warnings.length === 0) {
      console.log('✅ All checks passed - system healthy\n');
    } else if (result.passed) {
      console.log('⚠️  System operational with warnings\n');
    } else {
      console.log('❌ System has errors - action required\n');
    }
  }

  // Exit codes: 0 = success, 1 = warnings, 2 = errors
  if (!result.passed) {
    process.exit(2);
  } else if (result.warnings.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}