import { Effect } from 'effect';
import type { MCPServerConfig } from './types';
import { MCPServerDeps } from './types';
import { createMCPServerTools } from './tools';
import { createMCPServerResources } from './resources';

// Simplified MCP types for compatibility
interface McpServer {
  registerTool: (name: string, config: any, handler: Function) => void;
  registerResource: (name: string, uri: string, config: any, handler: Function) => void;
  connect: (transport: any) => Promise<void>;
}

// Core MCP server factory using composition
export const createMCPServerCore = (config: MCPServerConfig) =>
  Effect.gen(function* () {
    const deps = yield* MCPServerDeps;

    // Create MCP server instance (simplified for now)
    const server = {
      registerTool: (name: string, config: any, handler: Function) => {
        console.log(`Registered tool: ${name}`);
      },
      registerResource: (name: string, uri: string, config: any, handler: Function) => {
        console.log(`Registered resource: ${name} at ${uri}`);
      },
      connect: async (transport: any) => {
        console.log('Connected server to transport');
      }
    };

    // Tool registration using composition
    const tools = yield* createMCPServerTools(deps);
    const resources = yield* createMCPServerResources(deps, config);

    // Register all tools and resources
    yield* Effect.forEach(tools, (tool: readonly [string, any, Function]) => Effect.sync(() => server.registerTool(tool[0], tool[1], tool[2])));
    yield* Effect.forEach(resources, (resource: readonly [string, string, any, Function]) => Effect.sync(() => server.registerResource(resource[0], resource[1], resource[2], resource[3])));

    return server;
  });
