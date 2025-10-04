// Main exports from mcp module
export * from './types';
export * from './tools';
export * from './resources';
export * from './server';
export * from './transports';
export * from './manager';
export * from './dependencies';

// Re-export Effect and Layer from effect library for convenience
export { Effect, Layer } from 'effect';

// Import Effect and Layer for local use
import { Effect, Layer } from 'effect';

// Import required types and functions for internal use
    import type { MCPServerConfig } from './types';
    import { createMCPServerManager } from './manager';
    import { DefaultMCPServerDeps } from './dependencies';
    
    // Factory function for creating MCP server instances
    export const createMCPServerInstance = (config?: Partial<MCPServerConfig>) => {
      const fullConfig = {
        name: 'ai-sdk-mcp-server',
        version: '1.0.0',
        port: 3000,
        transport: 'both' as const,
        enableJsonResponse: true,
        ...config
      };
    
      return Effect.gen(function* () {
        const serverManager = yield* createMCPServerManager(fullConfig);
        yield* serverManager.start();
      }).pipe(
        Effect.provide(DefaultMCPServerDeps)
      );
    };
    
    // Export server instance for direct usage
    export const mcpServer = createMCPServerInstance();
