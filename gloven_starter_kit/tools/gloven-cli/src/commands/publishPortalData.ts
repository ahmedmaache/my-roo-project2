/**
 * Publish Portal Data Command
 * 
 * Sanitizes and publishes data from CLI outputs to the public portal.
 * Removes PII and generates JSON files for portal consumption.
 */

import { Command } from 'commander';
import { logger } from '../observability/logger.js';
import { loadConfig } from '../config.js';
import { ensureDir, writeJson, readJson, readFile, writeFile } from '../util/fs.js';
import {
  sanitizeApplication,
  sanitizeLeaderboard,
  getTopEntries,
  sanitizeMarkdown,
} from '../util/sanitize.js';
import type { CRMApplication, PublicHealthMetrics } from '../types_crm.js';
import type { RankedApplication } from '../types.js';
import * as path from 'path';
import { glob } from 'glob';

interface PublishOptions {
  out?: string;
  input?: string;
}

/**
 * Load scored applications from output directory
 */
async function loadScoredApplications(inputDir: string): Promise<CRMApplication[]> {
  const scoresPattern = path.join(inputDir, 'scores', '*.json');
  const files = await glob(scoresPattern);
  
  if (files.length === 0) {
    logger.warn(`No score files found in ${scoresPattern}`);
    return [];
  }
  
  const applications: CRMApplication[] = [];
  
  for (const file of files) {
    try {
      const scored: RankedApplication = await readJson(file);
      
      // Convert ranked application to CRM application format
      const crmApp: CRMApplication = {
        id: scored.app.id,
        founderName: scored.app.founderName,
        email: scored.app.email,
        company: scored.app.company,
        region: scored.app.region,
        stage: scored.app.stage,
        summary: scored.score.summary,
        decision: scored.band,
        scoreTotal: scored.score.weighted_total_0to100,
        risks: scored.score.red_flags,
      };
      
      applications.push(crmApp);
    } catch (error) {
      logger.warn(`Failed to load score file ${file}:`, error);
    }
  }
  
  return applications;
}

/**
 * Calculate health metrics from applications
 */
function calculateHealthMetrics(apps: CRMApplication[]): PublicHealthMetrics {
  const goCount = apps.filter(app => app.decision === 'GO').length;
  const waitlistCount = apps.filter(app => app.decision === 'WAITLIST').length;
  const noGoCount = apps.filter(app => app.decision === 'NO_GO').length;
  
  const totalScore = apps.reduce((sum, app) => sum + (app.scoreTotal || 0), 0);
  const avgScore = apps.length > 0 ? Math.round((totalScore / apps.length) * 10) / 10 : 0;
  
  // Try to read cost from ledger if available
  let costMTD = 0;
  // This would need to integrate with the cost ledger - leaving as 0 for now
  
  return {
    generated: new Date().toISOString(),
    totalApps: apps.length,
    goCount,
    waitlistCount,
    noGoCount,
    avgScore,
    costMTD,
  };
}

/**
 * Publish portal data files
 */
async function publishPortalData(options: PublishOptions): Promise<void> {
  const config = loadConfig();
  
  // Get output directory
  const outputDir = options.out || config.publish?.portalDataDir || '../portal/public/data';
  const inputDir = options.input || '../../out';
  
  logger.info(`[publish-portal-data] Publishing data to ${outputDir}`);
  
  // Ensure output directory exists
  await ensureDir(outputDir);
  
  // Load scored applications
  const applications = await loadScoredApplications(inputDir);
  
  if (applications.length === 0) {
    logger.warn('[publish-portal-data] No applications to publish');
    return;
  }
  
  logger.info(`[publish-portal-data] Loaded ${applications.length} applications`);
  
  // Generate leaderboard
  const leaderboard = sanitizeLeaderboard(applications, {
    removeEmails: true,
    removePhones: true,
    maxSummaryLength: 200,
  });
  
  // Generate top 10
  const top10 = getTopEntries(leaderboard, 10);
  
  // Generate health metrics
  const health = calculateHealthMetrics(applications);
  
  // Write leaderboard.json
  const leaderboardPath = path.join(outputDir, 'leaderboard.json');
  await writeJson(leaderboardPath, leaderboard, 2);
  logger.info(`[publish-portal-data] Wrote ${leaderboardPath}`);
  
  // Write top10.json
  const top10Path = path.join(outputDir, 'top10.json');
  await writeJson(top10Path, top10, 2);
  logger.info(`[publish-portal-data] Wrote ${top10Path}`);
  
  // Write health.json
  const healthPath = path.join(outputDir, 'health.json');
  await writeJson(healthPath, health, 2);
  logger.info(`[publish-portal-data] Wrote ${healthPath}`);
  
  // Try to copy and sanitize report.md
  try {
    const reportSource = path.join(inputDir, 'reports', 'gloven_health_report.md');
    const reportContent = await readFile(reportSource);
    const sanitizedReport = sanitizeMarkdown(reportContent, {
      removeEmails: true,
      removePhones: true,
    });
    
    const reportPath = path.join(outputDir, 'report.md');
    await writeFile(reportPath, sanitizedReport);
    logger.info(`[publish-portal-data] Wrote ${reportPath}`);
  } catch (error) {
    logger.warn('[publish-portal-data] Could not copy report.md:', error);
  }
  
  // Summary
  logger.info('[publish-portal-data] Publishing complete', {
    totalApps: applications.length,
    goCount: health.goCount,
    waitlistCount: health.waitlistCount,
    noGoCount: health.noGoCount,
    avgScore: health.avgScore,
  });
}

/**
 * Register publish-portal-data command
 */
export function registerPublishPortalDataCommand(program: Command): void {
  program
    .command('publish-portal-data')
    .description('Publish sanitized data for public portal')
    .option('--out <dir>', 'Output directory for portal data files')
    .option('--input <dir>', 'Input directory containing scores and reports (default: ../../out)')
    .action(async (options: PublishOptions) => {
      try {
        await publishPortalData(options);
      } catch (error) {
        logger.error('[publish-portal-data] Command failed:', error);
        process.exit(1);
      }
    });
}