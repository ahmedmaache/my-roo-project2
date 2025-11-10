import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export interface GlovenConfig {
  provider: string;
  model: string;
  outDir: string;
  promptDir: string;
  locale: string;
  guardrails: {
    maxRequests: number;
    dryRunFallback: boolean;
  };
}

export interface EnvConfig {
  provider: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  model: string;
  rateLimitRps: number;
  maxOutputTokens: number;
  dryRun: boolean;
  costPer1kInput: number;
  costPer1kOutput: number;
}

/**
 * Load configuration from gloven.config.yaml
 */
export function loadConfig(): GlovenConfig {
  try {
    const configPath = path.resolve(__dirname, '..', 'gloven.config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as GlovenConfig;
    return config;
  } catch (error) {
    // Return default config if file doesn't exist
    console.warn('⚠️  gloven.config.yaml not found, using defaults');
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      outDir: '../../out',
      promptDir: '../../ai_prompts',
      locale: 'global',
      guardrails: {
        maxRequests: 8,
        dryRunFallback: true,
      },
    };
  }
}

/**
 * Load environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  return {
    provider: process.env.PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.MODEL || 'gpt-4o-mini',
    rateLimitRps: parseInt(process.env.RATE_LIMIT_RPS || '2', 10),
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '2000', 10),
    dryRun: process.env.DRY_RUN === 'true',
    costPer1kInput: parseFloat(process.env.COST_PER_1K_INPUT || '0'),
    costPer1kOutput: parseFloat(process.env.COST_PER_1K_OUTPUT || '0'),
  };
}

/**
 * Get merged configuration (env overrides config file)
 */
export function getConfig(): { config: GlovenConfig; env: EnvConfig } {
  const config = loadConfig();
  const env = loadEnvConfig();

  // ENV vars override config file
  if (env.provider) config.provider = env.provider;
  if (env.model) config.model = env.model;

  return { config, env };
}