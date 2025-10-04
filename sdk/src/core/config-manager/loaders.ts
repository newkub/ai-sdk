import { Effect, Array } from 'effect';
import type { AppConfig, ConfigLoader, ConfigSource } from './types';
import { readFile } from 'fs/promises';

// Environment loader - loads config from environment variables
export const createEnvironmentConfigLoader = (): ConfigLoader => ({
  source: 'environment',
  priority: 10, // High priority for environment overrides
  load: () => Effect.sync(() => {
    const config: Partial<AppConfig> = {};

    // Server config from env
    const serverConfig: any = {};
    if (process.env['PORT']) serverConfig.port = parseInt(process.env['PORT']);
    if (process.env['HOST']) serverConfig.host = process.env['HOST'];
    if (process.env['NODE_ENV']) serverConfig.environment = process.env['NODE_ENV'] as any;
    if (process.env['LOG_LEVEL']) serverConfig.logLevel = process.env['LOG_LEVEL'] as any;
    if (Object.keys(serverConfig).length > 0) {
      (config as any).server = serverConfig;
    }

    // Database config from env
    const databaseConfig: any = {};
    if (process.env['DATABASE_URL']) databaseConfig.url = process.env['DATABASE_URL'];
    if (process.env['DATABASE_TYPE']) databaseConfig.type = process.env['DATABASE_TYPE'] as any;
    if (Object.keys(databaseConfig).length > 0) {
      (config as any).database = databaseConfig;
    }

    // Models config from env
    if (process.env['OPENAI_API_KEY']) {
      (config as any).models = {
        providers: {
          openai: {
            apiKey: process.env['OPENAI_API_KEY'],
            enabled: true
          }
        }
      };
    }

    // MCP config from env
    const mcpConfig: any = {};
    if (process.env['MCP_ENABLED'] !== undefined) mcpConfig.enabled = process.env['MCP_ENABLED'] === 'true';
    if (process.env['MCP_PORT']) mcpConfig.port = parseInt(process.env['MCP_PORT']);
    if (Object.keys(mcpConfig).length > 0) {
      (config as any).mcp = mcpConfig;
    }

    // Memory config from env
    const memoryConfig: any = {};
    if (process.env['MEMORY_ENABLED'] !== undefined) memoryConfig.enabled = process.env['MEMORY_ENABLED'] === 'true';
    if (process.env['MEMORY_MAX_ENTRIES']) memoryConfig.maxShortTermEntries = parseInt(process.env['MEMORY_MAX_ENTRIES']);
    if (Object.keys(memoryConfig).length > 0) {
      (config as any).memory = memoryConfig;
    }

    // RAG config from env
    const ragConfig: any = {};
    if (process.env['RAG_ENABLED'] !== undefined) ragConfig.enabled = process.env['RAG_ENABLED'] === 'true';
    if (process.env['RAG_EMBEDDING_PROVIDER']) ragConfig.embeddingProvider = process.env['RAG_EMBEDDING_PROVIDER'];
    if (Object.keys(ragConfig).length > 0) {
      (config as any).rag = ragConfig;
    }

    return config;
  })
});

// File loader - loads config from JSON/YAML files
export const createFileConfigLoader = (filePath: string, sourceType: ConfigSource = 'file'): ConfigLoader => ({
  source: sourceType,
  priority: sourceType === 'file' ? 20 : 5, // Files have higher priority than defaults
  load: () => Effect.tryPromise(async () => {
    const content = await readFile(filePath, 'utf-8');

    if (filePath.endsWith('.json')) {
      return JSON.parse(content) as Partial<AppConfig>;
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      // For YAML support, you would need to add a YAML parser dependency
      // For now, we'll assume JSON format
      return JSON.parse(content) as Partial<AppConfig>;
    }

    throw new Error(`Unsupported config file format: ${filePath}`);
  }).pipe(Effect.catchAll(error => {
    console.warn(`Failed to load config from ${filePath}:`, error);
    return Effect.succeed({} as Partial<AppConfig>);
  }))
});

// Default loader - provides sensible defaults
export const createDefaultConfigLoader = (): ConfigLoader => ({
  source: 'default',
  priority: 1, // Lowest priority
  load: () => Effect.sync(() => ({
    server: {
      port: 3000,
      host: 'localhost',
      environment: 'development',
      logLevel: 'info'
    },
    database: {
      type: 'memory'
    },
    models: {
      defaultProvider: 'openai',
      providers: {
        openai: {
          enabled: false // Disabled by default for security
        }
      }
    },
    mcp: {
      enabled: false,
      name: 'ai-sdk-mcp-server',
      version: '1.0.0',
      port: 3000,
      transport: 'stdio',
      enableJsonResponse: true
    },
    memory: {
      enabled: true,
      maxShortTermEntries: 1000,
      maxLongTermEntries: 10000,
      persistenceEnabled: false,
      storagePath: './data/memory',
      autoCleanupInterval: 300000 // 5 minutes
    },
    rag: {
      enabled: true,
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingProvider: 'mock',
      vectorStoreType: 'in-memory',
      topK: 5,
      similarityThreshold: 0.7,
      maxTokensPerChunk: 512
    },
    agents: {
      enabled: true,
      defaultAgent: 'coding',
      maxConcurrentAgents: 10,
      agentTimeout: 300000 // 5 minutes
    },
    workflows: {
      enabled: true,
      maxConcurrentWorkflows: 5,
      workflowTimeout: 600000, // 10 minutes
      persistencePath: './data/workflows'
    },
    logging: {
      enabled: true,
      level: 'info',
      output: 'console'
    },
    security: {
      enabled: true,
      corsOrigins: ['http://localhost:3000']
    }
  }))
});

// Configuration loader manager class
export class ConfigLoaderManager {
  constructor(public readonly loaders: ConfigLoader[]) {}

  // Add a method to get the config loader by source
  getConfigLoaderBySource = (source: ConfigSource): ConfigLoader | undefined =>
    this.loaders.find(loader => loader.source === source);
  loadMergedConfig = (): Effect.Effect<Partial<AppConfig>, never, never> =>
    Effect.gen(this, function* () {
      // Sort loaders by priority (higher priority first)
      const sortedLoaders = [...this.loaders].sort((a, b) => b.priority - a.priority);

      // Load configs from all sources
      const configs = yield* Effect.forEach(sortedLoaders, loader =>
        loader.load().pipe(
          Effect.map(config => ({ config, source: loader.source, priority: loader.priority }))
        )
      );

      // Merge configurations (later sources override earlier ones)
      const mergedConfig = configs.reduce((acc, { config }) => ({
        ...acc,
        ...config,
        // Deep merge for nested objects
        server: { ...acc.server, ...config.server },
        database: { ...acc.database, ...config.database },
        models: { ...acc.models, ...config.models },
        mcp: { ...acc.mcp, ...config.mcp },
        memory: { ...acc.memory, ...config.memory },
        rag: { ...acc.rag, ...config.rag },
        agents: { ...acc.agents, ...config.agents },
        workflows: { ...acc.workflows, ...config.workflows },
        logging: { ...acc.logging, ...config.logging },
        security: { ...acc.security, ...config.security }
      }), {} as Partial<AppConfig>);

      return mergedConfig;
    });

  addLoader = (loader: ConfigLoader): ConfigLoaderManager =>
    new ConfigLoaderManager([...this.loaders, loader]);

  removeLoader = (source: ConfigSource): ConfigLoaderManager =>
    new ConfigLoaderManager(this.loaders.filter(loader => loader.source !== source));
}

// Factory function to create default loader manager
export const createDefaultLoaderManager = (): ConfigLoaderManager => {
  const loaders: ConfigLoader[] = [
    createDefaultConfigLoader(),
    createEnvironmentConfigLoader()
  ];

  return new ConfigLoaderManager(loaders);
};

// Factory function to create loader manager with custom loaders
export const createLoaderManager = (...loaders: ConfigLoader[]): ConfigLoaderManager =>
  new ConfigLoaderManager(loaders);
