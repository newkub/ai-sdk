import { Effect } from 'effect';
import type OpenAI from 'openai';
import type { ChatMessage, ChatOptions, ChatResponse } from '../types';

// OpenAI chat completion using composition
export const openaiChatCompletion = (
  client: OpenAI,
  messages: ChatMessage[],
  model: string,
  options: ChatOptions
): Effect.Effect<ChatResponse, never, never> =>
  Effect.async<ChatResponse, never>((resume) => {
    (async () => {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: messages as OpenAI.ChatCompletionMessageParam[],
          temperature: options.temperature ?? null, // Convert undefined to null for OpenAI API
          max_tokens: options.maxTokens ?? null, // Convert undefined to null for OpenAI API
          top_p: options.topP ?? null, // Convert undefined to null for OpenAI API
        });

        const usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};

        if (response.usage?.prompt_tokens !== undefined) {
          usage.promptTokens = response.usage.prompt_tokens;
        }
        if (response.usage?.completion_tokens !== undefined) {
          usage.completionTokens = response.usage.completion_tokens;
        }
        if (response.usage?.total_tokens !== undefined) {
          usage.totalTokens = response.usage.total_tokens;
        }

        const result: ChatResponse = {
          content: response.choices[0]?.message?.content || '',
          usage: Object.keys(usage).length > 0 ? usage as NonNullable<ChatResponse['usage']> : undefined,
        };

        resume(Effect.succeed(result));
      } catch (error) {
        // Convert any errors to defects (uncaught errors)
        resume(Effect.die(error as Error));
      }
    })();
  });

// Get available OpenAI models
export const getOpenAIModels = (): string[] => [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
];

// Validate OpenAI model
export const validateOpenAIModel = (model: string): boolean =>
  getOpenAIModels().includes(model);
