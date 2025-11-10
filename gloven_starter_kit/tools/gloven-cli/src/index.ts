#!/usr/bin/env node

import { Command } from 'commander';
import { getConfig } from './config.js';
import { createProvider } from './providers/factory.js';
import { generatePlan } from './generators/plan.js';
import { generateCalendar } from './generators/calendar.js';
import { generatePartners } from './generators/partners.js';
import { generateScore } from './generators/score.js';
import { batchScore } from './commands/batchScore.js';
import { health } from './commands/health.js';
import { report } from './commands/report.js';
import { registerSyncAirtableCommand } from './commands/syncAirtable.js';
import { registerSyncSheetsCommand } from './commands/syncSheets.js';
import { registerPublishPortalDataCommand } from './commands/publishPortalData.js';

const program = new Command();

program
  .name('gloven')
  .description('AI-powered growth CLI for Gloven accelerator')
  .version('1.0.0');

// Plan command
program
  .command('plan')
  .description('Generate 30/60/90 day founder acquisition plan')
  .requiredOption('--regions <regions>', 'Target regions (e.g., "EMEA,LATAM")')
  .requiredOption('--budget <amount>', 'Monthly budget in USD')
  .requiredOption('--target <number>', 'Target number of applications')
  .requiredOption('--days <number>', 'Timeline in days (typically 90)')
  .requiredOption('--out <path>', 'Output file path (e.g., ../../out/plan.md)')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      const provider = createProvider(env);
      await generatePlan(provider, options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Calendar command
program
  .command('calendar')
  .description('Generate editorial calendar with content samples')
  .requiredOption('--weeks <number>', 'Number of weeks to plan')
  .requiredOption('--out <path>', 'Output file path (e.g., ../../out/editorial_calendar.md)')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      const provider = createProvider(env);
      await generateCalendar(provider, options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Partners command
program
  .command('partners')
  .description('Generate partner and mentor target lists with outreach templates')
  .requiredOption('--domains <domains>', 'Focus domains (e.g., "SaaS,AI/ML,FinTech")')
  .requiredOption('--mentors <number>', 'Number of mentor targets')
  .requiredOption('--partners <number>', 'Number of partner targets')
  .requiredOption('--out <path>', 'Output file path (e.g., ../../out/partners.md)')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      const provider = createProvider(env);
      await generatePartners(provider, options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Score command
program
  .command('score')
  .description('Score startup application using Gloven rubric')
  .requiredOption('--input <path>', 'Input JSON file with application data')
  .requiredOption('--out <path>', 'Output file path (e.g., ../../out/score.json)')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      const provider = createProvider(env);
      await generateScore(provider, options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Batch score command
program
  .command('batch-score')
  .description('Score multiple applications efficiently')
  .requiredOption('--input <path>', 'Input file or directory (e.g., ../../data/apps/applications.csv)')
  .option('--concurrency <number>', 'Concurrent scoring operations', '3')
  .option('--out <path>', 'Output directory', '../../out')
  .option('--dry-run', 'Use DRY_RUN mode with deterministic placeholder scores')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      if (options.dryRun) {
        env.dryRun = true;
      }
      const provider = createProvider(env);
      await batchScore(provider, options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check system health and readiness')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      await health(options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Report command
program
  .command('report')
  .description('Generate weekly health report')
  .option('--notify', 'Send Slack notification')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const { config, env } = getConfig();
      await report(options, config, env);
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// CRM Integration commands
registerSyncAirtableCommand(program);
registerSyncSheetsCommand(program);

// Portal Publishing command
registerPublishPortalDataCommand(program);

// Parse arguments
program.parse();