import { Effect, Array, Schedule, Fiber } from 'effect';
import type { MemoryEntry, MemoryDeps, MemoryConfig, MemoryType } from './types';
import { createInMemoryStorage } from './storage';

// Memory service implementation using composition
interface MemoryServiceMethods {
  store: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => Effect.Effect<string, never, never>;
  retrieve: (id: string) => Effect.Effect<MemoryEntry | null, never, never>;
  search: (query: string, options?: {
    type?: MemoryType;
    limit?: number;
    tags?: string[];
    minImportance?: number;
  }) => Effect.Effect<MemoryEntry[], never, never>;
  storeWithImportance: (
    content: string,
    type?: MemoryType,
    metadata?: Record<string, any>,
    baseImportance?: number
  ) => Effect.Effect<string, never, never>;
  getStats: () => Effect.Effect<{
    total: number;
    byType: Record<MemoryType, number>;
  }, never, never>;
  startAutoCleanup: () => Effect.Effect<void, never, never>;
  batchStore: (entries: Omit<MemoryEntry, 'id' | 'timestamp'>[]) => Effect.Effect<string[], never, never>;
  batchRetrieve: (ids: string[]) => Effect.Effect<(MemoryEntry | null)[], never, never>;
  consolidateMemories: () => Effect.Effect<number, never, never>;
}

const createMemoryServiceFromDeps = (deps: MemoryDeps): MemoryServiceMethods => {
  const store = (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) =>
    deps.storage.store(entry);

  const retrieve = (id: string) =>
    deps.storage.retrieve(id);

  const search = (query: string, options?: {
    type?: MemoryType;
    limit?: number;
    tags?: string[];
    minImportance?: number;
  }) =>
    deps.storage.search(query, options);

  const storeWithImportance = (
    content: string,
    type: MemoryType = 'short-term',
    metadata: Record<string, any> = {},
    baseImportance: number = 0.5
  ) =>
    Effect.gen(function* () {
      // Simple importance calculation based on content length and metadata
      const calculatedImportance = Math.min(1, Math.max(0,
        baseImportance +
        (content.length / 1000) * 0.1 +
        (Object.keys(metadata).length * 0.05)
      ));

      const entry = {
        content,
        type,
        metadata,
        importance: calculatedImportance,
        tags: (metadata as any).tags || []
      };

      return yield* store(entry);
    });

  const getStats = () =>
    deps.storage.getStats();

  const startAutoCleanup = () =>
    Effect.gen(function* () {
      const config = deps.config;

      if (!config.autoCleanupInterval || !config.maxShortTermEntries) {
        return Effect.void;
      }

      const cleanupSchedule = Schedule.spaced(config.autoCleanupInterval);

      return yield* Effect.schedule(
        Effect.gen(function* () {
          const stats = yield* getStats();

          if (stats.byType['short-term'] > config.maxShortTermEntries!) {
            // Get oldest short-term memories and remove them
            const shortTermMemories = yield* search('', {
              type: 'short-term',
              limit: stats.byType['short-term'] - config.maxShortTermEntries!
            });

            yield* Effect.forEach(shortTermMemories, memory =>
              deps.storage.delete(memory.id)
            );
          }
        }),
        cleanupSchedule
      );
    });

  const batchStore = (entries: Omit<MemoryEntry, 'id' | 'timestamp'>[]) =>
    Effect.forEach(entries, entry => store(entry));

  const batchRetrieve = (ids: string[]) =>
    Effect.forEach(ids, id => retrieve(id));

  const consolidateMemories = () =>
    Effect.gen(function* () {
      const shortTermMemories = yield* search('', {
        type: 'short-term',
        minImportance: 0.8,
        limit: 100
      });

      // Convert high-importance short-term memories to long-term
      yield* Effect.forEach(shortTermMemories, memory =>
        Effect.gen(function* () {
          yield* deps.storage.delete(memory.id);
          yield* store({
            ...memory,
            type: 'long-term' as const,
            importance: Math.min(1, memory.importance + 0.1)
          });
        })
      );

      return shortTermMemories.length;
    });

  return {
    store,
    retrieve,
    search,
    storeWithImportance,
    getStats,
    startAutoCleanup,
    batchStore,
    batchRetrieve,
    consolidateMemories,
  };
};

// Factory function for memory service
export const createMemoryService = (config?: Partial<MemoryConfig>) => {
  const fullConfig: MemoryConfig = {
    maxShortTermEntries: 1000,
    maxLongTermEntries: 10000,
    persistenceEnabled: false,
    storagePath: './data/memory',
    autoCleanupInterval: 300000, // 5 minutes
    ...config
  };

  const storage = createInMemoryStorage();
  const deps: MemoryDeps = { storage, config: fullConfig };

  return createMemoryServiceFromDeps(deps);
};

export { createMemoryServiceFromDeps };
