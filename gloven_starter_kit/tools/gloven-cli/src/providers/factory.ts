import type { LLMProvider } from './base.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenRouterProvider } from './openrouter.js';
import type { EnvConfig } from '../config.js';

/**
 * Create an LLM provider based on configuration
 */
export function createProvider(config: EnvConfig): LLMProvider {
  const provider = config.provider.toLowerCase();

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(config.openaiApiKey, config.model, config.dryRun);
    case 'anthropic':
      return new AnthropicProvider(config.anthropicApiKey, config.model, config.dryRun);
    case 'openrouter':
      return new OpenRouterProvider(config.openrouterApiKey, config.model, config.dryRun);
    default:
      throw new Error(
        `Unknown provider: ${provider}. Supported providers: openai, anthropic, openrouter`
      );
  }
}