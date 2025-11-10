/**
 * CRM Integration Types
 * 
 * Defines data structures for CRM connectors (Airtable, Google Sheets)
 * and public portal data sanitization.
 */

export type CRMApplication = {
  id: string;
  founderName: string;
  email: string;
  company: string;
  region?: string;
  stage?: string;
  summary?: string;
  links?: string[];
  decision?: 'GO' | 'NO_GO' | 'WAITLIST';
  scoreTotal?: number;
  risks?: string[];
};

export type CRMMentor = {
  id: string;
  name: string;
  email: string;
  domain: string;
  region: string;
  sessionsCompleted?: number;
};

export type CRMInvestor = {
  id: string;
  firm: string;
  contact: string;
  email: string;
  checkSize: string;
  sectors: string[];
  priority: 'A' | 'B' | 'C';
};

/**
 * Generic CRM record structure for connector operations
 */
export interface CRMRecord {
  id: string;
  externalId?: string;
  fields: Record<string, any>;
}

/**
 * Public (sanitized) types for portal publishing
 */
export type PublicApplication = {
  id: string;
  company: string;
  region?: string;
  stage?: string;
  summary?: string; // Truncated to maxLength
  scoreTotal?: number;
  band?: 'GO' | 'WAITLIST' | 'NO_GO';
  // Note: emails, phones, and detailed PII removed
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  company: string;
  region?: string;
  stage?: string;
  score: number;
  band: 'GO' | 'WAITLIST' | 'NO_GO';
};

export type PublicLeaderboard = {
  generated: string; // ISO timestamp
  totalApps: number;
  entries: LeaderboardEntry[];
};

export type PublicHealthMetrics = {
  generated: string;
  totalApps: number;
  goCount: number;
  waitlistCount: number;
  noGoCount: number;
  avgScore: number;
  costMTD: number;
};

export type Top10 = {
  generated: string;
  entries: LeaderboardEntry[];
};