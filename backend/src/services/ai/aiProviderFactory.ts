import { AIProvider, AIProviderType, AIProviderConfig } from './aiProvider';
import { DIALProvider } from './dialProvider';
import { OpenAIProvider } from './openaiProvider';

export class AIProviderFactory {
  private static providers: Map<AIProviderType, AIProvider> = new Map();

  /**
   * Get an AI provider instance
   */
  static getProvider(type: AIProviderType): AIProvider {
    if (!this.providers.has(type)) {
      this.providers.set(type, this.createProvider(type));
    }
    return this.providers.get(type)!;
  }

  /**
   * Create a new provider instance
   */
  private static createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case AIProviderType.DIAL:
        return new DIALProvider();
      case AIProviderType.OPENAI:
        return new OpenAIProvider();
      default:
        throw new Error(`Unsupported AI provider type: ${type}`);
    }
  }

  /**
   * Initialize the default provider from environment variables
   */
  static initializeDefaultProvider(): AIProvider {
    const providerType = this.getProviderTypeFromEnv();
    const config = this.getConfigFromEnv();
    
    const provider = this.getProvider(providerType);
    provider.initialize(config);
    
    return provider;
  }

  /**
   * Get provider type from environment variables
   */
  private static getProviderTypeFromEnv(): AIProviderType {
    const providerType = process.env.AI_PROVIDER?.toLowerCase();
    
    switch (providerType) {
      case 'dial':
        return AIProviderType.DIAL;
      case 'openai':
        return AIProviderType.OPENAI;
      default:
        // Default to DIAL for backward compatibility
        return AIProviderType.DIAL;
    }
  }

  /**
   * Get configuration from environment variables
   */
  private static getConfigFromEnv(): AIProviderConfig {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_URL;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey || !baseURL || !model) {
      throw new Error('Missing required AI configuration. Please set OPENAI_API_KEY, OPENAI_API_URL, and OPENAI_MODEL environment variables.');
    }

    return {
      apiKey,
      baseURL,
      model,
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000')
    };
  }

  /**
   * Clear all provider instances (useful for testing)
   */
  static clearProviders(): void {
    this.providers.clear();
  }
}
