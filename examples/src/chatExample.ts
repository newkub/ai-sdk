/**
 * Example usage of the useModels utility with clack prompts
 * This demonstrates how to use the multi-provider AI model interface interactively
 */

import { initializeClient, chatCompletion, type ModelConfig, type ChatMessage } from '../../sdk/src/useModels';
import { select, text, spinner } from '@clack/prompts';
import { setTimeout } from 'timers/promises';

// Provider configurations
const providerConfigs: Record<string, Omit<ModelConfig, 'model'>> = {
  openai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  gemini: {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
  },
};

// Available models for each provider
const providerModels: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
};

// Main interactive function
async function interactiveChat() {
  console.log('🤖 Welcome to the AI Chat Example!\n');
  
  try {
    // Select provider
    const provider = await select({
      message: 'Select an AI provider:',
      options: [
        { value: 'openai', label: 'OpenAI (GPT)' },
        { value: 'anthropic', label: 'Anthropic (Claude)' },
        { value: 'gemini', label: 'Google Gemini' },
      ],
    }) as string;
    
    // Select model
    const models = providerModels[provider];
    const model = await select({
      message: 'Select a model:',
      options: models.map(m => ({ value: m, label: m })),
    }) as string;
    
    // Create config
    const baseConfig = providerConfigs[provider];
    const config: ModelConfig = {
      provider: baseConfig.provider,
      model,
      apiKey: baseConfig.apiKey,
    };
    
    // Initialize client
    initializeClient(config);
    console.log(`\n✅ Initialized ${provider} client with ${model}\n`);
    
    // Chat loop
    let continueChat = true;
    const conversationHistory: ChatMessage[] = [];
    
    // Add system message
    const systemMessage = await text({
      message: 'Enter a system message (optional):',
      placeholder: 'You are a helpful assistant.',
      defaultValue: 'You are a helpful assistant.',
    }) as string;
    
    if (systemMessage) {
      conversationHistory.push({ role: 'system', content: systemMessage });
    }
    
    while (continueChat) {
      // Get user input
      const userMessage = await text({
        message: 'Enter your message (type "exit" to quit, "clear" to reset history):',
        placeholder: 'Ask me anything...',
      }) as string;
      
      if (userMessage.toLowerCase() === 'exit') {
        continueChat = false;
        break;
      }
      
      if (userMessage.toLowerCase() === 'clear') {
        conversationHistory.length = systemMessage ? 1 : 0;
        console.log('🗑️  Conversation history cleared.\n');
        continue;
      }
      
      // Add user message to history
      conversationHistory.push({ role: 'user', content: userMessage });
      
      // Show loading spinner
      const s = spinner();
      s.start('AI is thinking...');
      
      try {
        // Get response from AI
        const response = await chatCompletion(conversationHistory, config);
        s.stop('Response received!');
        
        // Add AI response to history
        conversationHistory.push({ role: 'assistant', content: response.content });
        
        // Display response
        console.log(`\n🤖 ${provider} (${model}):`);
        console.log(response.content);
        console.log('\n' + '─'.repeat(50) + '\n');
        
        // Small delay for better UX
        await setTimeout(500);
      } catch (error) {
        s.stop('Error occurred!');
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }
    
    console.log('👋 Thanks for chatting! Goodbye!');
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancel')) {
      console.log('\n👋 Chat cancelled. Goodbye!');
    } else {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run the interactive chat
interactiveChat().catch(console.error);

export default interactiveChat;