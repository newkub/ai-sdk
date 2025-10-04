import { Effect, Ref, Schema } from 'effect';
import type { AppConfig } from './types';
import type { ConfigState } from './state';
import { ConfigError, AppConfigSchema } from './types';

// Pure functions for configuration operations using composition

// Get current configuration
export const getConfigOp = (state: ConfigState) =>
  Ref.get(state.configRef);

// Get specific module configuration
export const getModuleConfigOp = <K extends keyof AppConfig>(state: ConfigState) =>
  (module: K) =>
    Effect.gen(function* () {
      const config = yield* getConfigOp(state);
      return config[module];
    });

// Update configuration with validation
export const updateConfigOp = (state: ConfigState) =>
  (updates: Partial<AppConfig>) =>
    Effect.gen(function* () {
      const currentConfig = yield* getConfigOp(state);

      // Validate the updates
      const validatedUpdates = yield* state.validatePartialConfig(updates);

      // Merge with current config
      const newConfig = { ...currentConfig, ...validatedUpdates };

      // Set the new config
      yield* Ref.set(state.configRef, newConfig);
    }) as Effect.Effect<void, never, never>;

// Validate configuration
export const validateConfigOp = (state: ConfigState) =>
  (config: unknown) =>
    state.validateConfig(config) as Effect.Effect<AppConfig, never, never>;

// Reload configuration from sources
export const reloadConfigOp = (state: ConfigState) =>
  () =>
    Effect.gen(function* () {
      // Load fresh config from all sources
      const rawConfig = yield* state.loaderManager.loadMergedConfig();

      // Validate the loaded config
      const validatedConfig = yield* validateConfigOp(state)(rawConfig);

      // Update the stored config
      yield* Ref.set(state.configRef, validatedConfig);
    }) as Effect.Effect<void, never, never>;

// Reset configuration to defaults
export const resetToDefaultsOp = (state: ConfigState) =>
  () =>
    Effect.gen(function* () {
      const defaultConfig = Schema.decodeUnknownSync(AppConfigSchema)({});
      yield* Ref.set(state.configRef, defaultConfig);
    }) as Effect.Effect<void, never, never>;

// Export configuration as JSON string
export const exportConfigOp = (state: ConfigState) =>
  () =>
    Effect.gen(function* () {
      const config = yield* getConfigOp(state);
      const sanitized = state.sanitizeForLogging(config);
      return JSON.stringify(sanitized, null, 2);
    }) as Effect.Effect<string, never, never>;

// Import configuration from JSON string
export const importConfigOp = (state: ConfigState) =>
  (configJson: string) =>
    Effect.gen(function* () {
      const parsed = yield* Effect.try({
        try: () => JSON.parse(configJson),
        catch: (error) => new ConfigError(`Failed to parse configuration JSON: ${error}`)
      });

      const validated = yield* validateConfigOp(state)(parsed);
      yield* Ref.set(state.configRef, validated);
    }) as Effect.Effect<void, never, never>;
