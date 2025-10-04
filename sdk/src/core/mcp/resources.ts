import { Effect } from 'effect';
import type { MCPServerDeps, MCPServerConfig } from './types';

// Resource creation using composition
export const createMCPServerResources = (deps: MCPServerDeps, config: MCPServerConfig) =>
  Effect.succeed([
    [
      'system-status',
      'status://system',
      {
        title: 'System Status',
        description: 'Current system status and health information',
        mimeType: 'application/json'
      },
      async (uri: URL) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: config.version,
              uptime: process.uptime()
            })
          }
        ]
      })
    ] as const,
    [
      'workflow-definitions',
      'workflows://definitions',
      {
        title: 'Workflow Definitions',
        description: 'Available workflow definitions and their schemas'
      },
      async (uri: URL) => {
        try {
          const workflows = await Effect.runPromise(deps.workflowEngine.getWorkflowDefinitions());
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(workflows, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to get workflow definitions: ${error}`);
        }
      }
    ] as const,
    [
      'model-capabilities',
      'models://{modelId}/capabilities',
      {
        title: 'Model Capabilities',
        description: 'Capabilities and specifications for a specific model'
      },
      async (uri: URL, { modelId }: { modelId: string }) => {
        try {
          const capabilities = await Effect.runPromise(deps.models.getModelCapabilities(modelId));
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(capabilities, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to get model capabilities: ${error}`);
        }
      }
    ] as const
  ]);
