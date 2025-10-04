import { Effect, Ref, Schema } from 'effect';
import {
  AppConfigSchema,
  ConfigManager,
  ConfigError,
  type ConfigValidationError
} from './types';
import type { AppConfig } from './types';
import { ConfigLoaderManager } from './loaders';
import {
  validateConfig,
  validatePartialConfig,
  sanitizeForLogging,
} from './validators';

// Configuration state management using composition
export interface ConfigState {
  readonly configRef: Ref.Ref<AppConfig>;
  readonly loaderManager: ConfigLoaderManager;
  readonly validateConfig: (config: unknown) => Effect.Effect<AppConfig, ConfigValidationError, never>;
  readonly validatePartialConfig: (config: unknown) => Effect.Effect<Partial<AppConfig>, ConfigValidationError, never>;
  readonly sanitizeForLogging: (config: AppConfig) => Partial<AppConfig>;
}

export const createConfigState = (
  loaderManager: ConfigLoaderManager,
  validateConfig: (config: unknown) => Effect.Effect<AppConfig, ConfigValidationError, never>,
  validatePartialConfig: (config: unknown) => Effect.Effect<Partial<AppConfig>, ConfigValidationError, never>,
  sanitizeForLogging: (config: AppConfig) => Partial<AppConfig>,
  initialConfig?: Partial<AppConfig>
): ConfigState => {
  // Initialize with provided config or load from sources
  const defaultConfig = Schema.decodeUnknownSync(AppConfigSchema)({});
  const finalConfig = { ...defaultConfig, ...initialConfig };
  const configRef = Ref.unsafeMake(finalConfig);

  return {
    configRef,
    loaderManager,
    validateConfig,
    validatePartialConfig,
    sanitizeForLogging
  };
};
