import { Effect, Ref } from 'effect';
import type { AppConfig } from './types';
import type { ConfigState } from './state';

// Get configuration for specific environment
export const getEnvironmentConfigOp = (state: ConfigState) =>
    (environment: string) =>
        Effect.gen(function* () {
            const config: AppConfig = yield* Ref.get(state.configRef);
            // Apply environment-specific overrides using functional composition
            const envOverrides: Record<string, any> = {};

            switch (environment) {
                case 'production':
                    envOverrides['server'] = {
                        port: config['server']?.port,
                        host: config['server']?.host,
                        environment: config['server']?.environment,
                        logLevel: 'warn' as const
                    };
                    envOverrides['logging'] = {
                        enabled: config['logging']?.enabled,
                        level: 'warn' as const,
                        output: 'file' as const,
                        filePath: config['logging']?.filePath
                    };
                    break;
                case 'development':
                    envOverrides['server'] = {
                        port: config['server']?.port,
                        host: config['server']?.host,
                        environment: config['server']?.environment,
                        logLevel: 'debug' as const
                    };
                    envOverrides['logging'] = {
                        enabled: config['logging']?.enabled,
                        level: 'debug' as const,
                        output: 'console' as const,
                        filePath: config['logging']?.filePath
                    };
                    break;
                case 'test':
                    envOverrides['server'] = {
                        port: 0,
                        host: config['server']?.host,
                        environment: config['server']?.environment,
                        logLevel: config['server']?.logLevel
                    };
                    envOverrides['logging'] = {
                        enabled: false,
                        level: config['logging']?.level,
                        output: config['logging']?.output,
                        filePath: config['logging']?.filePath
                    };
                    break;
            }

            return { ...config, ...envOverrides };
        }) as Effect.Effect<AppConfig, never, never>;
