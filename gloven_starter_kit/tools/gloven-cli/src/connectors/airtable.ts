/**
 * Airtable CRM Connector
 * 
 * Integrates with Airtable tables for syncing applications, mentors, and investors.
 * Supports DRY_RUN mode with deterministic placeholders.
 */

import { logger } from '../observability/logger.js';
import type { CRMRecord } from '../types_crm.js';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const RATE_LIMIT_DELAY = 200; // 5 requests/second = 200ms between requests

interface AirtableConfig {
  baseId?: string;
  token?: string;
  dryRun?: boolean;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

/**
 * Get Airtable configuration from environment
 */
function getConfig(): AirtableConfig {
  return {
    baseId: process.env.AIRTABLE_BASE_ID,
    token: process.env.AIRTABLE_TOKEN,
    dryRun: process.env.DRY_RUN === 'true' || !process.env.AIRTABLE_TOKEN,
  };
}

/**
 * Generate deterministic placeholder data for DRY_RUN mode
 */
function generatePlaceholderRecords(table: string, count: number = 5): CRMRecord[] {
  const records: CRMRecord[] = [];
  
  for (let i = 1; i <= count; i++) {
    const id = `rec${table.substring(0, 3).toUpperCase()}${String(i).padStart(3, '0')}`;
    
    let fields: Record<string, any>;
    
    if (table.toLowerCase().includes('app')) {
      fields = {
        'External ID': `app-${i}`,
        'Founder Name': `Founder ${i}`,
        'Email': `founder${i}@example.com`,
        'Company': `Startup ${i}`,
        'Region': ['North America', 'Europe', 'Asia', 'Africa'][i % 4],
        'Stage': ['Pre-seed', 'Seed', 'Series A'][i % 3],
        'Summary': `Sample application ${i} for testing`,
        'Decision': ['GO', 'WAITLIST', 'NO_GO'][i % 3],
        'Score Total': 70 + i * 5,
      };
    } else if (table.toLowerCase().includes('mentor')) {
      fields = {
        'External ID': `mentor-${i}`,
        'Name': `Mentor ${i}`,
        'Email': `mentor${i}@example.com`,
        'Domain': ['Product', 'Marketing', 'Engineering', 'Sales'][i % 4],
        'Region': ['North America', 'Europe'][i % 2],
        'Sessions Completed': i * 3,
      };
    } else if (table.toLowerCase().includes('investor')) {
      fields = {
        'External ID': `investor-${i}`,
        'Firm': `VC Firm ${i}`,
        'Contact': `Partner ${i}`,
        'Email': `partner${i}@vcfirm${i}.com`,
        'Check Size': ['$100K-$500K', '$500K-$2M', '$2M-$5M'][i % 3],
        'Sectors': ['SaaS', 'FinTech', 'HealthTech'].slice(0, (i % 3) + 1),
        'Priority': ['A', 'B', 'C'][i % 3],
      };
    } else {
      fields = {
        'External ID': `record-${i}`,
        'Name': `Record ${i}`,
      };
    }
    
    records.push({
      id,
      externalId: fields['External ID'],
      fields,
    });
  }
  
  return records;
}

/**
 * Delay execution to respect rate limits
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all records from an Airtable table with pagination
 */
export async function pullTable(table: string): Promise<CRMRecord[]> {
  const config = getConfig();
  
  if (config.dryRun) {
    logger.warn(`[Airtable] DRY_RUN mode: returning placeholder data for table ${table}`);
    return generatePlaceholderRecords(table);
  }
  
  if (!config.baseId || !config.token) {
    logger.error('[Airtable] Missing AIRTABLE_BASE_ID or AIRTABLE_TOKEN');
    throw new Error('Airtable credentials not configured');
  }
  
  const records: CRMRecord[] = [];
  let offset: string | undefined;
  let pageCount = 0;
  
  try {
    do {
      pageCount++;
      logger.info(`[Airtable] Fetching page ${pageCount} from ${table}...`);
      
      const url = new URL(`${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(table)}`);
      if (offset) {
        url.searchParams.set('offset', offset);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${error}`);
      }
      
      const data: AirtableListResponse = await response.json();
      
      // Convert Airtable records to CRMRecord format
      const crmRecords: CRMRecord[] = data.records.map(rec => ({
        id: rec.id,
        externalId: rec.fields['External ID'] as string | undefined,
        fields: rec.fields,
      }));
      
      records.push(...crmRecords);
      offset = data.offset;
      
      // Respect rate limits
      if (offset) {
        await delay(RATE_LIMIT_DELAY);
      }
      
    } while (offset);
    
    logger.info(`[Airtable] Fetched ${records.length} records from ${table}`);
    return records;
    
  } catch (error) {
    logger.error(`[Airtable] Failed to pull table ${table}:`, error);
    throw error;
  }
}

/**
 * Push/upsert records to an Airtable table
 * Uses externalId field for matching existing records
 */
export async function pushRecords(
  table: string,
  rows: CRMRecord[]
): Promise<{ success: boolean; updated: number }> {
  const config = getConfig();
  
  if (config.dryRun) {
    logger.warn(`[Airtable] DRY_RUN mode: skipping push of ${rows.length} records to ${table}`);
    return { success: true, updated: rows.length };
  }
  
  if (!config.baseId || !config.token) {
    logger.error('[Airtable] Missing AIRTABLE_BASE_ID or AIRTABLE_TOKEN');
    throw new Error('Airtable credentials not configured');
  }
  
  try {
    // First, fetch existing records to find matches by externalId
    const existing = await pullTable(table);
    const externalIdMap = new Map<string, string>(); // externalId -> recordId
    
    for (const record of existing) {
      if (record.externalId) {
        externalIdMap.set(record.externalId, record.id);
      }
    }
    
    let updated = 0;
    
    // Process records in batches of 10 (Airtable limit)
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // Separate into updates and creates
      const updates: any[] = [];
      const creates: any[] = [];
      
      for (const row of batch) {
        const recordData = {
          fields: row.fields,
        };
        
        if (row.externalId && externalIdMap.has(row.externalId)) {
          // Update existing record
          updates.push({
            id: externalIdMap.get(row.externalId),
            ...recordData,
          });
        } else {
          // Create new record
          creates.push(recordData);
        }
      }
      
      // Perform updates
      if (updates.length > 0) {
        const response = await fetch(
          `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(table)}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${config.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records: updates }),
          }
        );
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Airtable update failed: ${response.status} - ${error}`);
        }
        
        updated += updates.length;
        await delay(RATE_LIMIT_DELAY);
      }
      
      // Perform creates
      if (creates.length > 0) {
        const response = await fetch(
          `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(table)}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records: creates }),
          }
        );
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Airtable create failed: ${response.status} - ${error}`);
        }
        
        updated += creates.length;
        await delay(RATE_LIMIT_DELAY);
      }
    }
    
    logger.info(`[Airtable] Successfully updated ${updated} records in ${table}`);
    return { success: true, updated };
    
  } catch (error) {
    logger.error(`[Airtable] Failed to push records to ${table}:`, error);
    throw error;
  }
}