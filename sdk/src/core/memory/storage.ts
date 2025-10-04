import { Effect, Option } from 'effect';
import type { MemoryEntry, MemoryStorage, MemoryType } from './types';

// In-memory storage implementation using composition
interface InMemoryStorageState {
  memories: Map<string, MemoryEntry>;
  idCounter: number;
}

const createInMemoryStorageState = (): InMemoryStorageState => ({
  memories: new Map<string, MemoryEntry>(),
  idCounter: 0,
});

const store = (state: InMemoryStorageState) => (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) =>
  Effect.sync(() => {
    const id = `mem_${++state.idCounter}`;
    const memoryEntry: MemoryEntry = {
      ...entry,
      id,
      timestamp: new Date()
    };
    state.memories.set(id, memoryEntry);
    return id;
  });

const retrieve = (state: InMemoryStorageState) => (id: string) =>
  Effect.sync(() => {
    const entry = state.memories.get(id);
    if (!entry) return null;
    return { ...entry, timestamp: new Date(entry.timestamp) };
  });

const search = (state: InMemoryStorageState) => (query: string, options?: {
  type?: MemoryType;
  limit?: number;
  tags?: string[];
  minImportance?: number;
}) =>
  Effect.sync(() => {
    const limit = options?.limit ?? 10;
    const minImportance = options?.minImportance ?? 0;

    return Array.from(state.memories.values())
      .filter((entry: MemoryEntry) => {
        // Filter by type
        if (options?.type && entry.type !== options.type) return false;

        // Filter by importance
        if (entry.importance < minImportance) return false;

        // Filter by tags
        if (options?.tags && options.tags.length > 0) {
          const hasMatchingTag = options.tags.some(tag =>
            entry.tags.includes(tag)
          );
          if (!hasMatchingTag) return false;
        }

        // Simple text search in content and metadata
        const searchText = `${entry.content} ${JSON.stringify(entry.metadata)}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
      .sort((a: MemoryEntry, b: MemoryEntry) => b.importance - a.importance || b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map((entry: MemoryEntry) => ({ ...entry, timestamp: new Date(entry.timestamp) }));
  });

const update = (state: InMemoryStorageState) => (id: string, updates: Partial<Omit<MemoryEntry, 'id' | 'timestamp'>>) =>
  Effect.sync(() => {
    const existing = state.memories.get(id);
    if (!existing) return;

    const updated: MemoryEntry = {
      ...existing,
      ...updates,
      timestamp: new Date()
    };
    state.memories.set(id, updated);
  });

const deleteMemory = (state: InMemoryStorageState) => (id: string) =>
  Effect.sync(() => {
    state.memories.delete(id);
  });

const clear = (state: InMemoryStorageState) => (type?: MemoryType) =>
  Effect.sync(() => {
    if (type) {
      for (const [id, entry] of state.memories.entries()) {
        if (entry.type === type) {
          state.memories.delete(id);
        }
      }
    } else {
      state.memories.clear();
    }
  });

const getStats = (state: InMemoryStorageState) => () =>
  Effect.sync(() => {
    const entries = Array.from(state.memories.values());
    const byType = entries.reduce((acc: Record<MemoryType, number>, entry: MemoryEntry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<MemoryType, number>);

    return {
      total: entries.length,
      byType: {
        'short-term': byType['short-term'] || 0,
        'long-term': byType['long-term'] || 0,
        'semantic': byType['semantic'] || 0
      }
    };
  });

// Factory function for in-memory storage
export const createInMemoryStorage = (): MemoryStorage => {
  const state = createInMemoryStorageState();

  return {
    store: store(state),
    retrieve: retrieve(state),
    search: search(state),
    update: update(state),
    delete: deleteMemory(state),
    clear: clear(state),
    getStats: getStats(state),
  };
};
