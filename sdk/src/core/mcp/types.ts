import { Schema, type Effect, Context } from 'effect';

// Configuration schema using Effect
export const MCPServerConfigSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  port: Schema.optional(Schema.Number),
  transport: Schema.optional(Schema.Literal('stdio', 'http', 'both')),
  enableJsonResponse: Schema.optional(Schema.Boolean)
});

export type MCPServerConfig = Schema.Schema.Type<typeof MCPServerConfigSchema>;

// Dependencies context
export interface MCPServerDeps {
  readonly workflowEngine: {
    readonly executeWorkflow: (id: string, params?: any) => Effect.Effect<any, never, never>;
    readonly getAvailableWorkflows: () => Effect.Effect<any[], never, never>;
    readonly getWorkflowDefinitions: () => Effect.Effect<any[], never, never>;
  };
  readonly models: {
    readonly query: (params: any) => Effect.Effect<any, never, never>;
    readonly listModels: () => Effect.Effect<any[], never, never>;
    readonly getModelCapabilities: (modelId: string) => Effect.Effect<any, never, never>;
  };
}

export const MCPServerDeps = Context.GenericTag<MCPServerDeps>('MCPServerDeps');
