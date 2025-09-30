export interface AIProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface AIProvider {
  /**
   * Initialize the AI provider with configuration
   */
  initialize(config: AIProviderConfig): void;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Generate a completion using the AI provider
   */
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;
}

export enum AIProviderType {
  DIAL = 'dial',
  OPENAI = 'openai'
}
