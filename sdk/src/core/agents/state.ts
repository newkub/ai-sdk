import { Effect, Ref } from 'effect';
import type { AgentConfig, AgentContext, AgentState } from './types';

// Create agent state
export const makeAgentState = (config: AgentConfig): AgentState => ({
  config,
  context: {}
});

// State management using Effect.Ref
export const createAgentStateRef = (config: AgentConfig) =>
  Ref.make(makeAgentState(config));

// State operations
export const getAgentConfig = (stateRef: Ref.Ref<AgentState>) =>
  Ref.get(stateRef).pipe(
    Effect.map((state: AgentState) => state.config)
  );

export const setAgentContext = (stateRef: Ref.Ref<AgentState>, newContext: AgentContext) =>
  Ref.update(stateRef, (state: AgentState) => ({
    ...state,
    context: { ...state.context, ...newContext }
  }));

export const getAgentContext = (stateRef: Ref.Ref<AgentState>) =>
  Ref.get(stateRef).pipe(
    Effect.map((state: AgentState) => ({ ...state.context }))
  );

export const clearAgentContext = (stateRef: Ref.Ref<AgentState>) =>
  Ref.update(stateRef, (state: AgentState) => ({
    ...state,
    context: {}
  }));
