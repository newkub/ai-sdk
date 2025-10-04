import { Effect, Layer, Context } from 'effect';
import type { Provider, ModelConfig, ChatMessage, ChatOptions, ChatResponse } from './types';
import { ClientStorage, ModelDeps, makeClientStorage } from './clients';
import { openaiChatCompletion } from './providers/openai';
import { anthropicChatCompletion } from './providers/anthropic';
import { geminiChatCompletion } from './providers/gemini';
import { getAvailableModels, validateModel, getModelCapabilities, listModels } from './utils';

// Model service interface
export interface ModelService {
  readonly chatCompletion: (
    messages: ChatMessage[],
    config: ModelConfig,
    options?: ChatOptions
  ) => Effect.Effect<ChatResponse, never, ModelDeps | ClientStorage>;
  readonly getAvailableModels: (provider: Provider) => Effect.Effect<string[], never, never>;
  readonly validateModel: (provider: Provider, model: string) => Effect.Effect<boolean, never, never>;
  readonly getModelCapabilities: (modelId: string) => Effect.Effect<any, never, never>;
  readonly listModels: () => Effect.Effect<Array<{ id: string; name: string; provider: string }>, never, never>;
}

export const ModelService = Context.GenericTag<ModelService>('ModelService');

// Main model service implementation
const createModelService = (): ModelService => {
  return {
    chatCompletion: (messages, config, options = {}) =>
      Effect.gen(function* () {
        const deps = yield* ModelDeps;
        const clientStorage = yield* ClientStorage;

        const { provider, model } = config;

        // Initialize client if not exists
        const hasClient = yield* clientStorage.hasClient(provider);
        if (!hasClient) {
          let client: any;
          switch (provider) {
            case 'openai':
              client = yield* deps.createOpenAIClient(config);
              break;
            case 'anthropic':
              client = yield* deps.createAnthropicClient(config);
              break;
            case 'gemini':
              client = yield* deps.createGeminiClient(config);
              break;
            default:
              return { content: `Unsupported provider: ${provider}` };
          }
          yield* clientStorage.setClient(provider, client);
        }

        const client = yield* clientStorage.getClient(provider);

        switch (provider) {
          case 'openai':
            return yield* openaiChatCompletion(client, messages, model, options);
          case 'anthropic':
            return yield* anthropicChatCompletion(client, messages, model, options);
          case 'gemini':
            return yield* geminiChatCompletion(client, messages, model, options);
          default:
            return { content: `Unsupported provider: ${provider}` };
        }
      }),
    getAvailableModels,
    validateModel,
    getModelCapabilities,
    listModels
  };
};

export const makeModelService = (): Layer.Layer<ModelService, never, ModelDeps | ClientStorage> =>
  Layer.succeedContext(ModelService.context(createModelService()));

// Model service layer with all dependencies
export const ModelServiceLayer = Layer.provide(
  makeModelService(),
  Layer.mergeAll(
    makeClientStorage(),
    Layer.succeed(ModelDeps, {
      createOpenAIClient: (config) => Effect.sync(() => {
        // Use dynamic import for OpenAI but synchronously
        const OpenAI = require('openai');
        return new OpenAI.default({
          apiKey: config.apiKey || process.env['OPENAI_API_KEY'],
          baseURL: config.baseURL || undefined,
        });
      }),
      createAnthropicClient: (config) => Effect.sync(() => {
        const Anthropic = require('@anthropic-ai/sdk');
        return new Anthropic.default({
          apiKey: config.apiKey || process.env['ANTHROPIC_API_KEY'],
        });
      }),
      createGeminiClient: (config) => Effect.sync(() => ({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => ({ response: { text: () => 'Gemini not implemented' } })
          })
        })
      }))
    })
  )
);

// Convenience function for direct usage
export const useModels = () => ModelServiceLayer;
