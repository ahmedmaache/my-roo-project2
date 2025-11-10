/**
 * Data Sanitization Utilities
 * 
 * Removes PII (emails, phones) and prepares data for public portal publishing.
 * Ensures deterministic output for Git diffs.
 */

import type {
  CRMApplication,
  PublicApplication,
  LeaderboardEntry,
  PublicLeaderboard,
} from '../types_crm.js';

export interface SanitizeOptions {
  removeEmails?: boolean;
  removePhones?: boolean;
  maxSummaryLength?: number;
  allowedFields?: string[];
}

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  removeEmails: true,
  removePhones: true,
  maxSummaryLength: 200,
  allowedFields: ['id', 'company', 'region', 'stage', 'summary', 'scoreTotal', 'decision'],
};

/**
 * Redact email addresses from text
 */
function redactEmails(text: string): string {
  return text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
}

/**
 * Redact phone numbers from text
 */
function redactPhones(text: string): string {
  // Match common phone patterns: (123) 456-7890, 123-456-7890, +1 123 456 7890, etc.
  return text
    .replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE_REDACTED]')
    .replace(/\(\d{3}\)\s?\d{3}-\d{4}/g, '[PHONE_REDACTED]');
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Sanitize a single application for public display
 */
export function sanitizeApplication(
  app: CRMApplication,
  opts?: SanitizeOptions
): PublicApplication {
  const options = { ...DEFAULT_OPTIONS, ...opts };

  let summary = app.summary || '';
  
  // Remove PII from summary
  if (options.removeEmails) {
    summary = redactEmails(summary);
  }
  if (options.removePhones) {
    summary = redactPhones(summary);
  }
  
  // Truncate summary
  if (options.maxSummaryLength) {
    summary = truncateText(summary, options.maxSummaryLength);
  }

  // Build public application with only allowed fields
  const publicApp: PublicApplication = {
    id: app.id,
    company: app.company,
    region: app.region,
    stage: app.stage,
    summary: summary || undefined,
    scoreTotal: app.scoreTotal,
    band: app.decision,
  };

  // Filter to only allowed fields if specified
  if (options.allowedFields && options.allowedFields.length > 0) {
    const filtered: any = {};
    for (const field of options.allowedFields) {
      if (field in publicApp) {
        filtered[field] = (publicApp as any)[field];
      }
    }
    return filtered as PublicApplication;
  }

  return publicApp;
}

/**
 * Sanitize and sort applications into a leaderboard
 * Ensures deterministic ordering: score DESC, then id ASC
 */
export function sanitizeLeaderboard(
  apps: CRMApplication[],
  opts?: SanitizeOptions
): PublicLeaderboard {
  // Filter to apps with scores and decisions
  const scoredApps = apps.filter(app => 
    typeof app.scoreTotal === 'number' && app.decision
  );

  // Sort deterministically: score DESC, then id ASC
  const sorted = [...scoredApps].sort((a, b) => {
    const scoreDiff = (b.scoreTotal || 0) - (a.scoreTotal || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id.localeCompare(b.id);
  });

  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = sorted.map((app, index) => ({
    rank: index + 1,
    id: app.id,
    company: app.company,
    region: app.region,
    stage: app.stage,
    score: app.scoreTotal || 0,
    band: app.decision as 'GO' | 'WAITLIST' | 'NO_GO',
  }));

  return {
    generated: new Date().toISOString(),
    totalApps: apps.length,
    entries,
  };
}

/**
 * Get top N entries from leaderboard
 */
export function getTopEntries(leaderboard: PublicLeaderboard, n: number = 10) {
  return {
    generated: leaderboard.generated,
    entries: leaderboard.entries.slice(0, n),
  };
}

/**
 * Sanitize markdown content by removing PII
 */
export function sanitizeMarkdown(content: string, opts?: SanitizeOptions): string {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  
  let sanitized = content;
  
  if (options.removeEmails) {
    sanitized = redactEmails(sanitized);
  }
  
  if (options.removePhones) {
    sanitized = redactPhones(sanitized);
  }
  
  return sanitized;
}