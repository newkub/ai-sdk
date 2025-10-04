import { Effect, Layer, Config } from 'effect';
import { createRAGServiceFromDeps } from './service';
import type { RAGConfig, Document, RAGQuery } from './types';
import { RAGDeps, RAGConfigSchema } from './types';
import { createOpenAIEmbeddingProvider, createMockEmbeddingProvider } from './embedding';
import { createInMemoryVectorStore } from './vector-store';

// RAG manager layer
export const RAGManagerLayer = Layer.effect(
  RAGDeps,
  Effect.gen(function* () {
    const config = yield* Config.all(RAGConfigSchema);

    // Create dependencies based on config
    const embeddingProvider = config.embeddingProvider === 'openai'
      ? createOpenAIEmbeddingProvider(process.env['OPENAI_API_KEY'] || '')
      : createMockEmbeddingProvider();

    const vectorStore = createInMemoryVectorStore();

    const deps: RAGDeps = {
      embeddingProvider,
      vectorStore,
      config
    };

    return deps;
  })
);

// Convenience functions for RAG operations
export const indexDocument = (document: Omit<Document, 'chunks'>) =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.indexDocument(document);
  });

export const searchDocuments = (query: RAGQuery) =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.search(query);
  });

export const indexText = (
  text: string,
  metadata?: Document['metadata']
) =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.indexText(text, metadata);
  });

export const similaritySearch = (
  query: string,
  topK?: number,
  threshold?: number
) =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.similaritySearch(query, topK, threshold);
  });

export const deleteDocument = (documentId: string) =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.deleteDocument(documentId);
  });

export const getRAGStats = () =>
  Effect.gen(function* () {
    const deps = yield* RAGDeps;
    const ragService = createRAGServiceFromDeps(deps);
    return yield* ragService.getStats();
  });

// Factory function for creating RAG manager instances
export const createRAGManager = () => RAGManagerLayer;
