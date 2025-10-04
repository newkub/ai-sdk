import { Schema, type Effect, Context, Layer } from 'effect';

// Centralized application configuration
export const AppConfigSchema = Schema.Struct({
  // Server configuration
  server: Schema.Struct({
    port: Schema.optional(Schema.Number),
    host: Schema.optional(Schema.String),
    environment: Schema.optional(Schema.Literal('development', 'staging', 'production', 'test')),
    logLevel: Schema.optional(Schema.Literal('debug', 'info', 'warn', 'error'))
  }),

  // Database configuration
  database: Schema.Struct({
    url: Schema.optional(Schema.String),
    type: Schema.optional(Schema.Literal('memory', 'filesystem', 'postgresql', 'mongodb')),
    connectionPool: Schema.optional(Schema.Struct({
      min: Schema.optional(Schema.Number),
      max: Schema.optional(Schema.Number),
      timeout: Schema.optional(Schema.Number)
    }))
  }),

  // AI Models configuration
  models: Schema.Struct({
    defaultProvider: Schema.optional(Schema.String),
    providers: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        apiKey: Schema.optional(Schema.String),
        baseURL: Schema.optional(Schema.String),
        model: Schema.optional(Schema.String),
        enabled: Schema.optional(Schema.Boolean)
      })
    }))
  }),

  // MCP Server configuration
  mcp: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    name: Schema.optional(Schema.String),
    version: Schema.optional(Schema.String),
    port: Schema.optional(Schema.Number),
    transport: Schema.optional(Schema.Literal('stdio', 'http', 'both')),
    enableJsonResponse: Schema.optional(Schema.Boolean)
  }),

  // Memory configuration
  memory: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    maxShortTermEntries: Schema.optional(Schema.Number),
    maxLongTermEntries: Schema.optional(Schema.Number),
    persistenceEnabled: Schema.optional(Schema.Boolean),
    storagePath: Schema.optional(Schema.String),
    autoCleanupInterval: Schema.optional(Schema.Number)
  }),

  // RAG configuration
  rag: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    chunkSize: Schema.optional(Schema.Number),
    chunkOverlap: Schema.optional(Schema.Number),
    embeddingProvider: Schema.optional(Schema.String),
    vectorStoreType: Schema.optional(Schema.Literal('in-memory', 'chroma', 'pinecone')),
    topK: Schema.optional(Schema.Number),
    similarityThreshold: Schema.optional(Schema.Number),
    maxTokensPerChunk: Schema.optional(Schema.Number)
  }),

  // Agents configuration
  agents: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    defaultAgent: Schema.optional(Schema.String),
    maxConcurrentAgents: Schema.optional(Schema.Number),
    agentTimeout: Schema.optional(Schema.Number)
  }),

  // Workflows configuration
  workflows: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    maxConcurrentWorkflows: Schema.optional(Schema.Number),
    workflowTimeout: Schema.optional(Schema.Number),
    persistencePath: Schema.optional(Schema.String)
  }),

  // Logging configuration
  logging: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    level: Schema.optional(Schema.Literal('debug', 'info', 'warn', 'error', 'off')),
    format: Schema.optional(Schema.Literal('json', 'text', 'structured')),
    output: Schema.optional(Schema.Literal('console', 'file', 'both')),
    filePath: Schema.optional(Schema.String)
  }),

  // Security configuration
  security: Schema.Struct({
    enabled: Schema.optional(Schema.Boolean),
    secretKey: Schema.optional(Schema.String),
    jwtExpiration: Schema.optional(Schema.String),
    corsOrigins: Schema.optional(Schema.Array(Schema.String))
  })
});

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>;

// Configuration context
export interface ConfigManager {
  readonly getConfig: () => Effect.Effect<AppConfig, never, never>;
  readonly getModuleConfig: <K extends keyof AppConfig>(module: K) => Effect.Effect<AppConfig[K], never, never>;
  readonly updateConfig: (updates: Partial<AppConfig>) => Effect.Effect<void, never, never>;
  readonly validateConfig: (config: unknown) => Effect.Effect<AppConfig, never, never>;
  readonly reloadConfig: () => Effect.Effect<void, never, never>;
}

export const ConfigManager = Context.GenericTag<ConfigManager>('ConfigManager');

// Configuration source types
export type ConfigSource = 'file' | 'environment' | 'database' | 'default';

// Configuration loader interface
export interface ConfigLoader {
  readonly load: () => Effect.Effect<Partial<AppConfig>, never, never>;
  readonly source: ConfigSource;
  readonly priority: number; // Higher number = higher priority
}

// Configuration error types
export class ConfigError extends Error {
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ConfigValidationError extends ConfigError {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
