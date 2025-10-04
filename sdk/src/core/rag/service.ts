import { Effect, Array } from 'effect';
import type { Document, DocumentChunk, RAGQuery, RAGResult, RAGDeps, RAGConfig } from './types';
import { createDocumentChunker } from './chunking';
import { createInMemoryVectorStore } from './vector-store';
import { createOpenAIEmbeddingProvider, createMockEmbeddingProvider } from './embedding';

// RAG service implementation using composition
interface RAGServiceMethods {
  indexDocument: (document: Omit<Document, 'chunks'>) => Effect.Effect<number, never, never>;
  indexDocuments: (documents: Omit<Document, 'chunks'>[]) => Effect.Effect<number, never, never>;
  search: (query: RAGQuery) => Effect.Effect<RAGResult, never, never>;
  deleteDocument: (documentId: string) => Effect.Effect<void, never, never>;
  getStats: () => Effect.Effect<{
    totalDocuments: number;
    totalChunks: number;
    indexSize: number;
  }, never, never>;
  indexText: (text: string, metadata?: Document['metadata']) => Effect.Effect<number, never, never>;
  batchSearch: (queries: RAGQuery[]) => Effect.Effect<RAGResult[], never, never>;
  similaritySearch: (query: string, topK?: number, threshold?: number) => Effect.Effect<RAGResult, never, never>;
  filteredSearch: (query: string, filters?: RAGQuery['filters'], topK?: number) => Effect.Effect<RAGResult, never, never>;
}

const createRAGServiceFromDeps = (deps: RAGDeps): RAGServiceMethods => {
  const chunker = createDocumentChunker();

  const indexDocument = (document: Omit<Document, 'chunks'>) =>
    Effect.gen(function* () {
      // Split document into chunks
      const chunks = yield* chunker.chunkDocument(document);

      // Generate embeddings for chunks
      const texts = chunks.map(chunk => chunk.content);
      const embeddingsResult = yield* deps.embeddingProvider.generate(texts);
      const embeddings: number[][] = embeddingsResult as number[][];

      // Add embeddings to chunks
      const chunksWithEmbeddings: DocumentChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index] || []
      }));

      // Store in vector store
      yield* deps.vectorStore.store(chunksWithEmbeddings);

      return chunksWithEmbeddings.length;
    });

  const indexDocuments = (documents: Omit<Document, 'chunks'>[]) =>
    Effect.forEach(documents, doc => indexDocument(doc)).pipe(
      Effect.map(results => results.reduce((sum, count) => sum + count, 0))
    );

  const search = (query: RAGQuery) =>
    Effect.gen(function* () {
      // Generate embedding for query
      const queryEmbedding = yield* deps.embeddingProvider.generate([query.query]).pipe(
        Effect.map(embeddings => embeddings[0] || [])
      );

      // Search vector store
      return yield* deps.vectorStore.search(queryEmbedding, query);
    });

  const deleteDocument = (documentId: string) =>
    deps.vectorStore.delete(documentId);

  const getStats = () =>
    deps.vectorStore.getStats();

  const indexText = (
    text: string,
    metadata: Document['metadata'] = { timestamp: new Date() }
  ) =>
    Effect.gen(function* () {
      const document: Omit<Document, 'chunks'> = {
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: text,
        metadata
      };

      return yield* indexDocument(document);
    });

  const batchSearch = (queries: RAGQuery[]) =>
    Effect.forEach(queries, query => search(query));

  const similaritySearch = (query: string, topK?: number, threshold?: number) =>
    search({
      query,
      ...(topK !== undefined && { topK }),
      ...(threshold !== undefined && { threshold })
    });

  const filteredSearch = (
    query: string,
    filters?: RAGQuery['filters'],
    topK?: number
  ) =>
    search({
      query,
      ...(filters && { filters }),
      ...(topK !== undefined && { topK })
    });

  return {
    indexDocument,
    indexDocuments,
    search,
    deleteDocument,
    getStats,
    indexText,
    batchSearch,
    similaritySearch,
    filteredSearch,
  };
};

// Factory function for RAG service
export const createRAGService = (config?: Partial<RAGConfig>) => {
  const fullConfig: RAGConfig = {
    chunkSize: 1000,
    chunkOverlap: 200,
    embeddingProvider: 'mock',
    vectorStoreType: 'in-memory',
    topK: 5,
    similarityThreshold: 0.7,
    maxTokensPerChunk: 512,
    ...config
  };

  // Create dependencies based on config
  const embeddingProvider = fullConfig.embeddingProvider === 'openai'
    ? createOpenAIEmbeddingProvider(process.env['OPENAI_API_KEY'] || '')
    : createMockEmbeddingProvider();

  const vectorStore = createInMemoryVectorStore();

  const deps: RAGDeps = {
    embeddingProvider,
    vectorStore,
    config: fullConfig
  };

  return createRAGServiceFromDeps(deps);
};

export { createRAGServiceFromDeps };
