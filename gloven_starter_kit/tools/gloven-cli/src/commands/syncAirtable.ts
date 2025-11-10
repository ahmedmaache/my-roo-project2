/**
 * Airtable Sync Command
 * 
 * Syncs data between Airtable tables and local JSON files.
 * Supports pull (download) and push (upload/upsert) operations.
 */

import { Command } from 'commander';
import { logger } from '../observability/logger.js';
import { pullTable, pushRecords } from '../connectors/airtable.js';
import { loadConfig } from '../config.js';
import { ensureDir, writeJson, readJson } from '../util/fs.js';
import type { CRMRecord, CRMApplication } from '../types_crm.js';
import * as path from 'path';
import { glob } from 'glob';

interface SyncAirtableOptions {
  table?: string;
  out?: string;
  in?: string;
}

/**
 * Get table name from config or option
 */
function getTableName(options: SyncAirtableOptions, configKey: string): string {
  if (options.table) {
    return options.table;
  }
  
  const config = loadConfig();
  const tableName = config.crm?.airtable?.tables?.[configKey];
  
  if (!tableName) {
    throw new Error(`Table not specified and no default found in config for ${configKey}`);
  }
  
  return tableName;
}

/**
 * Pull data from Airtable table to local JSON file
 */
async function syncAirtablePull(options: SyncAirtableOptions): Promise<void> {
  const tableName = getTableName(options, 'applications');
  
  if (!options.out) {
    throw new Error('Output path required: use --out <path>');
  }
  
  logger.info(`[sync-airtable pull] Fetching records from table: ${tableName}`);
  
  const records = await pullTable(tableName);
  
  // Ensure output directory exists
  await ensureDir(path.dirname(options.out));
  
  // Write records to JSON file
  await writeJson(options.out, records, 2);
  
  logger.info(`[sync-airtable pull] Saved ${records.length} records to ${options.out}`);
}

/**
 * Push data from local JSON file(s) to Airtable table
 */
async function syncAirtablePush(options: SyncAirtableOptions): Promise<void> {
  const tableName = getTableName(options, 'applications');
  
  if (!options.in) {
    throw new Error('Input path required: use --in <path>');
  }
  
  logger.info(`[sync-airtable push] Loading records from: ${options.in}`);
  
  // Support glob patterns for input files
  const files = await glob(options.in);
  
  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${options.in}`);
  }
  
  let allRecords: CRMRecord[] = [];
  
  // Load all matching files
  for (const file of files) {
    const data = await readJson(file);
    
    // Handle different input formats
    if (Array.isArray(data)) {
      // Assume array of CRMRecords or applications
      const records: CRMRecord[] = data.map((item: any) => {
        if (item.fields) {
          // Already a CRMRecord
          return item;
        } else {
          // Convert application to CRMRecord
          return convertApplicationToCRMRecord(item);
        }
      });
      allRecords.push(...records);
    } else if (data.fields) {
      // Single CRMRecord
      allRecords.push(data);
    } else {
      // Single application object
      allRecords.push(convertApplicationToCRMRecord(data));
    }
  }
  
  if (allRecords.length === 0) {
    logger.warn('[sync-airtable push] No records to push');
    return;
  }
  
  logger.info(`[sync-airtable push] Pushing ${allRecords.length} records to table: ${tableName}`);
  
  const result = await pushRecords(tableName, allRecords);
  
  if (result.success) {
    logger.info(`[sync-airtable push] Successfully updated ${result.updated} records`);
  } else {
    logger.error('[sync-airtable push] Push operation failed');
  }
}

/**
 * Convert application data to CRMRecord format
 */
function convertApplicationToCRMRecord(app: any): CRMRecord {
  return {
    id: app.airtableId || '',
    externalId: app.id || app.externalId,
    fields: {
      'External ID': app.id || app.externalId,
      'Founder Name': app.founderName,
      'Email': app.email,
      'Company': app.company,
      'Region': app.region,
      'Stage': app.stage,
      'Summary': app.summary,
      'Decision': app.decision,
      'Score Total': app.scoreTotal || app.score,
      'Risks': app.risks,
    },
  };
}

/**
 * Register sync-airtable command
 */
export function registerSyncAirtableCommand(program: Command): void {
  const cmd = program
    .command('sync-airtable')
    .description('Sync data with Airtable tables');
  
  cmd
    .command('pull')
    .description('Pull records from Airtable to local JSON')
    .option('--table <name>', 'Airtable table name')
    .option('--out <path>', 'Output JSON file path')
    .action(async (options: SyncAirtableOptions) => {
      try {
        await syncAirtablePull(options);
      } catch (error) {
        logger.error('[sync-airtable pull] Command failed:', error);
        process.exit(1);
      }
    });
  
  cmd
    .command('push')
    .description('Push records from local JSON to Airtable')
    .option('--table <name>', 'Airtable table name')
    .option('--in <pattern>', 'Input JSON file(s) (supports glob patterns)')
    .action(async (options: SyncAirtableOptions) => {
      try {
        await syncAirtablePush(options);
      } catch (error) {
        logger.error('[sync-airtable push] Command failed:', error);
        process.exit(1);
      }
    });
}