import { Schema, type Effect, Context } from 'effect';

// Document structure for RAG
export interface Document {
  readonly id: string;
  readonly content: string;
  readonly metadata: {
    readonly title?: string;
    readonly source?: string;
    readonly url?: string;
    readonly timestamp: Date;
    readonly tags?: string[];
    readonly [key: string]: any;
  };
  readonly chunks: DocumentChunk[];
}

// Document chunk for vector storage
export interface DocumentChunk {
  readonly id: string;
  readonly documentId: string;
  readonly content: string;
  readonly embedding?: number[];
  readonly metadata: {
    readonly startIndex: number;
    readonly endIndex: number;
    readonly tokenCount: number;
  };
}

// Search query for RAG
export interface RAGQuery {
  readonly query: string;
  readonly topK?: number;
  readonly threshold?: number;
  readonly filters?: {
    readonly tags?: string[];
    readonly sources?: string[];
    readonly dateRange?: {
      readonly start: Date;
      readonly end: Date;
    };
  };
}

// Search result
export interface RAGResult {
  readonly chunks: Array<{
    readonly chunk: DocumentChunk;
    readonly document: Document;
    readonly score: number;
  }>;
  readonly query: string;
  readonly totalResults: number;
}

// Embedding provider interface
export interface EmbeddingProvider {
  readonly generate: (texts: string[]) => Effect.Effect<number[][], never, never>;
  readonly getDimensions: () => number;
}

// Vector store interface
export interface VectorStore {
  readonly store: (chunks: DocumentChunk[]) => Effect.Effect<void, never, never>;
  readonly search: (queryEmbedding: number[], query: RAGQuery) => Effect.Effect<RAGResult, never, never>;
  readonly delete: (documentId: string) => Effect.Effect<void, never, never>;
  readonly getStats: () => Effect.Effect<{
    totalDocuments: number;
    totalChunks: number;
    indexSize: number;
  }, never, never>;
}

// RAG configuration
export const RAGConfigSchema = Schema.Struct({
  chunkSize: Schema.optional(Schema.Number),
  chunkOverlap: Schema.optional(Schema.Number),
  embeddingProvider: Schema.optional(Schema.String),
  vectorStoreType: Schema.optional(Schema.Literal('in-memory', 'chroma', 'pinecone')),
  topK: Schema.optional(Schema.Number),
  similarityThreshold: Schema.optional(Schema.Number),
  maxTokensPerChunk: Schema.optional(Schema.Number),
});

export type RAGConfig = Schema.Schema.Type<typeof RAGConfigSchema>;

// Dependencies context
export interface RAGDeps {
  readonly embeddingProvider: EmbeddingProvider;
  readonly vectorStore: VectorStore;
  readonly config: RAGConfig;
}

export const RAGDeps = Context.GenericTag<RAGDeps>('RAGDeps');
