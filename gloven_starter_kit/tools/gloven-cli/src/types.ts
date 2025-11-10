/**
 * Shared types for pipelines
 */

import type { ApplicationScore } from './zodSchemas.js';

/**
 * Normalized application data from CSV/JSON ingestion
 */
export interface Application {
  id: string;
  founderName: string;
  email: string;
  company: string;
  region: string;
  stage: string;
  summary: string;
  links?: string;
}

/**
 * Application with score
 */
export interface ScoredApplication {
  app: Application;
  score: ApplicationScore;
}

/**
 * Decision bands
 */
export type DecisionBand = 'GO' | 'WAITLIST' | 'NO_GO';

/**
 * Ranked application with band
 */
export interface RankedApplication extends ScoredApplication {
  band: DecisionBand;
  rank: number;
}

/**
 * Ingestion result
 */
export interface IngestionResult {
  apps: Application[];
  duplicates: string[];
}

/**
 * Batch scoring result
 */
export interface BatchScoringResult {
  scored: ScoredApplication[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
  details: {
    environment: {
      provider: string;
      model: string;
      dryRun: boolean;
      apiKeyConfigured: boolean;
    };
    filesystem: {
      promptDirExists: boolean;
      outDirWritable: boolean;
    };
    ci: {
      isCI: boolean;
      ciPlatform?: string;
    };
    cost: {
      monthToDate: number;
      budget: number;
      percentUsed: number;
    };
  };
}

/**
 * Report data
 */
export interface ReportData {
  period: {
    from: string;
    to: string;
  };
  intake: {
    totalApps: number;
    uniqueApps: number;
    duplicates: number;
    byRegion: Record<string, number>;
    byStage: Record<string, number>;
  };
  scores: {
    distribution: Record<DecisionBand, number>;
    averageScore: number;
    topPerformers: RankedApplication[];
  };
  risks: {
    totalFlags: number;
    criticalFlags: string[];
  };
  cost: {
    monthToDate: number;
    budget: number;
    percentUsed: number;
  };
}