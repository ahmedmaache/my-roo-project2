/**
 * Slack Slash Command API Endpoint
 * 
 * Handles slash commands from Slack workspace.
 * Supports: /gloven-health, /gloven-top
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  signingSecret: string,
  requestSignature: string,
  timestamp: string,
  body: string
): boolean {
  const time = Math.floor(Date.now() / 1000);
  
  // Reject old requests (> 5 minutes)
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    return false;
  }
  
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(requestSignature)
  );
}

/**
 * Load health metrics
 */
async function getHealthMetrics() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'health.json');
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

/**
 * Load top performers
 */
async function getTopPerformers(limit: number = 5) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'leaderboard.json');
    const contents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(contents);
    return data.entries.slice(0, limit);
  } catch {
    return null;
  }
}

/**
 * Format health metrics as Slack blocks
 */
function formatHealth Metrics(health: any) {
  return {
    response_type: 'in_channel',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Gloven Health Metrics',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Applications:*\n${health.totalApps}`,
          },
          {
            type: 'mrkdwn',
            text: `*Average Score:*\n${health.avgScore.toFixed(1)}`,
          },
          {
            type: 'mrkdwn',
            text: `*GO:*\n✅ ${health.goCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*Waitlist:*\n⏸️ ${health.waitlistCount}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Last updated: ${new Date(health.generated).toLocaleString()}`,
          },
        ],
      },
    ],
  };
}

/**
 * Format top performers as Slack blocks
 */
function formatTopPerformers(entries: any[]) {
  const fields = entries.map((entry, index) => {
    const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    return {
      type: 'mrkdwn',
      text: `${badge} *${entry.company}*\nScore: ${entry.score.toFixed(1)} | ${entry.band}`,
    };
  });

  return {
    response_type: 'in_channel',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏆 Top Performers',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields,
      },
    ],
  };
}

/**
 * Handle POST requests from Slack
 */
export async function POST(request: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  
  if (!signingSecret) {
    return NextResponse.json({
      text: '⚠️ Slack integration not configured. Please set SLACK_SIGNING_SECRET environment variable.',
    });
  }
  
  // Verify request signature
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const body = await request.text();
  
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }
  
  if (!verifySlackSignature(signingSecret, signature, timestamp, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Parse form data
  const params = new URLSearchParams(body);
  const command = params.get('command');
  const text = params.get('text') || '';
  
  try {
    switch (command) {
      case '/gloven-health': {
        const health = await getHealthMetrics();
        if (!health) {
          return NextResponse.json({
            text: '⚠️ Health metrics not available. Data may not be published yet.',
          });
        }
        return NextResponse.json(formatHealthMetrics(health));
      }
      
      case '/gloven-top': {
        const limit = parseInt(text) || 5;
        const top = await getTopPerformers(Math.min(limit, 10));
        if (!top || top.length === 0) {
          return NextResponse.json({
            text: '⚠️ Leaderboard data not available. Data may not be published yet.',
          });
        }
        return NextResponse.json(formatTopPerformers(top));
      }
      
      default:
        return NextResponse.json({
          text: `Unknown command: ${command}\n\nAvailable commands:\n• \`/gloven-health\` - Show key health metrics\n• \`/gloven-top [n]\` - Show top N performers (default: 5)`,
        });
    }
  } catch (error) {
    console.error('Slack command error:', error);
    return NextResponse.json({
      text: '❌ An error occurred processing your command. Please try again.',
    });
  }
}