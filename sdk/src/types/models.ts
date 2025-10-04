import { Schema } from 'effect';

// Model provider types
export type Provider = 'openai' | 'anthropic' | 'gemini';

export const ProviderSchema = Schema.Literal('openai', 'anthropic', 'gemini');

// Model configuration
export const ModelConfigSchema = Schema.Struct({
  provider: ProviderSchema,
  model: Schema.String,
  apiKey: Schema.optional(Schema.String),
  baseURL: Schema.optional(Schema.String)
});

export type ModelConfig = Schema.Schema.Type<typeof ModelConfigSchema>;

// Chat message structure
export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

// Chat options
export interface ChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly stop?: string[];
  readonly stream?: boolean;
}

// Chat response
export interface ChatResponse {
  readonly content: string;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
    readonly totalTokens?: number;
  };
  readonly finishReason?: string;
  readonly model?: string;
}

// Model client interfaces
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

export interface GeminiClient {
  readonly getGenerativeModel: (params: any) => {
    readonly startChat: (params: any) => {
      readonly sendMessage: (message: string) => Promise<any>;
    };
  };
}
