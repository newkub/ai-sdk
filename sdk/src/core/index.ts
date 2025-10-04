// Core modules exports - organized by feature folders

export * from './agents';
export * from './workflows';
export * from './mcp';
export * from './memory';
export * from './rag';
export * from './config-manager';

// For backward compatibility, also export the main services
export { createWorkflowEngine } from './workflows/engine';
export { createWorkflowBuilder } from './workflows/builder';

// For backward compatibility, also export the main agent services
export { makeAgentManagerService } from './agents/manager';
export type { AgentManagerService } from './agents/manager';
export { makeAgentService, AgentDeps } from './agents/service';
export { createAgent, createDefaultAgent, createCodingAgent, createResearchAgent } from './agents/factory';

// Export types from the models module for backward compatibility
export type {
  ChatMessage,
  ChatOptions,
  ModelConfig
} from '../types/models';