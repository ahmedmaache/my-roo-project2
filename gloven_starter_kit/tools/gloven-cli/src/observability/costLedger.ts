import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Cost ledger for tracking LLM costs
 * Appends JSONL to out/ledger/cost_YYYY-MM.jsonl
 */

export interface CostEntry {
  timestamp: string;
  provider: string;
  model: string;
  estTokensIn: number;
  estTokensOut: number;
  estCostUSD: number;
  runId: string;
  cmd: string;
}

/**
 * Get ledger file path for a given month
 */
function getLedgerPath(month: string, baseDir: string = '../../out/ledger'): string {
  // month should be YYYY-MM format
  const ledgerDir = path.resolve(process.cwd(), baseDir);
  return path.join(ledgerDir, `cost_${month}.jsonl`);
}

/**
 * Ensure ledger directory exists
 */
async function ensureLedgerDir(baseDir: string = '../../out/ledger'): Promise<void> {
  const ledgerDir = path.resolve(process.cwd(), baseDir);
  if (!existsSync(ledgerDir)) {
    await fs.mkdir(ledgerDir, { recursive: true });
  }
}

/**
 * Log a cost entry to the ledger
 */
export async function logCost(entry: CostEntry, baseDir?: string): Promise<void> {
  try {
    await ensureLedgerDir(baseDir);
    
    // Get current month in YYYY-MM format
    const month = entry.timestamp.substring(0, 7);
    const ledgerPath = getLedgerPath(month, baseDir);
    
    // Append JSONL entry
    const jsonLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(ledgerPath, jsonLine, 'utf-8');
  } catch (error) {
    console.warn(`⚠️  Failed to log cost: ${(error as Error).message}`);
  }
}

/**
 * Get monthly total cost
 */
export async function getMonthlyTotal(month: string, baseDir?: string): Promise<number> {
  try {
    const ledgerPath = getLedgerPath(month, baseDir);
    
    if (!existsSync(ledgerPath)) {
      return 0;
    }
    
    const content = await fs.readFile(ledgerPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    let total = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as CostEntry;
        total += entry.estCostUSD;
      } catch {
        // Skip malformed lines
        continue;
      }
    }
    
    return total;
  } catch (error) {
    console.warn(`⚠️  Failed to read ledger: ${(error as Error).message}`);
    return 0;
  }
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7);
}