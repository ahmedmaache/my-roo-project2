import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync } from 'fs';
import type { Application, IngestionResult } from '../types.js';
import { logger } from '../observability/logger.js';

/**
 * Application ingestion and deduplication pipeline
 * Supports CSV and JSON files
 */

/**
 * Parse CSV content to applications
 */
function parseCSV(content: string): Application[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const apps: Application[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const app: any = {};

    headers.forEach((header, index) => {
      app[header] = values[index] || '';
    });

    // Normalize to canonical shape
    apps.push({
      id: app.id || `app-${Date.now()}-${i}`,
      founderName: app.founderName || app.founder_name || '',
      email: app.email || '',
      company: app.company || app.startup_name || '',
      region: app.region || 'UNKNOWN',
      stage: app.stage || 'UNKNOWN',
      summary: app.summary || app.description || '',
      links: app.links || app.urls || '',
    });
  }

  return apps;
}

/**
 * Load application from JSON file
 */
async function loadJSON(filePath: string): Promise<Application> {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Normalize to canonical shape
  return {
    id: data.id || path.basename(filePath, '.json'),
    founderName: data.founderName || data.founder_name || data.founder || '',
    email: data.email || '',
    company: data.company || data.startup_name || '',
    region: data.region || 'UNKNOWN',
    stage: data.stage || 'UNKNOWN',
    summary: data.summary || data.description || '',
    links: data.links || data.urls || '',
  };
}

/**
 * Deduplicate applications by email or company name (case-insensitive)
 */
function deduplicate(apps: Application[]): IngestionResult {
  const seen = new Map<string, Application>();
  const duplicates: string[] = [];

  for (const app of apps) {
    const emailKey = app.email.toLowerCase().trim();
    const companyKey = app.company.toLowerCase().trim();

    // Check for duplicate by email
    if (emailKey && seen.has(emailKey)) {
      duplicates.push(`${app.id} (duplicate email: ${app.email})`);
      continue;
    }

    // Check for duplicate by company name
    if (companyKey && Array.from(seen.values()).some(a => a.company.toLowerCase().trim() === companyKey)) {
      duplicates.push(`${app.id} (duplicate company: ${app.company})`);
      continue;
    }

    // Add to seen map
    if (emailKey) {
      seen.set(emailKey, app);
    } else if (companyKey) {
      // Use company as fallback if no email
      seen.set(companyKey, app);
    } else {
      // If neither email nor company, keep it but warn
      logger.warn(`Application ${app.id} has no email or company name`);
      seen.set(app.id, app);
    }
  }

  return {
    apps: Array.from(seen.values()),
    duplicates,
  };
}

/**
 * Ingest applications from file or directory
 */
export async function ingestApplications(inputPath: string): Promise<IngestionResult> {
  const resolvedPath = path.resolve(inputPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  const stats = statSync(resolvedPath);
  let apps: Application[] = [];

  if (stats.isFile()) {
    const ext = path.extname(resolvedPath).toLowerCase();

    if (ext === '.csv') {
      logger.info(`Loading CSV file: ${inputPath}`);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      apps = parseCSV(content);
    } else if (ext === '.json') {
      logger.info(`Loading JSON file: ${inputPath}`);
      const app = await loadJSON(resolvedPath);
      apps = [app];
    } else {
      throw new Error(`Unsupported file type: ${ext}. Use .csv or .json`);
    }
  } else if (stats.isDirectory()) {
    logger.info(`Loading directory: ${inputPath}`);
    const files = await fs.readdir(resolvedPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(resolvedPath, file);
      try {
        const app = await loadJSON(filePath);
        apps.push(app);
      } catch (error) {
        logger.warn(`Failed to load ${file}: ${(error as Error).message}`);
      }
    }
  } else {
    throw new Error(`Input must be a file or directory: ${inputPath}`);
  }

  logger.info(`Loaded ${apps.length} applications`);

  // Deduplicate
  const result = deduplicate(apps);
  
  if (result.duplicates.length > 0) {
    logger.warn(`Found ${result.duplicates.length} duplicates`, {
      duplicates: result.duplicates,
    });
  }

  logger.info(`After deduplication: ${result.apps.length} unique applications`);

  return result;
}