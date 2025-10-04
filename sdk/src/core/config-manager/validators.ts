import { Effect, Schema } from 'effect';
import type { AppConfig } from './types';
import { AppConfigSchema, ConfigError, ConfigValidationError } from './types';

// Configuration validator functions using functional composition
export const validateConfig = (config: unknown): Effect.Effect<AppConfig, ConfigValidationError, never> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(AppConfigSchema)(config),
    catch: (error: unknown) => {
      // Check if it's a validation error by looking for error properties
      const errorMessage = error instanceof Error ? error.message : String(error);
      const validationErrors = [errorMessage];

      return new ConfigValidationError(
        `Configuration validation failed: ${validationErrors.join(', ')}`,
        validationErrors
      );
    }
  });

// Validate partial configuration (for updates)
export const validatePartialConfig = (config: unknown): Effect.Effect<Partial<AppConfig>, ConfigValidationError, never> =>
  Effect.try({
    try: () => {
      // Try to decode as full config first
      try {
        return Schema.decodeUnknownSync(AppConfigSchema)(config) as Partial<AppConfig>;
      } catch {
        // If that fails, try to decode as partial
        return Schema.partial(AppConfigSchema).pipe(
          Schema.decodeUnknownSync
        )(config) as Partial<AppConfig>;
      }
    },
    catch: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const validationErrors = [errorMessage];

      return new ConfigValidationError(
        `Configuration validation failed: ${validationErrors.join(', ')}`,
        validationErrors
      );
    }
  });

// Validate module-specific configuration
export const validateModuleConfig = <K extends keyof AppConfig>(
  module: K,
  config: unknown
): Effect.Effect<AppConfig[K], ConfigValidationError, never> => {
  return Effect.try({
    try: () => {
      // First validate the entire config, then extract the module
      const fullConfig = Schema.decodeUnknownSync(AppConfigSchema)({ [module]: config });
      return fullConfig[module];
    },
    catch: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const validationErrors = [`${module}: ${errorMessage}`];

      return new ConfigValidationError(
        `Module configuration validation failed for ${module}: ${validationErrors.join(', ')}`,
        validationErrors
      );
    }
  });
};

// Get configuration schema for documentation
export const getConfigSchema = (): typeof AppConfigSchema =>
  AppConfigSchema;

// Get default configuration values
export const getDefaultConfig = (): AppConfig =>
  Schema.decodeUnknownSync(AppConfigSchema)({});

// Configuration parser functions
export const parseJSON = (jsonString: string): Effect.Effect<unknown, ConfigError, never> =>
  Effect.try({
    try: () => JSON.parse(jsonString),
    catch: (error) => new ConfigError(`Failed to parse JSON configuration: ${error}`)
  });

// Parse configuration from environment variables format
export const parseEnvFormat = (envString: string): Effect.Effect<Partial<AppConfig>, ConfigError, never> =>
  Effect.try({
    try: () => {
      const lines = envString.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      const config: Partial<AppConfig> = {};

      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');

        if (key && value) {
          setNestedValue(config, key.trim(), value.trim());
        }
      }

      return config;
    },
    catch: (error) => new ConfigError(`Failed to parse environment format: ${error}`)
  });

// Helper function to set nested values using dot notation
const setNestedValue = (obj: Record<string, any>, path: string, value: string): void => {
  const keys = path.split('.');
  const finalKey = keys[keys.length - 1];
  const parentKeys = keys.slice(0, -1);

  let current: Record<string, any> = obj;

  // Navigate to the parent object
  for (const key of parentKeys) {
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, any>;
  }

  // Ensure current is still a valid object and finalKey exists
  if (current && finalKey) {
    // Set the final value with type conversion
    if (value.toLowerCase() === 'true') {
      current[finalKey] = true;
    } else if (value.toLowerCase() === 'false') {
      current[finalKey] = false;
    } else if (!isNaN(Number(value))) {
      current[finalKey] = Number(value);
    } else {
      current[finalKey] = value;
    }
  }
};

// Configuration sanitizer functions
export const sanitizeForLogging = (config: AppConfig): Partial<AppConfig> => {
  const sanitized = { ...config };

  // Remove sensitive fields
  if (sanitized.models?.providers) {
    Object.keys(sanitized.models.providers).forEach(provider => {
      const providerConfig = sanitized.models!.providers![provider];
      if (providerConfig?.apiKey) {
        (sanitized.models!.providers as any)[provider] = {
          ...providerConfig,
          apiKey: '[REDACTED]'
        };
      }
    });
  }

  if (sanitized.security?.secretKey) {
    sanitized.security = {
      ...sanitized.security,
      secretKey: '[REDACTED]'
    };
  }

  return sanitized;
};

// Validate required fields for different environments
export const validateEnvironmentConfig = (config: AppConfig, environment: string): Effect.Effect<void, ConfigError, never> =>
  Effect.sync(() => {
    if (environment === 'production') {
      // In production, require certain fields
      if (!config.models?.providers?.['openai']?.apiKey) {
        throw new ConfigError('OpenAI API key is required in production environment');
      }

      if (!config.security?.secretKey) {
        throw new ConfigError('Security secret key is required in production environment');
      }
    }
  });

// Composition functions that combine multiple validators
export const createConfigPipeline = <T>(
  ...validators: Array<(value: T) => Effect.Effect<T, ConfigValidationError, never>>
): ((value: T) => Effect.Effect<T, ConfigValidationError, never>) => {
  return (value: T): Effect.Effect<T, ConfigValidationError, never> =>
    validators.reduce(
      (acc: Effect.Effect<T, ConfigValidationError, never>, validator) =>
        acc.pipe(Effect.flatMap(validator)),
      Effect.succeed(value)
    );
};
