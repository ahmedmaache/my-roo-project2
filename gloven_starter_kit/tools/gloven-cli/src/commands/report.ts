import type { EnvConfig, GlovenConfig } from '../config.js';
import type { RankedApplication, ReportData } from '../types.js';
import { getMonthlyTotal, getCurrentMonth } from '../observability/costLedger.js';
import { postSlackMessage, formatReportForSlack } from '../connectors/slack.js';
import { logger } from '../observability/logger.js';
import { writeFile, resolvePath } from '../util/fs.js';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Report command options
 */
export interface ReportOptions {
  notify?: boolean;
  from?: string;
  to?: string;
}

/**
 * Load scored applications from output directory
 */
async function loadScoredApplications(outDir: string): Promise<RankedApplication[]> {
  const scoresDir = path.join(outDir, 'scores');
  
  if (!existsSync(scoresDir)) {
    logger.warn('No scores directory found');
    return [];
  }

  const files = await fs.readdir(scoresDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const ranked: RankedApplication[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(scoresDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const score = JSON.parse(content);
      
      // Reconstruct app from score data
      const app = {
        id: path.basename(file, '.json'),
        founderName: score.reviewer || 'Unknown',
        email: 'unknown@example.com',
        company: score.startup_name || 'Unknown',
        region: 'UNKNOWN',
        stage: 'UNKNOWN',
        summary: score.summary || '',
      };

      // Determine band
      const hasRedFlags = score.red_flags && score.red_flags.length > 0;
      let band: 'GO' | 'WAITLIST' | 'NO_GO';
      if (hasRedFlags) {
        band = 'NO_GO';
      } else if (score.weighted_total_0to100 >= 70) {
        band = 'GO';
      } else if (score.weighted_total_0to100 >= 60) {
        band = 'WAITLIST';
      } else {
        band = 'NO_GO';
      }

      ranked.push({
        app,
        score,
        band,
        rank: 0, // Will be set after sorting
      });
    } catch (error) {
      logger.warn(`Failed to load score from ${file}: ${(error as Error).message}`);
    }
  }

  // Sort by score and assign ranks
  ranked.sort((a, b) => b.score.weighted_total_0to100 - a.score.weighted_total_0to100);
  ranked.forEach((app, i) => app.rank = i + 1);

  return ranked;
}

/**
 * Generate report data
 */
async function generateReportData(
  ranked: RankedApplication[],
  options: ReportOptions
): Promise<ReportData> {
  const now = new Date();
  const from = options.from || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = options.to || now.toISOString().split('T')[0];

  // Calculate distributions
  const byRegion: Record<string, number> = {};
  const byStage: Record<string, number> = {};
  const distribution: Record<'GO' | 'WAITLIST' | 'NO_GO', number> = {
    GO: 0,
    WAITLIST: 0,
    NO_GO: 0,
  };

  for (const app of ranked) {
    byRegion[app.app.region] = (byRegion[app.app.region] || 0) + 1;
    byStage[app.app.stage] = (byStage[app.app.stage] || 0) + 1;
    distribution[app.band]++;
  }

  const totalApps = ranked.length;
  const uniqueApps = totalApps; // Already deduplicated in batch process
  const duplicates = 0; // Would need to track this separately

  const averageScore = totalApps > 0
    ? ranked.reduce((sum, app) => sum + app.score.weighted_total_0to100, 0) / totalApps
    : 0;

  const topPerformers = ranked.slice(0, 10);

  // Collect all red flags
  const allFlags = ranked
    .filter(app => app.score.red_flags && app.score.red_flags.length > 0)
    .flatMap(app => app.score.red_flags || []);
  
  const totalFlags = allFlags.length;
  const criticalFlags = [...new Set(allFlags)].slice(0, 5); // Top 5 unique flags

  // Get cost data
  const currentMonth = getCurrentMonth();
  const monthToDate = await getMonthlyTotal(currentMonth);
  const budget = parseFloat(process.env.COST_BUDGET_USD || '50');
  const percentUsed = budget > 0 ? (monthToDate / budget) * 100 : 0;

  return {
    period: { from, to },
    intake: {
      totalApps,
      uniqueApps,
      duplicates,
      byRegion,
      byStage,
    },
    scores: {
      distribution,
      averageScore,
      topPerformers,
    },
    risks: {
      totalFlags,
      criticalFlags,
    },
    cost: {
      monthToDate,
      budget,
      percentUsed,
    },
  };
}

/**
 * Generate ASCII sparkline for score distribution
 */
function generateSparkline(distribution: Record<'GO' | 'WAITLIST' | 'NO_GO', number>): string {
  const max = Math.max(distribution.GO, distribution.WAITLIST, distribution.NO_GO);
  if (max === 0) return '□□□';

  const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const scale = (val: number) => bars[Math.min(bars.length - 1, Math.floor((val / max) * bars.length))];

  return `${scale(distribution.GO)}${scale(distribution.WAITLIST)}${scale(distribution.NO_GO)}`;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(data: ReportData): string {
  let md = `# Gloven Health Report\n\n`;
  md += `**Period:** ${data.period.from} to ${data.period.to}\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // Intake Summary
  md += `## 📥 Intake Summary\n\n`;
  md += `- **Total Applications:** ${data.intake.totalApps}\n`;
  md += `- **Unique Applications:** ${data.intake.uniqueApps}\n`;
  if (data.intake.duplicates > 0) {
    md += `- **Duplicates Removed:** ${data.intake.duplicates}\n`;
  }
  md += `\n`;

  if (Object.keys(data.intake.byRegion).length > 0) {
    md += `**By Region:**\n`;
    for (const [region, count] of Object.entries(data.intake.byRegion).sort((a, b) => b[1] - a[1])) {
      md += `- ${region}: ${count}\n`;
    }
    md += `\n`;
  }

  if (Object.keys(data.intake.byStage).length > 0) {
    md += `**By Stage:**\n`;
    for (const [stage, count] of Object.entries(data.intake.byStage).sort((a, b) => b[1] - a[1])) {
      md += `- ${stage}: ${count}\n`;
    }
    md += `\n`;
  }

  // Score Distribution
  md += `## 📊 Score Distribution\n\n`;
  md += `- **GO:** ${data.scores.distribution.GO} (${((data.scores.distribution.GO / data.intake.totalApps) * 100).toFixed(1)}%)\n`;
  md += `- **WAITLIST:** ${data.scores.distribution.WAITLIST} (${((data.scores.distribution.WAITLIST / data.intake.totalApps) * 100).toFixed(1)}%)\n`;
  md += `- **NO_GO:** ${data.scores.distribution.NO_GO} (${((data.scores.distribution.NO_GO / data.intake.totalApps) * 100).toFixed(1)}%)\n`;
  md += `- **Average Score:** ${data.scores.averageScore.toFixed(1)}/100\n\n`;
  md += `**Sparkline:** ${generateSparkline(data.scores.distribution)}\n\n`;

  // Top Performers
  md += `## 🏆 Top 10 Performers\n\n`;
  md += `| Rank | Company | Score | Band | Key Strengths |\n`;
  md += `|------|---------|-------|------|---------------|\n`;
  
  for (const app of data.scores.topPerformers) {
    const strengths = app.score.team?.strengths?.[0] || 'N/A';
    const bandEmoji = app.band === 'GO' ? '✅' : app.band === 'WAITLIST' ? '⏸️' : '❌';
    md += `| ${app.rank} | ${app.app.company} | ${app.score.weighted_total_0to100} | ${bandEmoji} ${app.band} | ${strengths} |\n`;
  }
  md += `\n`;

  // Risks & Flags
  md += `## 🚩 Risks & Flags\n\n`;
  md += `- **Total Red Flags:** ${data.risks.totalFlags}\n`;
  if (data.risks.criticalFlags.length > 0) {
    md += `\n**Critical Concerns:**\n`;
    for (const flag of data.risks.criticalFlags) {
      md += `- ${flag}\n`;
    }
  } else {
    md += `- ✅ No critical red flags identified\n`;
  }
  md += `\n`;

  // Cost Tracking
  md += `## 💰 Cost Tracking\n\n`;
  md += `- **Month-to-Date:** $${data.cost.monthToDate.toFixed(2)}\n`;
  md += `- **Budget:** $${data.cost.budget.toFixed(2)}\n`;
  md += `- **Used:** ${data.cost.percentUsed.toFixed(1)}%\n`;
  
  if (data.cost.percentUsed >= 100) {
    md += `- ⚠️ **ALERT:** Budget exceeded!\n`;
  } else if (data.cost.percentUsed >= 80) {
    md += `- ⚠️ **WARNING:** Approaching budget limit\n`;
  } else {
    md += `- ✅ Budget on track\n`;
  }
  md += `\n`;

  // Next Steps
  md += `## 📋 Next Week Focus\n\n`;
  md += `- Review WAITLIST applications (${data.scores.distribution.WAITLIST} pending)\n`;
  md += `- Follow up with GO decisions (${data.scores.distribution.GO} ready to proceed)\n`;
  if (data.risks.totalFlags > 0) {
    md += `- Address red flags in flagged applications\n`;
  }
  md += `- Continue monitoring cost budget\n\n`;

  md += `---\n*Generated by Gloven CLI*\n`;

  return md;
}

/**
 * Report command implementation
 */
export async function report(
  options: ReportOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  logger.info('Generating health report');

  const outDir = resolvePath(config.outDir);
  const reportsDir = path.join(outDir, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  // Load scored applications
  const ranked = await loadScoredApplications(outDir);

  if (ranked.length === 0) {
    logger.warn('No scored applications found. Run batch-score first.');
    console.log('\n⚠️  No scored applications found. Run batch-score first.\n');
    return;
  }

  // Generate report data
  const data = await generateReportData(ranked, options);

  // Generate markdown report
  const markdown = generateMarkdownReport(data);
  const reportPath = path.join(reportsDir, 'gloven_health_report.md');
  await writeFile(reportPath, markdown);

  logger.info(`Report saved to ${reportPath}`);
  console.log(`\n✅ Health report generated: ${reportPath}\n`);

  // Send Slack notification if requested
  if (options.notify) {
    const slackMessage = formatReportForSlack({
      totalApps: data.intake.totalApps,
      goDecisions: data.scores.distribution.GO,
      waitlistDecisions: data.scores.distribution.WAITLIST,
      avgScore: data.scores.averageScore,
      costUsed: data.cost.monthToDate,
    });

    await postSlackMessage(slackMessage);
  }
}