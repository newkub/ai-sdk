import { Schema } from 'effect';

// Model provider schemas
export const ProviderSchema = Schema.Literal('openai', 'anthropic', 'gemini');

export const ModelConfigSchema = Schema.Struct({
  provider: ProviderSchema,
  model: Schema.String,
  apiKey: Schema.optional(Schema.String),
  baseURL: Schema.optional(Schema.String)
});

// Client interfaces
export interface OpenAIClient {
  readonly chat: {
    readonly completions: {
      readonly create: (params: any) => Promise<any>;
    };
  };
}

export interface AnthropicClient {
  readonly messages: {
    readonly create: (params: any) => Promise<any>;
  };
}

// Provider type
export type Provider = 'openai' | 'anthropic' | 'gemini';
export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

// Chat options interface
export interface ChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly stream?: boolean;
}

// Chat response interface
export interface ChatResponse {
  readonly content: string;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
    readonly totalTokens?: number;
  } | undefined;
}

// Model configuration interface
export interface ModelConfig {
  readonly provider: 'openai' | 'anthropic' | 'gemini';
  readonly model: string;
  readonly apiKey?: string | undefined;
  readonly baseURL?: string | undefined;
}
