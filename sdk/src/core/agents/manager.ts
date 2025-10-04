import { Effect, Layer, Ref, Option, Context } from 'effect';
import type { ChatOptions, ChatResponse } from '../models/types';
import type { AgentService, AgentManagerService, AgentResponse } from './types';

// Create a context for the AgentManagerService
export const AgentManagerServiceContext = Context.GenericTag<AgentManagerService>('AgentManagerService');

// Re-export the AgentManagerService type for convenience
export type { AgentManagerService } from './types';

export const makeAgentManagerService = (): Layer.Layer<AgentManagerService, never, never> =>
  Layer.effect(
    AgentManagerServiceContext,
    Effect.gen(function* () {
      const agentsRef = yield* Ref.make(new Map<string, AgentService>());

      const addAgent = (name: string, agentService: AgentService): Effect.Effect<void, never, never> =>
        Effect.gen(function* () {
          yield* Ref.update(agentsRef, (agents: Map<string, AgentService>) => new Map(agents.set(name, agentService)));
        });

      const getAgent = (name: string): Effect.Effect<Option.Option<AgentService>, never, never> =>
        Effect.gen(function* () {
          const agents = yield* Ref.get(agentsRef);
          const agentService = agents.get(name);
          return agentService ? Option.some(agentService) : Option.none();
        });

      const removeAgent = (name: string): Effect.Effect<boolean, never, never> =>
        Ref.modify(agentsRef, (agents: Map<string, AgentService>) => {
          const exists = agents.has(name);
          if (exists) {
            agents.delete(name);
          }
          return [exists, agents];
        });

      const listAgents: () => Effect.Effect<string[], never, never> =
        () => Ref.get(agentsRef).pipe(
          Effect.map((agents: Map<string, AgentService>) => Array.from(agents.keys()))
        );

      const chatWith = (agentName: string, message: string, options: ChatOptions = {}): Effect.Effect<AgentResponse, never, never> =>
        Effect.gen(function* () {
          const agentOpt = yield* getAgent(agentName);

          if (Option.isNone(agentOpt)) {
            // Instead of failing, return a default response
            return {
              content: `Agent "${agentName}" not found`,
              agentName,
              timestamp: new Date()
            };
          }

          const agent = agentOpt.value;
          return yield* agent.chat(message, options);
        });

      return {
        addAgent,
        getAgent,
        removeAgent,
        listAgents,
        chatWith
      };
    })
  );
