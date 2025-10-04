//# Main exports from agents module
export * from './types';
export * from './state';
export * from './service';
export * from './manager';
export * from './factory';

// For backward compatibility, also export the main services
export { makeAgentManagerService } from './manager';
export { makeAgentService, AgentDeps } from './service';
export { createAgent, createDefaultAgent, createCodingAgent, createResearchAgent } from './factory';

// Export factory functions for easy usage
import { Effect } from 'effect';
import { makeAgentManagerService } from './manager';

export const createAgentManager = () => {
  // For now, return the layer - users can provide it to their Effect runtime
  return makeAgentManagerService();
};

export {
  AgentConfigSchema,
  AgentContextSchema,
  AgentResponseSchema
} from './types';
