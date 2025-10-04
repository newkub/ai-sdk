import { Schema, type Effect, Context } from 'effect';

// MCP Server configuration schema
export const MCPServerConfigSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  port: Schema.optional(Schema.Number),
  transport: Schema.optional(Schema.Literal('stdio', 'http', 'both')),
  enableJsonResponse: Schema.optional(Schema.Boolean)
});

export type MCPServerConfig = Schema.Schema.Type<typeof MCPServerConfigSchema>;

// MCP Server dependencies context
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

// Simplified MCP types for compatibility
export interface McpServer {
  registerTool: (name: string, config: any, handler: Function) => void;
  registerResource: (name: string, uri: string, config: any, handler: Function) => void;
  connect: (transport: any) => Promise<void>;
}

export interface ResourceTemplate {
  new (uri: string, config: any): any;
}
