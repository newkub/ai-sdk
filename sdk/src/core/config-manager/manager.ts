import { Effect, Ref, Schema, Layer } from 'effect';
import {
  AppConfigSchema,
  ConfigManager,
  ConfigError,
  type ConfigValidationError
} from './types';
import type { AppConfig } from './types';
import { ConfigLoaderManager, createDefaultLoaderManager } from './loaders';
import {
  validateConfig,
  validatePartialConfig,
  sanitizeForLogging,
  validateEnvironmentConfig
} from './validators';

// Import state management
import type { ConfigState } from './state';
import { createConfigState } from './state';

// Import operations
import {
  getConfigOp,
  getModuleConfigOp,
  updateConfigOp,
  validateConfigOp,
  reloadConfigOp,
  resetToDefaultsOp,
  exportConfigOp,
  importConfigOp
} from './operations';

// Import environment operations
import { getEnvironmentConfigOp } from './config-environment';

// Configuration manager factory using functional composition
export const createConfigurationManager = (
  options?: {
    initialConfig?: Partial<AppConfig>;
    loaders?: any[]; // Using any[] for now to match existing interface
    enableAutoReload?: boolean;
    reloadInterval?: number;
  }
): Effect.Effect<ConfigManager, never, never> =>
  Effect.gen(function* () {
    const loaderManager = options?.loaders
      ? new ConfigLoaderManager(options.loaders)
      : createDefaultLoaderManager();

    const state = createConfigState(
      loaderManager,
      validateConfig,
      validatePartialConfig,
      sanitizeForLogging,
      options?.initialConfig
    );

    // Return object implementing ConfigManager interface using composition
    return {
      getConfig: () => getConfigOp(state),
      getModuleConfig: getModuleConfigOp(state),
      updateConfig: updateConfigOp(state),
      validateConfig: validateConfigOp(state),
      reloadConfig: reloadConfigOp(state),
      resetToDefaults: resetToDefaultsOp(state),
      exportConfig: exportConfigOp(state),
      importConfig: importConfigOp(state),
      getEnvironmentConfig: getEnvironmentConfigOp(state)
    };
  });

// Configuration manager layer for Effect dependency injection
export const ConfigManagerLayer = Layer.effect(
  ConfigManager,
  Effect.gen(function* () {
    const configManager = yield* createConfigurationManager();
  })
);

// Convenience functions for common operations using composition
export const getAppConfig = (): Effect.Effect<AppConfig, never, never> =>
  Effect.gen(function* () {
    const configManager = yield* ConfigManager;
    return yield* configManager.getConfig();
  }).pipe(Effect.asAppConfig);

export const getModuleConfig = <K extends keyof AppConfig>(module: K): Effect.Effect<AppConfig[K], never, never> =>
  Effect.gen(function* () {
    const configManager = yield* ConfigManager;
    return yield* configManager.getModuleConfig(module);
  }).pipe(Effect.asModuleConfig);

export const updateAppConfig = (updates: Partial<AppConfig>): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const configManager = yield* ConfigManager;
    return yield* configManager.updateConfig(updates);
  }).pipe(Effect.asVoid);
export const getServerConfig = () => getModuleConfig('server');
export const getDatabaseConfig = () => getModuleConfig('database');
export const getModelsConfig = () => getModuleConfig('models');
export const getMCPConfig = () => getModuleConfig('mcp');
export const getMemoryConfig = () => getModuleConfig('memory');
export const getRAGConfig = () => getModuleConfig('rag');
export const getAgentsConfig = () => getModuleConfig('agents');
export const getWorkflowsConfig = () => getModuleConfig('workflows');
export const getLoggingConfig = () => getModuleConfig('logging');
export const getSecurityConfig = () => getModuleConfig('security');
