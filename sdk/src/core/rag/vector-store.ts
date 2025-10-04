import { Effect, type Array } from 'effect';
import type { DocumentChunk, RAGQuery, RAGResult, VectorStore, Document } from './types';

// Simple cosine similarity calculation
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  if (a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];

    if (aVal === undefined || bVal === undefined) {
      continue;
    }

    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// In-memory vector store implementation using composition
interface VectorStoreState {
  chunks: Map<string, DocumentChunk>;
  documents: Map<string, Set<string>>; // documentId -> chunkIds
}

const createVectorStoreState = (): VectorStoreState => ({
  chunks: new Map<string, DocumentChunk>(),
  documents: new Map<string, Set<string>>(),
});

const store = (state: VectorStoreState) => (chunks: DocumentChunk[]) =>
  Effect.sync(() => {
    chunks.forEach(chunk => {
      state.chunks.set(chunk.id, chunk);

      // Track document chunks
      if (!state.documents.has(chunk.documentId)) {
        state.documents.set(chunk.documentId, new Set());
      }
      state.documents.get(chunk.documentId)!.add(chunk.id);
    });
  });

const search = (state: VectorStoreState) => (queryEmbedding: number[], query: RAGQuery) =>
  Effect.sync(() => {
    const topK = query.topK ?? 5;
    const threshold = query.threshold ?? 0.7;

    // Calculate similarities for all chunks
    const similarities: Array<{
      chunk: DocumentChunk;
      document: Document;
      score: number;
    }> = [];

    for (const chunk of state.chunks.values()) {
      if (!chunk.embedding) continue;

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      if (similarity >= threshold) {
        similarities.push({
          chunk,
          document: {
            id: chunk.documentId,
            content: '', // We don't store full document content here
            metadata: { timestamp: new Date() } as Document['metadata'],
            chunks: []
          } as Document,
          score: similarity
        });
      }
    }

    // Sort by similarity and apply filters
    const filteredResults = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      chunks: filteredResults,
      query: query.query,
      totalResults: similarities.length
    };
  });

const deleteDocument = (state: VectorStoreState) => (documentId: string) =>
  Effect.sync(() => {
    const chunkIds = state.documents.get(documentId);
    if (!chunkIds) return;

    chunkIds.forEach(chunkId => {
      state.chunks.delete(chunkId);
    });
    state.documents.delete(documentId);
  });

const getStats = (state: VectorStoreState) => () =>
  Effect.sync(() => ({
    totalDocuments: state.documents.size,
    totalChunks: state.chunks.size,
    indexSize: state.chunks.size * 384 * 4 // Rough estimate in bytes
  }));

// Factory function
export const createInMemoryVectorStore = (): VectorStore => {
  const state = createVectorStoreState();

  return {
    store: store(state),
    search: search(state),
    delete: deleteDocument(state),
    getStats: getStats(state),
  };
};
