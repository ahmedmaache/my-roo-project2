import { logger } from '../observability/logger.js';

/**
 * Slack webhook connector
 * Posts messages to Slack via webhook URL
 */

/**
 * Post a message to Slack webhook
 * Gracefully handles missing SLACK_WEBHOOK_URL
 */
export async function postSlackMessage(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.info('Slack webhook not configured (SLACK_WEBHOOK_URL not set). Skipping notification.');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API returned ${response.status}: ${errorText}`);
    }

    logger.info('Slack notification sent successfully');
  } catch (error) {
    logger.error(`Failed to send Slack notification: ${(error as Error).message}`);
    // Don't throw - we want to continue even if Slack fails
  }
}

/**
 * Format a report summary for Slack
 */
export function formatReportForSlack(data: {
  totalApps: number;
  goDecisions: number;
  waitlistDecisions: number;
  avgScore: number;
  costUsed: number;
  reportUrl?: string;
}): string {
  const { totalApps, goDecisions, waitlistDecisions, avgScore, costUsed, reportUrl } = data;

  let message = `📊 *Gloven Health Report*\n\n`;
  message += `*Intake Summary:*\n`;
  message += `• Total applications: ${totalApps}\n`;
  message += `• GO decisions: ${goDecisions}\n`;
  message += `• WAITLIST decisions: ${waitlistDecisions}\n`;
  message += `• Average score: ${avgScore.toFixed(1)}/100\n\n`;
  message += `*Cost Tracking:*\n`;
  message += `• Month-to-date: $${costUsed.toFixed(2)}\n`;

  if (reportUrl) {
    message += `\n📄 <${reportUrl}|View Full Report>`;
  }

  return message;
}