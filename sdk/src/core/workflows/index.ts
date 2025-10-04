//# Main exports from workflows module
export * from './types';
export * from './engine';
export * from './builder';
export * from './execution';

// For backward compatibility, also export the main functions
export { createWorkflowEngine } from './engine';
export { createWorkflowBuilder } from './builder';

// Export factory functions for easy usage
import { Effect } from 'effect';
import { createWorkflowEngine } from './engine';
import { createWorkflowBuilder } from './builder';

export const createWorkflowEngineInstance = () => Effect.runSync(createWorkflowEngine());
export const createWorkflowBuilderInstance = (id: string, name: string) => Effect.runSync(createWorkflowBuilder(id, name));
