import { Effect } from 'effect';
import { z } from 'zod';
import type { MCPServerDeps } from './types';

// Tool creation using composition
export const createMCPServerTools = (deps: MCPServerDeps) =>
  Effect.succeed([
    [
      'execute-workflow',
      {
        title: 'Execute Workflow',
        description: 'Execute a workflow with given parameters',
        inputSchema: {
          workflowId: z.string().describe('The ID of the workflow to execute'),
          parameters: z.record(z.any()).optional().describe('Parameters to pass to the workflow')
        },
        outputSchema: {
          result: z.any(),
          executionId: z.string()
        }
      },
      async ({ workflowId, parameters = {} }: { workflowId: string; parameters?: any }) => {
        try {
          const result = await Effect.runPromise(deps.workflowEngine.executeWorkflow(workflowId, parameters));
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: result
          };
        } catch (error) {
          throw new Error(`Workflow execution failed: ${error}`);
        }
      }
    ] as const,
    [
      'query-model',
      {
        title: 'Query AI Model',
        description: 'Query an AI model with a given prompt',
        inputSchema: {
          model: z.string().describe('The model to use for the query'),
          prompt: z.string().describe('The prompt to send to the model'),
          maxTokens: z.number().optional().describe('Maximum tokens to generate')
        },
        outputSchema: {
          response: z.string(),
          model: z.string(),
          tokens: z.number().optional()
        }
      },
      async ({ model, prompt, maxTokens }: { model: string; prompt: string; maxTokens?: number }) => {
        try {
          const response = await Effect.runPromise(deps.models.query({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens
          }));

          return {
            content: [
              {
                type: 'text',
                text: response.content
              }
            ],
            structuredContent: {
              response: response.content,
              model,
              tokens: response.usage?.total_tokens
            }
          };
        } catch (error) {
          throw new Error(`Model query failed: ${error}`);
        }
      }
    ] as const,
    [
      'list-workflows',
      {
        title: 'List Available Workflows',
        description: 'Get a list of all available workflows',
        inputSchema: {},
        outputSchema: {
          workflows: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string()
          }))
        }
      },
      async () => {
        try {
          const workflows = await Effect.runPromise(deps.workflowEngine.getAvailableWorkflows());
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(workflows, null, 2)
              }
            ],
            structuredContent: { workflows }
          };
        } catch (error) {
          throw new Error(`Failed to list workflows: ${error}`);
        }
      }
    ] as const,
    [
      'list-models',
      {
        title: 'List Available Models',
        description: 'Get a list of all available AI models',
        inputSchema: {},
        outputSchema: {
          models: z.array(z.object({
            id: z.string(),
            name: z.string(),
            provider: z.string()
          }))
        }
      },
      async () => {
        try {
          const models = await Effect.runPromise(deps.models.listModels());
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(models, null, 2)
              }
            ],
            structuredContent: { models }
          };
        } catch (error) {
          throw new Error(`Failed to list models: ${error}`);
        }
      }
    ] as const
  ]);
