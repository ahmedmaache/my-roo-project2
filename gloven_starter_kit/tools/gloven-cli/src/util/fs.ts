import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File system utilities for reading prompts and writing outputs
 */

/**
 * Read a file and return its contents
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Write content to a file, creating directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a path relative to the CLI project root
 */
export function resolvePath(...segments: string[]): string {
  // Go up from src/util/ to project root
  const projectRoot = path.resolve(__dirname, '..', '..');
  return path.resolve(projectRoot, ...segments);
}

/**
 * Read JSON file and parse it
 */
export async function readJSON<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Write object to JSON file
 */
export async function writeJSON(filePath: string, data: unknown, pretty = true): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeFile(filePath, content);
}

/**
 * Get the CLI project root directory
 */
export function getProjectRoot(): string {
  return path.resolve(__dirname, '..', '..');
}