import { Effect, Array } from 'effect';
import type { Document, DocumentChunk } from './types';

// Document processor for splitting documents into chunks
export const processDocument = (
  document: Omit<Document, 'chunks'>,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  const content = document.content;

  for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
    const chunkContent = content.slice(i, i + chunkSize);
    const startIndex = i;
    const endIndex = Math.min(i + chunkSize, content.length);

    // Estimate token count (rough approximation)
    const tokenCount = Math.ceil(chunkContent.length / 4);

    chunks.push({
      id: `${document.id}_chunk_${chunks.length}`,
      documentId: document.id,
      content: chunkContent.trim(),
      metadata: {
        startIndex,
        endIndex,
        tokenCount
      }
    });
  }

  return chunks;
};

// Document chunker service
export class DocumentChunker {
  constructor(
    private readonly chunkSize: number = 1000,
    private readonly chunkOverlap: number = 200
  ) {}

  chunkDocument = (document: Omit<Document, 'chunks'>) =>
    Effect.succeed(processDocument(document, this.chunkSize, this.chunkOverlap));

  chunkDocuments = (documents: Omit<Document, 'chunks'>[]) =>
    Effect.forEach(documents, doc => this.chunkDocument(doc)).pipe(
      Effect.map(chunks => chunks.flat())
    );

  // Chunk text content directly
  chunkText = (text: string, metadata: { title?: string; source?: string } = {}) =>
    Effect.gen(this, function* () {
      const tempDoc: Omit<Document, 'chunks'> = {
        id: `temp_${Date.now()}`,
        content: text,
        metadata: {
          timestamp: new Date(),
          ...metadata
        }
      };

      return yield* this.chunkDocument(tempDoc);
    });
}

// Factory function
export const createDocumentChunker = (
  chunkSize?: number,
  chunkOverlap?: number
) => new DocumentChunker(chunkSize, chunkOverlap);
