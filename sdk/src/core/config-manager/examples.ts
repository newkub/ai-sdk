import { Effect } from 'effect';
import {
  getAppConfig,
  updateAppConfig,
  createConfigurationManager,
  ConfigManagerLayer,
  getMCPConfig,
  getMemoryConfig,
  getRAGConfig
} from './manager';
import {
  createEnvironmentConfigLoader,
  createFileConfigLoader
} from './loaders';

// Example 1: Basic usage in application startup
export const initializeAppWithConfig = () =>
  Effect.gen(function* () {
    // Create config manager with environment and file loaders
    const configManager = yield* createConfigurationManager({
      loaders: [
        createEnvironmentConfigLoader(),
        createFileConfigLoader('./config/app.json')
      ]
    });

    // Get the loaded configuration
    const appConfig = yield* configManager.getConfig();

    console.log('Application configured with:', appConfig.server?.port);

    return appConfig;
  });

// Example 2: Runtime configuration updates
export const updateRuntimeConfig = (newPort: number) =>
  Effect.gen(function* () {
    // Update server port at runtime
    yield* updateAppConfig({
      server: { port: newPort }
    });

    const updatedConfig = yield* getAppConfig();
    console.log('Updated server port to:', updatedConfig.server?.port);
  });

// Example 3: Module-specific configuration access
export const accessModuleConfig = () =>
  Effect.gen(function* () {
    // Access specific module configurations
    const mcpConfig = yield* getMCPConfig();
    const memoryConfig = yield* getMemoryConfig();
    const ragConfig = yield* getRAGConfig();

    return {
      mcp: mcpConfig.enabled ? 'enabled' : 'disabled',
      memory: memoryConfig.maxShortTermEntries,
      rag: ragConfig.embeddingProvider
    };
  });

// Example 4: Configuration validation
export const validateAndLoadConfig = (configPath?: string) =>
  Effect.gen(function* () {
    const loaders = configPath
      ? [createFileConfigLoader(configPath), createEnvironmentConfigLoader()]
      : [createEnvironmentConfigLoader()];

    const configManager = yield* createConfigurationManager({ loaders });

    // Validate the loaded configuration
    const validatedConfig = yield* configManager.validateConfig(
      yield* configManager.getConfig()
    );

    return validatedConfig;
  });

// Example 5: Environment-specific configuration
export const getEnvironmentSpecificConfig = () =>
  Effect.gen(function* () {
    const config = yield* getAppConfig();
    const environment = config.server?.environment || 'development';

    // Apply environment-specific settings
    switch (environment) {
      case 'production':
        return {
          ...config,
          logging: { ...config.logging, level: 'error' as const },
          security: { ...config.security, corsOrigins: ['https://myapp.com'] }
        };
      case 'development':
        return {
          ...config,
          logging: { ...config.logging, level: 'debug' as const },
          server: { ...config.server, port: 3001 }
        };
      default:
        return config;
    }
  });
