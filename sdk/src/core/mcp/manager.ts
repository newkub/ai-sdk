import { Effect } from 'effect';
import type { MCPServerConfig } from './types';
import { createMCPServer } from './transports';

// Server state management using composition
interface ServerState {
  readonly server: any;
  readonly config: MCPServerConfig;
  readonly isRunning: boolean;
}

const createServerState = (server: any, config: MCPServerConfig): ServerState => ({
  server,
  config,
  isRunning: false
});

// Pure functions for server lifecycle management
export const createServerLifecycle = (config: MCPServerConfig) =>
  Effect.gen(function* () {
    const server = yield* createMCPServer(config);
    const initialState = createServerState(server, config);

    // Pure function to start server based on transport type
    const startServer = (state: ServerState) =>
      Effect.gen(function* () {
        if (state.isRunning) {
          return state;
        }

        const { server, config } = state;

        if (config.transport === 'stdio') {
          console.log('MCP Server started with stdio transport');
          return { ...state, isRunning: true };
        }

        if (config.transport === 'http') {
          const port = config.port ?? 3000;

          yield* Effect.tryPromise(() =>
            new Promise<void>((resolve, reject) => {
              server.listen(port, () => {
                console.log(`MCP Server running on http://localhost:${port}/mcp`);
                resolve();
              });

              server.on('error', (error: any) => {
                console.error('Server error:', error);
                reject(error);
              });
            })
          );

          return { ...state, isRunning: true };
        }

        // Both transports
        const serverResult = server as any;

        if (serverResult.start) {
          yield* serverResult.start();
        }

        console.log('MCP Server started with both stdio and HTTP transport');
        return { ...state, isRunning: true };
      });

    // Pure function to stop server
    const stopServer = (state: ServerState) =>
      Effect.sync(() => {
        if (!state.isRunning) {
          return state;
        }

        const { server, config } = state;

        if (config.transport === 'stdio') {
          console.log('MCP Server stopped');
          return { ...state, isRunning: false };
        }

        if (config.transport === 'http') {
          server.close(() => {
            console.log('MCP Server stopped');
          });
          return { ...state, isRunning: false };
        }

        // Both transports
        const serverResult = server as any;
        if (serverResult.stop) {
          serverResult.stop();
        }

        return { ...state, isRunning: false };
      });

    // Function to get current server status
    const getServerStatus = (state: ServerState) => () =>
      Effect.sync(() => ({
        isRunning: state.isRunning,
        transport: config.transport,
        port: config.port,
        server: state.server
      }));

    return {
      startServer,
      stopServer,
      getServerStatus,
      initialState
    };
  });

// Main factory function using composition
export const createMCPServerManager = (config: MCPServerConfig) =>
  Effect.gen(function* () {
    const { startServer, stopServer, getServerStatus, initialState } =
      yield* createServerLifecycle(config);

    // Return composable functions instead of object with methods
    return {
      start: () => Effect.gen(function* () {
        const state = yield* startServer(initialState);
        return state;
      }),
      stop: () => Effect.gen(function* () {
        const state = yield* stopServer(initialState);
        return state;
      }),
      status: getServerStatus(initialState),
      server: initialState.server,
      config: initialState.config
    };
  });
