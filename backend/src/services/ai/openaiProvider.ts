import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from './aiProvider';

export class OpenAIProvider implements AIProvider {
  private config: AIProviderConfig | null = null;
  private client: OpenAI | null = null;

  initialize(config: AIProviderConfig): void {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.baseURL && this.config?.model);
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.client || !this.config) {
      throw new Error('OpenAI provider not initialized');
    }

    const { messages, temperature = 0.3, maxTokens = 2000 } = request;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        choices: completion.choices.map(choice => ({
          message: {
            content: choice.message.content || ''
          }
        }))
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
