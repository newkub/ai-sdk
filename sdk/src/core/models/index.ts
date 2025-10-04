// Main exports from models module
export * from './types';
export * from './clients';
export * from './utils';
export * from './service';

// Provider-specific exports
export * from './providers/openai';
export * from './providers/anthropic';
export * from './providers/gemini';

// For backward compatibility, also export the main service layer
export { ModelServiceLayer } from './service';

// Create a chatCompletion function for backward compatibility
import type { ChatMessage, ChatOptions, ChatResponse, ModelConfig } from './types';

export const chatCompletion = async (
  messages: ChatMessage[],
  config: ModelConfig,
  options: ChatOptions = {}
): Promise<ChatResponse> => {
  // This is a simplified version for backward compatibility
  // In a real implementation, this would use the Effect service
  return {
    content: 'Chat completion not implemented in new structure',
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
};

// Default export for easy importing
export { useModels } from './service';
