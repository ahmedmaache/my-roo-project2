/**
 * Google Sheets Sync Command
 * 
 * Syncs data between Google Sheets and local JSON files.
 * Supports pull (download) and push (upload) operations.
 */

import { Command } from 'commander';
import { logger } from '../observability/logger.js';
import { readSheet, writeSheet, rowsToObjects, objectsToRows } from '../connectors/sheets.js';
import { loadConfig } from '../config.js';
import { ensureDir, writeJson, readJson } from '../util/fs.js';
import * as path from 'path';
import { glob } from 'glob';

interface SyncSheetsOptions {
  range?: string;
  out?: string;
  in?: string;
}

/**
 * Get range from config or option
 */
function getRange(options: SyncSheetsOptions, configKey: string): string {
  if (options.range) {
    return options.range;
  }
  
  const config = loadConfig();
  const range = config.crm?.sheets?.ranges?.[configKey];
  
  if (!range) {
    throw new Error(`Range not specified and no default found in config for ${configKey}`);
  }
  
  return range;
}

/**
 * Pull data from Google Sheets to local JSON file
 */
async function syncSheetsPull(options: SyncSheetsOptions): Promise<void> {
  const range = getRange(options, 'applications');
  
  if (!options.out) {
    throw new Error('Output path required: use --out <path>');
  }
  
  logger.info(`[sync-sheets pull] Fetching data from range: ${range}`);
  
  const rows = await readSheet(range);
  
  if (rows.length === 0) {
    logger.warn('[sync-sheets pull] No data found in range');
    return;
  }
  
  // Convert rows to objects using header row
  const objects = rowsToObjects(rows);
  
  // Ensure output directory exists
  await ensureDir(path.dirname(options.out));
  
  // Write objects to JSON file
  await writeJson(options.out, objects, 2);
  
  logger.info(`[sync-sheets pull] Saved ${objects.length} records to ${options.out}`);
}

/**
 * Push data from local JSON file(s) to Google Sheets
 */
async function syncSheetsPush(options: SyncSheetsOptions): Promise<void> {
  const range = getRange(options, 'applications');
  
  if (!options.in) {
    throw new Error('Input path required: use --in <path>');
  }
  
  logger.info(`[sync-sheets push] Loading records from: ${options.in}`);
  
  // Support glob patterns for input files
  const files = await glob(options.in);
  
  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${options.in}`);
  }
  
  let allRecords: any[] = [];
  
  // Load all matching files
  for (const file of files) {
    const data = await readJson(file);
    
    if (Array.isArray(data)) {
      allRecords.push(...data);
    } else {
      allRecords.push(data);
    }
  }
  
  if (allRecords.length === 0) {
    logger.warn('[sync-sheets push] No records to push');
    return;
  }
  
  // Convert objects to rows with header row
  const rows = objectsToRows(allRecords);
  
  logger.info(`[sync-sheets push] Pushing ${allRecords.length} records to range: ${range}`);
  
  await writeSheet(range, rows);
  
  logger.info(`[sync-sheets push] Successfully wrote ${allRecords.length} records`);
}

/**
 * Register sync-sheets command
 */
export function registerSyncSheetsCommand(program: Command): void {
  const cmd = program
    .command('sync-sheets')
    .description('Sync data with Google Sheets');
  
  cmd
    .command('pull')
    .description('Pull data from Google Sheets to local JSON')
    .option('--range <a1notation>', 'Google Sheets range in A1 notation (e.g., "Applications!A1:H500")')
    .option('--out <path>', 'Output JSON file path')
    .action(async (options: SyncSheetsOptions) => {
      try {
        await syncSheetsPull(options);
      } catch (error) {
        logger.error('[sync-sheets pull] Command failed:', error);
        process.exit(1);
      }
    });
  
  cmd
    .command('push')
    .description('Push data from local JSON to Google Sheets')
    .option('--range <a1notation>', 'Google Sheets range in A1 notation')
    .option('--in <pattern>', 'Input JSON file(s) (supports glob patterns)')
    .action(async (options: SyncSheetsOptions) => {
      try {
        await syncSheetsPush(options);
      } catch (error) {
        logger.error('[sync-sheets push] Command failed:', error);
        process.exit(1);
      }
    });
}