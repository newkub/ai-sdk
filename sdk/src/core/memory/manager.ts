import { Effect, Layer, Context } from 'effect';
import { createMemoryServiceFromDeps } from './service';
import type { MemoryConfig, MemoryType, MemoryEntry } from './types';
import { MemoryDeps } from './types';
import { createInMemoryStorage } from './storage';

// Memory manager layer - using scoped approach
export const MemoryManagerLayer = Layer.scoped(
  MemoryDeps,
  Effect.gen(function* () {
    const config: MemoryConfig = {
      maxShortTermEntries: 1000,
      maxLongTermEntries: 10000,
      persistenceEnabled: false,
      storagePath: './data/memory',
      autoCleanupInterval: 300000, // 5 minutes
    };

    const storage = createInMemoryStorage();
    const deps: MemoryDeps = { storage, config };
    return deps;
  })
);

// Convenience functions for memory operations
export const storeMemory = (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.store(entry);
  });

export const retrieveMemory = (id: string) =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.retrieve(id);
  });

export const searchMemories = (
  query: string,
  options?: {
    type?: MemoryType;
    limit?: number;
    tags?: string[];
    minImportance?: number;
  }
) =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.search(query, options);
  });

export const storeMemoryWithImportance = (
  content: string,
  type?: MemoryType,
  metadata?: Record<string, any>,
  baseImportance?: number
) =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.storeWithImportance(content, type, metadata, baseImportance);
  });

export const getMemoryStats = () =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.getStats();
  });

export const consolidateMemories = () =>
  Effect.gen(function* () {
    const deps = yield* MemoryDeps;
    const service = createMemoryServiceFromDeps(deps);
    return yield* service.consolidateMemories();
  });

export const createMemoryManager = (config?: Partial<MemoryConfig>) =>
  Layer.provide(
    MemoryManagerLayer,
    Layer.effect(
      Context.GenericTag<MemoryConfig>('MemoryConfig'),
      Effect.succeed({
        maxShortTermEntries: 1000,
        maxLongTermEntries: 10000,
        persistenceEnabled: false,
        storagePath: './data/memory',
        autoCleanupInterval: 300000, // 5 minutes
        ...config
      } as MemoryConfig)
    )
  );
