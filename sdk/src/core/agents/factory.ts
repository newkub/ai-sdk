import { Effect, Layer } from 'effect';
import type { ChatMessage, ChatOptions, ChatResponse, ModelConfig } from '../models/types';
import type { AgentConfig } from './types';
import { makeAgentService } from './service';
import { AgentDeps } from './service';

// Simple chat completion function for backward compatibility
const simpleChatCompletion = async (messages: ChatMessage[], config: ModelConfig, options: ChatOptions = {}): Promise<ChatResponse> => {
  // This is a placeholder implementation
  // In a real implementation, this would use the new Effect-based service
  return {
    content: `Mock response for: ${messages[messages.length - 1]?.content || 'empty message'}`,
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
};

// Agent factory using Effect layers
export const createAgent = (config: AgentConfig) =>
  Layer.provide(makeAgentService(config), Layer.succeed(AgentDeps, {
    chatCompletion: (messages, modelConfig, options) => Effect.async<ChatResponse, never>((resume) => {
      (async () => {
        try {
          const result = await simpleChatCompletion(messages, modelConfig, options);
          resume(Effect.succeed(result));
        } catch (error) {
          resume(Effect.die(error as Error));
        }
      })();
    })
  }));

// Predefined agent creators
export const createDefaultAgent = (provider: 'openai' | 'anthropic' | 'gemini' = 'openai') => {
  const modelMap = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-latest',
    gemini: 'gemini-1.5-pro'
  };

  const config: AgentConfig = {
    name: 'Default Assistant',
    role: 'a helpful AI assistant',
    systemPrompt: 'You are a helpful AI assistant. Provide clear and concise responses.',
    modelConfig: {
      provider,
      model: modelMap[provider]
    },
    temperature: 0.7
  };

  return createAgent(config);
};

export const createCodingAgent = (provider: 'openai' | 'anthropic' | 'gemini' = 'openai') => {
  const modelMap = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-latest',
    gemini: 'gemini-1.5-pro'
  };

  const config: AgentConfig = {
    name: 'Coding Assistant',
    role: 'an expert programming assistant',
    systemPrompt: `You are an expert programming assistant. Help users with:
1. Writing code in various programming languages
2. Debugging and fixing code issues
3. Explaining complex programming concepts
4. Code optimization and best practices
5. System design and architecture

Always provide clear, well-documented code examples when appropriate.`,
    modelConfig: {
      provider,
      model: modelMap[provider]
    },
    temperature: 0.5,
    maxTokens: 2000
  };

  return createAgent(config);
};

export const createResearchAgent = (provider: 'openai' | 'anthropic' | 'gemini' = 'openai') => {
  const modelMap = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-opus-latest',
    gemini: 'gemini-1.5-pro'
  };

  const config: AgentConfig = {
    name: 'Research Assistant',
    role: 'an expert research assistant',
    systemPrompt: `You are an expert research assistant. Help users with:
1. Analyzing complex topics and providing insights
2. Summarizing information from multiple sources
3. Identifying key points and trends
4. Providing evidence-based recommendations
5. Structuring research findings

Always cite sources when possible and maintain academic rigor.`,
    modelConfig: {
      provider,
      model: modelMap[provider]
    },
    temperature: 0.3,
    maxTokens: 3000
  };

  return createAgent(config);
};
