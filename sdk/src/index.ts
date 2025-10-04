// Export functions from models (using new modular structure)
export { useModels, ModelServiceLayer } from './core/models/service';
export { getAvailableModels, validateModel } from './core/models/utils';
export { chatCompletion } from './core/models';

// Export types from models
export type { Provider, ModelConfig, ChatMessage, ChatOptions, ChatResponse } from './core/models/types';

// Export functions from agents
export {
  createAgent,
  createDefaultAgent,
  createCodingAgent,
  createResearchAgent,
  createAgentManager
} from './core/agents';

// Export types from agents
export type { AgentConfig, AgentContext, AgentResponse } from './core/agents/types';

// Export functions from workflows
export {
  createWorkflowEngine,
  createWorkflowBuilder
} from './core/workflows';

// Export types from workflows
export type { Workflow, WorkflowStep, WorkflowExecutionResult, WorkflowStepResult, WorkflowContext } from './core/workflows/types';