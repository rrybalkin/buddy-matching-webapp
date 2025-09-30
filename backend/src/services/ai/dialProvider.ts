import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from './aiProvider';

export class DIALProvider implements AIProvider {
  private config: AIProviderConfig | null = null;

  initialize(config: AIProviderConfig): void {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.baseURL && this.config?.model);
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.config) {
      throw new Error('DIAL provider not initialized');
    }

    const { messages, temperature = 0.3, maxTokens = 2000 } = request;
    const deploymentName = this.config.model;

    const response = await fetch(`${this.config.baseURL}/deployments/${deploymentName}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.config.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DIAL API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json() as AICompletionResponse;
  }
}
