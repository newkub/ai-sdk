// Main exports from config-manager module
export * from './types';
export * from './loaders';
export * from './validators';
export * from './manager';
export * from './examples';
export * from './integration';

// Re-export commonly used functions for convenience
export {
  getAppConfig,
  getModuleConfig,
  updateAppConfig,
  getServerConfig,
  getDatabaseConfig,
  getModelsConfig,
  getMCPConfig,
  getMemoryConfig,
  getRAGConfig,
  getAgentsConfig,
  getWorkflowsConfig,
  getLoggingConfig,
  getSecurityConfig
} from './manager';
