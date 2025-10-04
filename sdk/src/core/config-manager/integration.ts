import { Effect, Layer, Context } from 'effect';
import {
  getAppConfig,
  getMCPConfig,
  getMemoryConfig,
  getRAGConfig,
  ConfigManagerLayer
} from './manager';
import type { MCPServerConfig } from '../mcp/types';
import type { MemoryConfig } from '../memory/types';
import type { RAGConfig } from '../rag/types';

// Create context tags for each module configuration
const MCPServerConfigContext = Context.GenericTag<MCPServerConfig>('MCPServerConfigContext');
const MemoryConfigTag = Context.GenericTag<MemoryConfig>('MemoryConfigTag');
const RAGConfigTag = Context.GenericTag<RAGConfig>('RAGConfigTag');

// Export the context tags for use in other modules
export type { MemoryConfig, RAGConfig };

// Example: MCP module integration
export const createMCPConfigLayer = Layer.effect(
  MCPServerConfigContext,
  Effect.gen(function* () {
    const mcpConfig = yield* getMCPConfig();
    return mcpConfig;
  })
);

// Example: Memory module integration
export const createMemoryConfigLayer = Layer.effect(
  MemoryConfigTag,
  Effect.gen(function* () {
    const memoryConfig = yield* getMemoryConfig();
    return memoryConfig;
  })
);

// Example: RAG module integration
export const createRAGConfigLayer = Layer.effect(
  RAGConfigTag,
  Effect.gen(function* () {
    const ragConfig = yield* getRAGConfig();
    return ragConfig;
  })
);

// Example: Complete application layer with all configurations
export const createAppLayer = () =>
  Layer.mergeAll(
    ConfigManagerLayer,
    createMCPConfigLayer,
    createMemoryConfigLayer,
    createRAGConfigLayer
  );
