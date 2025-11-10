import path from 'path';
import { readFile, resolvePath } from './util/fs.js';

/**
 * Prompt loader for reading and processing AI prompt files
 */

// Map command names to task prompt files
const TASK_PROMPT_MAP: Record<string, string> = {
  plan: 'task_prompts/a_founder_acquisition_30_60_90.md',
  calendar: 'task_prompts/b_content_editorial_calendar.md',
  partners: 'task_prompts/c_partner_mentor_sourcing.md',
  score: 'task_prompts/d_application_scoring.md',
};

/**
 * Load the system prompt (Growth OS)
 */
export async function loadSystemPrompt(promptDir: string): Promise<string> {
  const systemPromptPath = resolvePath(promptDir, 'growth_os_system_prompt.md');
  try {
    return await readFile(systemPromptPath);
  } catch (error) {
    throw new Error(`Failed to load system prompt: ${(error as Error).message}`);
  }
}

/**
 * Load a task-specific prompt
 */
export async function loadTaskPrompt(task: string, promptDir: string): Promise<string> {
  const taskFile = TASK_PROMPT_MAP[task];
  if (!taskFile) {
    throw new Error(`Unknown task: ${task}. Available tasks: ${Object.keys(TASK_PROMPT_MAP).join(', ')}`);
  }

  const taskPromptPath = resolvePath(promptDir, taskFile);
  try {
    return await readFile(taskPromptPath);
  } catch (error) {
    throw new Error(`Failed to load task prompt for ${task}: ${(error as Error).message}`);
  }
}

/**
 * Inject variables into a prompt template
 * Replaces {variable_name} with values from the variables object
 */
export function injectVariables(template: string, variables: Record<string, string>): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    // Replace {key} with value (case-insensitive)
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Build a complete user prompt with injected variables
 */
export async function buildUserPrompt(
  task: string,
  promptDir: string,
  variables: Record<string, string>
): Promise<string> {
  const taskPrompt = await loadTaskPrompt(task, promptDir);
  return injectVariables(taskPrompt, variables);
}

/**
 * Get available tasks
 */
export function getAvailableTasks(): string[] {
  return Object.keys(TASK_PROMPT_MAP);
}