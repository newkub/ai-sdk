import { Effect } from 'effect';
import type { EmbeddingProvider } from './types';

// OpenAI-compatible embedding provider
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseURL: string = 'https://api.openai.com/v1',
    private readonly model: string = 'text-embedding-3-small'
  ) {}

  generate = (texts: string[]) =>
    Effect.async<number[][], never, never>((resume) => {
      (async () => {
        try {
          const response = await fetch(`${this.baseURL}/embeddings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: texts,
              model: this.model,
              encoding_format: 'float'
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const data = await response.json();

          resume(Effect.succeed(
            data.data.map((item: any) => item.embedding)
          ));
        } catch (error) {
          resume(Effect.die(error as Error));
        }
      })();
    });

  getDimensions = () => {
    // text-embedding-3-small has 1536 dimensions
    // text-embedding-3-large has 3072 dimensions
    return this.model.includes('large') ? 3072 : 1536;
  };
}

// Mock embedding provider for testing
export class MockEmbeddingProvider implements EmbeddingProvider {
  private dimensions = 384; // Common embedding dimension

  generate = (texts: string[]) =>
    Effect.succeed(
      texts.map(text =>
        Array.from({ length: this.dimensions }, () =>
          (Math.random() - 0.5) * 2
        )
      )
    );

  getDimensions = () => this.dimensions;
}

// Factory functions
export const createOpenAIEmbeddingProvider = (
  apiKey: string,
  options?: { baseURL?: string; model?: string }
) => new OpenAIEmbeddingProvider(
  apiKey,
  options?.baseURL,
  options?.model
);

export const createMockEmbeddingProvider = (
  dimensions?: number
) => {
  const provider = new MockEmbeddingProvider();
  if (dimensions) {
    provider['dimensions'] = dimensions;
  }
  return provider;
};
