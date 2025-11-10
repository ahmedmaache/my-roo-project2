/**
 * Base interface for LLM providers
 */

export interface GenerateParams {
  system: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
}

export interface LLMProvider {
  name: string;
  generate(params: GenerateParams): Promise<string>;
}