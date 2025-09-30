# AI Provider System

This directory contains an abstract AI provider system that allows switching between different AI services (DIAL, OpenAI, etc.) via environment configuration.

## Architecture

### Core Components

1. **`aiProvider.ts`** - Defines the abstract `AIProvider` interface and related types
2. **`dialProvider.ts`** - DIAL API implementation (Azure OpenAI compatible)
3. **`openaiProvider.ts`** - OpenAI API implementation
4. **`aiProviderFactory.ts`** - Factory for creating and managing AI providers

### Interface

```typescript
interface AIProvider {
  initialize(config: AIProviderConfig): void;
  isConfigured(): boolean;
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;
}
```

## Configuration

Set the `AI_PROVIDER` environment variable to switch between providers:

### DIAL Provider (Default)
```env
AI_PROVIDER="dial"
OPENAI_API_KEY="your-dial-api-key"
OPENAI_API_URL="https://ai-proxy.lab.epam.com/openai"
OPENAI_MODEL="gpt-4"
```

### OpenAI Provider
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_API_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4"
```

## Usage

The `AIMatchingService` automatically uses the configured provider:

```typescript
// No code changes needed - provider is selected via environment
const suggestions = await AIMatchingService.getSuggestions(request);
```

## Adding New Providers

1. Create a new provider class implementing `AIProvider`
2. Add the provider type to `AIProviderType` enum
3. Update `AIProviderFactory.createProvider()` to handle the new type
4. Update environment configuration documentation

## Benefits

- **Flexibility**: Easy switching between AI providers
- **Maintainability**: Clean separation of concerns
- **Testability**: Easy to mock providers for testing
- **Extensibility**: Simple to add new AI providers
- **Configuration**: Environment-driven provider selection
