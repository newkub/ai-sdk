import { Effect } from 'effect';
import { createServer } from 'http';
import type { MCPServerConfig } from './types';
import { createMCPServerCore } from './server';

// Functional transport implementations using composition

// Pure function to handle HTTP request body parsing
const parseRequestBody = (req: any): Promise<any> =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                resolve(parsedBody);
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });

        req.on('error', reject);
    });

// Pure function to handle MCP request
const handleMCPRequest = (req: any, res: any, body: any) =>
    Effect.sync(() => {
        res.writeHead(200);
        res.end(JSON.stringify({ result: 'MCP HTTP transport not fully implemented' }));
    });

// Pure function to create HTTP request handler
const createHTTPHandler = () =>
    (req: any, res: any) => {
        if (req.method !== 'POST' || req.url !== '/mcp') {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const handleRequest = Effect.tryPromise(() =>
            parseRequestBody(req)
        ).pipe(
            Effect.flatMap(body => handleMCPRequest(req, res, body)),
            Effect.catchAll(error =>
                Effect.sync(() => {
                    res.writeHead(error.message === 'Invalid JSON' ? 400 : 500);
                    res.end(JSON.stringify({ error: error.message }));
                })
            )
        );

        // Handle connection close
        res.on('close', () => {
            // Cleanup if needed
        });

        // Execute the effect (in a real implementation, this would be handled by Effect runtime)
        Effect.runPromise(handleRequest).catch(() => {
            // Error already handled in catchAll above
        });
    };

// Pure function to create stdio transport
const createStdioTransport = () => {
    const close = () => {
        console.log('StdioServerTransport closed');
    };

    return { close };
};

// Pure function to create HTTP transport
const createHTTPTransport = (config: MCPServerConfig) => {
    const port = config.port ?? 3000;
    const handler = createHTTPHandler();

    const server = createServer(handler);

    const start = () =>
        Effect.tryPromise(() =>
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

    const stop = () => {
        server.close(() => {
            console.log('HTTP Server stopped');
        });
    };

    return { server, start, stop };
};

// Pure function to create combined transport (stdio + http)
const createCombinedTransport = (config: MCPServerConfig) => {
    const stdioTransport = createStdioTransport();
    const httpTransport = createHTTPTransport(config);

    const start = () =>
        Effect.gen(function* () {
            yield* httpTransport.start();
            console.log('MCP Server started with both stdio and HTTP transport');
        });

    const stop = () => {
        httpTransport.stop();
        stdioTransport.close();
    };

    return {
        stdio: stdioTransport,
        http: httpTransport.server,
        start,
        stop
    };
};

// Factory function that creates appropriate transport based on config
export const createMCPServer = (config: MCPServerConfig) =>
    Effect.gen(function* () {
        const serverCore = yield* createMCPServerCore(config);

        if (config.transport === 'stdio') {
            const stdioTransport = createStdioTransport();
            yield* Effect.tryPromise(() => serverCore.connect(stdioTransport));
            return { server: serverCore, transport: stdioTransport };
        }

        if (config.transport === 'http') {
            const httpTransport = createHTTPTransport(config);
            yield* Effect.tryPromise(() => serverCore.connect(httpTransport.server));
            return httpTransport.server;
        }

        // Both transports
        const combinedTransport = createCombinedTransport(config);
        yield* Effect.tryPromise(() => serverCore.connect(combinedTransport.stdio));
        return combinedTransport;
    });

// Simplified HTTP transport factory using composition
export const createSimpleHTTPTransport = (config: MCPServerConfig) =>
    Effect.gen(function* () {
        const serverCore = yield* createMCPServerCore(config);
        const httpTransport = createHTTPTransport(config);

        return httpTransport.server;
    });

// Stdio transport factory using composition
export const createStdioTransportFactory = (config: MCPServerConfig) =>
    Effect.gen(function* () {
        const serverCore = yield* createMCPServerCore(config);
        const stdioTransport = createStdioTransport();

        yield* Effect.tryPromise(() => serverCore.connect(stdioTransport));

        return { server: serverCore, transport: stdioTransport };
    });
