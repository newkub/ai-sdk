import { Effect, Context, Layer, Ref } from 'effect';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Provider } from './types';
import type { ModelConfig } from './types';

// Client storage using Effect.Ref for thread-safe concurrent access
export interface ClientStorage {
  readonly getClient: (provider: Provider) => Effect.Effect<any, never, never>;
  readonly setClient: (provider: Provider, client: any) => Effect.Effect<void, never, never>;
  readonly hasClient: (provider: Provider) => Effect.Effect<boolean, never, never>;
}

export const ClientStorage = Context.GenericTag<ClientStorage>('ClientStorage');

export const makeClientStorage = (): Layer.Layer<ClientStorage> =>
  Layer.effect(
    ClientStorage,
    Effect.gen(function* () {
      const clientsRef = yield* Ref.make(new Map<Provider, any>());

      const getClient = (provider: Provider): Effect.Effect<any, never, never> =>
        Effect.gen(function* () {
          const clients = yield* Ref.get(clientsRef);
          const client = clients.get(provider);

          if (!client) {
            // Instead of failing, we could return undefined or use a different pattern
            // For now, let's use Effect.succeed with null to avoid errors
            return null;
          }

          return client;
        });

      const setClient = (provider: Provider, client: any): Effect.Effect<void> =>
        Ref.update(clientsRef, (clients: Map<Provider, any>) => new Map(clients.set(provider, client)));

      const hasClient = (provider: Provider): Effect.Effect<boolean> =>
        Ref.get(clientsRef).pipe(
          Effect.map((clients: Map<Provider, any>) => clients.has(provider))
        );

      return {
        getClient,
        setClient,
        hasClient
      };
    })
  );

// Client creation functions
export const createOpenAIClient = (config: ModelConfig): Effect.Effect<OpenAI, never, never> =>
  Effect.sync(() => new OpenAI({
    apiKey: config.apiKey || process.env['OPENAI_API_KEY'],
    baseURL: config.baseURL || undefined,
  }));

export const createAnthropicClient = (config: ModelConfig): Effect.Effect<Anthropic, never, never> =>
  Effect.sync(() => new Anthropic({
    apiKey: config.apiKey || process.env['ANTHROPIC_API_KEY'],
  }));

export const createGeminiClient = (config: ModelConfig): Effect.Effect<any, never, never> =>
  Effect.sync(() => ({
    getGenerativeModel: () => ({
      startChat: () => ({
        sendMessage: async () => ({ response: { text: () => 'Gemini not implemented' } })
      })
    })
  }));

// Dependencies context for external dependencies
export interface ModelDeps {
  readonly createOpenAIClient: (config: ModelConfig) => Effect.Effect<OpenAI, never, never>;
  readonly createAnthropicClient: (config: ModelConfig) => Effect.Effect<Anthropic, never, never>;
  readonly createGeminiClient: (config: ModelConfig) => Effect.Effect<any, never, never>;
}

export const ModelDeps = Context.GenericTag<ModelDeps>('ModelDeps');
