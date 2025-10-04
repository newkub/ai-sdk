import { Schema, type Effect, Context } from 'effect';

// Memory types
export type MemoryType = 'short-term' | 'long-term' | 'semantic';

// Memory entry structure
export interface MemoryEntry {
  readonly id: string;
  readonly content: string;
  readonly type: MemoryType;
  readonly metadata: Record<string, any>;
  readonly timestamp: Date;
  readonly importance: number; // 0-1 scale
  readonly tags: string[];
}

// Memory storage interface
export interface MemoryStorage {
  readonly store: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => Effect.Effect<string, never, never>;
  readonly retrieve: (id: string) => Effect.Effect<MemoryEntry | null, never, never>;
  readonly search: (query: string, options?: {
    type?: MemoryType;
    limit?: number;
    tags?: string[];
    minImportance?: number;
  }) => Effect.Effect<MemoryEntry[], never, never>;
  readonly update: (id: string, updates: Partial<Omit<MemoryEntry, 'id' | 'timestamp'>>) => Effect.Effect<void, never, never>;
  readonly delete: (id: string) => Effect.Effect<void, never, never>;
  readonly clear: (type?: MemoryType) => Effect.Effect<void, never, never>;
  readonly getStats: () => Effect.Effect<{
    total: number;
    byType: Record<MemoryType, number>;
  }, never, never>;
}

// Memory manager configuration
export const MemoryConfigSchema = Schema.Struct({
  maxShortTermEntries: Schema.optional(Schema.Number),
  maxLongTermEntries: Schema.optional(Schema.Number),
  persistenceEnabled: Schema.optional(Schema.Boolean),
  storagePath: Schema.optional(Schema.String),
  autoCleanupInterval: Schema.optional(Schema.Number), // in milliseconds
});

export type MemoryConfig = Schema.Schema.Type<typeof MemoryConfigSchema>;

// Dependencies context
export interface MemoryDeps {
  readonly storage: MemoryStorage;
  readonly config: MemoryConfig;
}

export const MemoryDeps = Context.GenericTag<MemoryDeps>('MemoryDeps');
