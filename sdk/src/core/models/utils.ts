import { Effect } from 'effect';
import type { Provider } from './types';
import { getOpenAIModels, validateOpenAIModel } from './providers/openai';
import { getAnthropicModels, validateAnthropicModel } from './providers/anthropic';
import { getGeminiModels, validateGeminiModel } from './providers/gemini';

// Utility functions using composition
export const getAvailableModels = (provider: Provider): Effect.Effect<string[]> =>
  Effect.sync(() => {
    const models: Record<Provider, string[]> = {
      openai: getOpenAIModels(),
      anthropic: getAnthropicModels(),
      gemini: getGeminiModels(),
    };

    return models[provider] || [];
  });

export const validateModel = (provider: Provider, model: string): Effect.Effect<boolean> =>
  Effect.sync(() => {
    const validators: Record<Provider, (model: string) => boolean> = {
      openai: validateOpenAIModel,
      anthropic: validateAnthropicModel,
      gemini: validateGeminiModel,
    };

    return validators[provider]?.(model) ?? false;
  });

export const getModelCapabilities = (modelId: string): Effect.Effect<any> =>
  Effect.sync(() => {
    // Simple mock implementation - in real app this would fetch from API or config
    return {
      id: modelId,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsFunctionCalling: modelId.includes('gpt-4') || modelId.includes('claude-3'),
    };
  });

export const listModels = (): Effect.Effect<Array<{ id: string; name: string; provider: string }>> =>
  Effect.gen(function* () {
    const allModels = [];

    for (const provider of ['openai', 'anthropic', 'gemini'] as Provider[]) {
      const models = yield* getAvailableModels(provider);
      for (const model of models) {
        allModels.push({
          id: model,
          name: model,
          provider
        });
      }
    }

    return allModels;
  });
