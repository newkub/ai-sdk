import { Effect } from 'effect';
import type { ChatMessage, ChatOptions, ChatResponse } from '../types';

// Gemini client interface
export interface GeminiClient {
  readonly getGenerativeModel: (params: any) => {
    readonly startChat: (params: any) => {
      readonly sendMessage: (message: string) => Promise<any>;
    };
  };
}

// Gemini chat completion using composition
export const geminiChatCompletion = (
  client: GeminiClient,
  messages: ChatMessage[],
  model: string,
  options: ChatOptions
): Effect.Effect<ChatResponse, never, never> =>
  Effect.async<ChatResponse, never>((resume) => {
    (async () => {
      try {
        const geminiModel = client.getGenerativeModel({ model });

        // Convert messages to Gemini format
        const history = messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }));

        const chat = geminiModel.startChat({
          history: history.slice(0, -1), // Exclude the last message for history
        });

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
          throw new Error('Last message must be from user');
        }

        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;

        const usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};

        if (response.usageMetadata?.promptTokenCount !== undefined) {
          usage.promptTokens = response.usageMetadata.promptTokenCount;
        }
        if (response.usageMetadata?.candidatesTokenCount !== undefined) {
          usage.completionTokens = response.usageMetadata.candidatesTokenCount;
        }
        if (response.usageMetadata?.totalTokenCount !== undefined) {
          usage.totalTokens = response.usageMetadata.totalTokenCount;
        }

        const chatResponse: ChatResponse = {
          content: response.candidates?.[0]?.content?.parts?.[0]?.text || '',
          usage: Object.keys(usage).length > 0 ? usage as NonNullable<ChatResponse['usage']> : undefined,
        };

        resume(Effect.succeed(chatResponse));
      } catch (error) {
        // Convert any errors to defects (uncaught errors)
      }
    })();
  });

// Get available Gemini models
export const getGeminiModels = (): string[] => [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
];

// Validate Gemini model
export const validateGeminiModel = (model: string): boolean =>
  getGeminiModels().includes(model);
