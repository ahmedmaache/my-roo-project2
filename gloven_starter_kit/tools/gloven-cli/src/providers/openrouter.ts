import OpenAI from 'openai';
import type { LLMProvider, GenerateParams } from './base.js';

export class OpenRouterProvider implements LLMProvider {
  name = 'openrouter';
  private client: OpenAI;
  private model: string;
  private isDryRun: boolean;

  constructor(apiKey: string | undefined, model: string, isDryRun: boolean) {
    this.model = model;
    this.isDryRun = isDryRun;

    if (!apiKey && !isDryRun) {
      console.warn('⚠️  No OpenRouter API key found. Running in DRY_RUN mode.');
      this.isDryRun = true;
    }

    // OpenRouter uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: apiKey || 'dry-run-key',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://gloven.org',
        'X-Title': 'Gloven CLI',
      },
    });
  }

  async generate(params: GenerateParams): Promise<string> {
    if (this.isDryRun) {
      console.log('🏃 DRY-RUN (no API key): Returning placeholder response');
      return this.getDryRunResponse(params);
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: params.system },
        { role: 'user', content: params.prompt },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: params.maxTokens || 2000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenRouter API error: ${(error as Error).message}`);
    }
  }

  private getDryRunResponse(params: GenerateParams): string {
    if (params.json) {
      return JSON.stringify({
        dry_run: true,
        message: 'This is a DRY-RUN placeholder response',
      });
    }
    return 'DRY-RUN: This is a placeholder response. Set API keys and DRY_RUN=false to get real results.';
  }
}