import { Effect } from 'effect';
import type Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, ChatOptions, ChatResponse } from '../types';

// Anthropic chat completion using composition
export const anthropicChatCompletion = (
  client: Anthropic,
  messages: ChatMessage[],
  model: string,
  options: ChatOptions
): Effect.Effect<ChatResponse, never, never> =>
  Effect.async<ChatResponse, never>((resume) => {
    (async () => {
      try {
        // Filter out system messages and handle them separately
        const systemMessage = messages.find(msg => msg.role === 'system');
        const nonSystemMessages = messages.filter(msg => msg.role !== 'system');

        // Prepare the API call parameters
        const apiParams: any = {
          model,
          messages: nonSystemMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })) as Anthropic.MessageParam[],
          temperature: options.temperature,
          max_tokens: options.maxTokens || 1024,
          top_p: options.topP,
        };

        // Only add system if it exists and has content
        if (systemMessage?.content) {
          apiParams.system = systemMessage.content;
        }

        // Merge in any additional options
        Object.assign(apiParams, options);

        const response = await client.messages.create(apiParams);

        // Fix the response handling
        let content = '';
        if (response.content && response.content.length > 0) {
          const firstBlock = response.content[0];
          if (firstBlock && 'text' in firstBlock) {
            content = firstBlock.text;
          }
        }

        const result: ChatResponse = {
          content: content || '',
          usage: {
            promptTokens: response.usage?.input_tokens,
            completionTokens: response.usage?.output_tokens,
            totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
          },
        };

        resume(Effect.succeed(result));
      } catch (error) {
        // Convert any errors to defects (uncaught errors)
        resume(Effect.die(error as Error));
      }
    })();
  });

// Get available Anthropic models
export const getAnthropicModels = (): string[] => [
  'claude-3-5-sonnet-latest',
  'claude-3-opus-latest',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
];

// Validate Anthropic model
export const validateAnthropicModel = (model: string): boolean =>
  getAnthropicModels().includes(model);
