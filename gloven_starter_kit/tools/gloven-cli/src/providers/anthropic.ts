import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, GenerateParams } from './base.js';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: Anthropic;
  private model: string;
  private isDryRun: boolean;

  constructor(apiKey: string | undefined, model: string, isDryRun: boolean) {
    this.model = model;
    this.isDryRun = isDryRun;

    if (!apiKey && !isDryRun) {
      console.warn('⚠️  No Anthropic API key found. Running in DRY_RUN mode.');
      this.isDryRun = true;
    }

    this.client = new Anthropic({
      apiKey: apiKey || 'dry-run-key',
    });
  }

  async generate(params: GenerateParams): Promise<string> {
    if (this.isDryRun) {
      console.log('🏃 DRY-RUN (no API key): Returning placeholder response');
      return this.getDryRunResponse(params);
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: params.maxTokens || 2000,
        system: params.system,
        messages: [{ role: 'user', content: params.prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      return '';
    } catch (error) {
      throw new Error(`Anthropic API error: ${(error as Error).message}`);
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