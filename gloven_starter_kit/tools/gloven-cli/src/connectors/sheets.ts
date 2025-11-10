/**
 * Google Sheets CRM Connector
 * 
 * Integrates with Google Sheets for syncing application data.
 * Uses service account authentication via googleapis.
 * Supports DRY_RUN mode with sample data.
 */

import { logger } from '../observability/logger.js';

interface SheetsConfig {
  spreadsheetId?: string;
  serviceAccountJson?: string;
  dryRun?: boolean;
}

/**
 * Get Sheets configuration from environment
 */
function getConfig(): SheetsConfig {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  return {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    serviceAccountJson: serviceAccountJson
      ? Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
      : undefined,
    dryRun: process.env.DRY_RUN === 'true' || !serviceAccountJson,
  };
}

/**
 * Generate sample rows for DRY_RUN mode
 */
function generateSampleRows(rowCount: number = 10): any[][] {
  const headers = [
    'ID',
    'Founder Name',
    'Email',
    'Company',
    'Region',
    'Stage',
    'Summary',
    'Score',
  ];
  
  const rows: any[][] = [headers];
  
  for (let i = 1; i <= rowCount; i++) {
    rows.push([
      `app-${i}`,
      `Founder ${i}`,
      `founder${i}@example.com`,
      `Startup ${i}`,
      ['North America', 'Europe', 'Asia', 'Africa'][i % 4],
      ['Pre-seed', 'Seed', 'Series A'][i % 3],
      `Sample application ${i} for testing`,
      String(70 + i * 5),
    ]);
  }
  
  return rows;
}

/**
 * Parse A1 notation range (e.g., "Sheet1!A1:H500")
 */
function parseRange(range: string): { sheet: string; range: string } {
  const parts = range.split('!');
  if (parts.length === 2) {
    return { sheet: parts[0], range: parts[1] };
  }
  return { sheet: 'Sheet1', range: parts[0] };
}

/**
 * Read data from a Google Sheets range
 */
export async function readSheet(range: string): Promise<any[][]> {
  const config = getConfig();
  
  if (config.dryRun) {
    logger.warn(`[Sheets] DRY_RUN mode: returning sample data for range ${range}`);
    return generateSampleRows();
  }
  
  if (!config.spreadsheetId || !config.serviceAccountJson) {
    logger.error('[Sheets] Missing GOOGLE_SHEETS_ID or GOOGLE_SERVICE_ACCOUNT_JSON');
    throw new Error('Google Sheets credentials not configured');
  }
  
  try {
    // Lazy load googleapis to avoid unnecessary dependency in DRY_RUN
    const { google } = await import('googleapis');
    
    // Parse service account credentials
    const credentials = JSON.parse(config.serviceAccountJson);
    
    // Create JWT client
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    // Initialize Sheets API
    const sheets = google.sheets({ version: 'v4', auth });
    
    logger.info(`[Sheets] Reading range ${range} from spreadsheet ${config.spreadsheetId}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range,
    });
    
    const rows = response.data.values || [];
    logger.info(`[Sheets] Read ${rows.length} rows from ${range}`);
    
    return rows;
    
  } catch (error) {
    logger.error(`[Sheets] Failed to read range ${range}:`, error);
    throw error;
  }
}

/**
 * Write data to a Google Sheets range
 */
export async function writeSheet(range: string, rows: any[][]): Promise<void> {
  const config = getConfig();
  
  if (config.dryRun) {
    logger.warn(`[Sheets] DRY_RUN mode: skipping write of ${rows.length} rows to ${range}`);
    return;
  }
  
  if (!config.spreadsheetId || !config.serviceAccountJson) {
    logger.error('[Sheets] Missing GOOGLE_SHEETS_ID or GOOGLE_SERVICE_ACCOUNT_JSON');
    throw new Error('Google Sheets credentials not configured');
  }
  
  try {
    // Lazy load googleapis
    const { google } = await import('googleapis');
    
    // Parse service account credentials
    const credentials = JSON.parse(config.serviceAccountJson);
    
    // Create JWT client with write permissions
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // Initialize Sheets API
    const sheets = google.sheets({ version: 'v4', auth });
    
    logger.info(`[Sheets] Writing ${rows.length} rows to range ${range}`);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });
    
    logger.info(`[Sheets] Successfully wrote ${rows.length} rows to ${range}`);
    
  } catch (error) {
    logger.error(`[Sheets] Failed to write to range ${range}:`, error);
    throw error;
  }
}

/**
 * Convert sheet rows to JSON objects using header row
 */
export function rowsToObjects(rows: any[][]): Record<string, any>[] {
  if (rows.length === 0) {
    return [];
  }
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  return dataRows.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj;
  });
}

/**
 * Convert JSON objects to sheet rows with header row
 */
export function objectsToRows(objects: Record<string, any>[]): any[][] {
  if (objects.length === 0) {
    return [];
  }
  
  // Get all unique keys from objects
  const allKeys = new Set<string>();
  objects.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  const rows: any[][] = [headers];
  
  objects.forEach(obj => {
    const row = headers.map(header => obj[header] !== undefined ? obj[header] : '');
    rows.push(row);
  });
  
  return rows;
}