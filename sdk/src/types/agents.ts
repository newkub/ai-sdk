import { Schema, type Effect, type Option } from 'effect';
import type { ModelConfig, ChatMessage, ChatOptions, ChatResponse } from './models';

// Agent configuration schema
export const AgentConfigSchema = Schema.Struct({
  name: Schema.String,
  role: Schema.String,
  systemPrompt: Schema.optional(Schema.String),
  modelConfig: Schema.Struct({
    provider: Schema.Literal('openai', 'anthropic', 'gemini'),
    model: Schema.String,
    apiKey: Schema.optional(Schema.String),
    baseURL: Schema.optional(Schema.String)
  }),
  temperature: Schema.optional(Schema.Number),
  maxTokens: Schema.optional(Schema.Number)
});

export type AgentConfig = Schema.Schema.Type<typeof AgentConfigSchema>;

// Agent context schema
export const AgentContextSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown
});

export type AgentContext = Schema.Schema.Type<typeof AgentContextSchema>;

// Agent response schema
export const AgentResponseSchema = Schema.Struct({
  content: Schema.String,
  usage: Schema.optional(Schema.Struct({
    promptTokens: Schema.optional(Schema.Number),
    completionTokens: Schema.optional(Schema.Number),
    totalTokens: Schema.optional(Schema.Number)
  })),
  agentName: Schema.String,
  timestamp: Schema.Date
});

export type AgentResponse = Schema.Schema.Type<typeof AgentResponseSchema>;

// Agent state interface
export interface AgentState {
  readonly config: AgentConfig;
  readonly context: AgentContext;
}

// Agent service interface
export interface AgentService {
  readonly getConfig: () => Effect.Effect<AgentConfig, never, never>;
  readonly setContext: (context: AgentContext) => Effect.Effect<void, never, never>;
  readonly clearContext: () => Effect.Effect<void, never, never>;
  readonly chat: (message: string | ChatMessage[], options?: ChatOptions) => Effect.Effect<AgentResponse, never, never>;
  readonly streamChat: (message: string | ChatMessage[], options?: ChatOptions) => Effect.Effect<never, never, never>;
}

// Agent manager service interface
export interface AgentManagerService {
  readonly addAgent: (name: string, agentService: AgentService) => Effect.Effect<void, never, never>;
  readonly getAgent: (name: string) => Effect.Effect<Option.Option<AgentService>, never, never>;
  readonly removeAgent: (name: string) => Effect.Effect<boolean, never, never>;
  readonly listAgents: () => Effect.Effect<string[], never, never>;
  readonly chatWith: (agentName: string, message: string, options?: ChatOptions) => Effect.Effect<AgentResponse, never, never>;
}

// Dependencies context for agents
export interface AgentDeps {
  readonly chatCompletion: (messages: ChatMessage[], config: ModelConfig, options?: ChatOptions) => Effect.Effect<ChatResponse, never, never>;
}
