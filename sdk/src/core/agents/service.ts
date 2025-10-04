import { Effect, Context, Layer, Ref } from 'effect';
import type { ModelConfig, ChatMessage, ChatOptions, ChatResponse } from '../models/types';
import type { AgentConfig, AgentContext, AgentResponse, AgentService } from './types';
import { createAgentStateRef, getAgentConfig, setAgentContext, getAgentContext, clearAgentContext } from './state';

// Agent service context
export const AgentServiceContext = Context.GenericTag<AgentService>('AgentService');

// Agent dependencies interface
export interface AgentDeps {
  readonly chatCompletion: (messages: ChatMessage[], config: ModelConfig, options?: ChatOptions) => Effect.Effect<ChatResponse, never, never>;
}

// Agent dependencies context
export const AgentDeps = Context.GenericTag<AgentDeps>('AgentDeps');

// Helper function to prepare messages
const prepareMessages = (
  config: AgentConfig,
  context: AgentContext,
  message: string | ChatMessage[]
): Effect.Effect<ChatMessage[], never, never> =>
  Effect.sync(() => {
    const messages: ChatMessage[] = [];

    // Add system prompt if provided
    if (config.systemPrompt) {
      messages.push({
        role: 'system',
        content: config.systemPrompt
      });
    }

    // Add context information
    if (context && Object.keys(context).length > 0) {
      const contextInfo = `\nContext Information:\n${JSON.stringify(context, null, 2)}`;
      if (messages.length > 0 && messages[0]?.role === 'system') {
        // Create a new message instead of modifying readonly content
        messages.push({
          role: 'system',
          content: messages[0].content + contextInfo
        });
        // Remove the original system message
        messages.shift();
      } else {
        messages.push({
          role: 'system',
          content: `You are ${config.role}. ${contextInfo}`
        });
      }
    }

    // Add user message(s)
    if (typeof message === 'string') {
      messages.push({
        role: 'user',
        content: message
      });
    } else {
      messages.push(...message);
    }

    return messages;
  });

// Agent service implementation
export const makeAgentService = (config: AgentConfig): Layer.Layer<AgentService, never, AgentDeps> =>
  Layer.effect(
    AgentServiceContext,
    Effect.gen(function* () {
      const deps = yield* AgentDeps;
      const stateRef = yield* createAgentStateRef(config);

      return {
        getConfig: () => getAgentConfig(stateRef),
        setContext: (newContext: AgentContext) => setAgentContext(stateRef, newContext),
        getContext: () => getAgentContext(stateRef),
        clearContext: () => clearAgentContext(stateRef),
        chat: (message: string | ChatMessage[], options: ChatOptions = {}) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const { config, context } = state;

            // Prepare messages using Effect
            const messages = yield* prepareMessages(config, context, message);

            // Merge options
            const chatOptions = {
              ...(config.temperature !== undefined && { temperature: config.temperature }),
              ...(config.maxTokens !== undefined && { maxTokens: config.maxTokens }),
              ...options
            };

            // Execute chat completion
            const response = yield* deps.chatCompletion(messages, config.modelConfig, chatOptions);

            return {
              ...response,
              agentName: config.name,
              timestamp: new Date()
            };
          }),
        streamChat: (message: string | ChatMessage[], options: ChatOptions = {}) =>
          Effect.never
      };
    })
  );
