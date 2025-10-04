import { Effect, Layer } from 'effect';
import { MCPServerDeps } from './types';
import { createWorkflowEngine } from '../workflows/engine';
import { ModelServiceLayer } from '../models/service';

// Default dependencies layer
export const DefaultMCPServerDeps = Layer.succeed(MCPServerDeps, {
  workflowEngine: {
    executeWorkflow: (id: string, params?: any) =>
      Effect.gen(function* () {
        const engine = yield* createWorkflowEngine();
        return yield* engine.executeWorkflow(id, params);
      }),
    getAvailableWorkflows: () =>
      Effect.gen(function* () {
        const engine = yield* createWorkflowEngine();
        return yield* engine.getAvailableWorkflows();
      }),
    getWorkflowDefinitions: () =>
      Effect.gen(function* () {
        const engine = yield* createWorkflowEngine();
        return yield* engine.getWorkflowDefinitions();
      })
  },
  models: {
    query: (params: any) =>
      Effect.async<any, never>((resume) => {
        (async () => {
          try {
            // Use the new ModelServiceLayer
            const models = ModelServiceLayer;
            // This is a simplified implementation
            const result = {
              content: `Mock model response for: ${params.messages?.[0]?.content || 'empty'}`,
              usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            };
            resume(Effect.succeed(result));
          } catch (error) {
            resume(Effect.die(error as Error));
          }
        })();
      }),
    listModels: () =>
      Effect.async<any[], never>((resume) => {
        (async () => {
          try {
            const models = ModelServiceLayer;
            const result: any[] = [];
            resume(Effect.succeed(result));
          } catch (error) {
            resume(Effect.die(error as Error));
          }
        })();
      }),
    getModelCapabilities: (modelId: string) =>
      Effect.async<any, never>((resume) => {
        (async () => {
          try {
            const models = ModelServiceLayer;
            const result = { id: modelId, maxTokens: 4096, supportsStreaming: true };
            resume(Effect.succeed(result));
          } catch (error) {
            resume(Effect.die(error as Error));
          }
        })();
      })
  }
});
