/**
 * Example usage of the useAgents utility with clack prompts
 * This demonstrates how to create and use AI agents interactively
 */

import { 
  createAgent, 
  createDefaultAgent, 
  createCodingAgent, 
  createResearchAgent, 
  AgentManager,
  type AgentConfig
} from '../../sdk/src/useAgents';
import { select, text, spinner, confirm } from '@clack/prompts';
import { setTimeout } from 'timers/promises';

// Example usage function with interactive prompts
async function interactiveAgentUsage() {
  console.log('🤖 AI Agents Example');
  console.log('===================\n');
  
  try {
    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'predefined', label: 'Use Predefined Agents' },
        { value: 'custom', label: 'Create Custom Agent' },
        { value: 'manager', label: 'Use Agent Manager' },
      ],
    }) as string;
    
    console.log('\n');
    
    switch (action) {
      case 'predefined':
        await usePredefinedAgents();
        break;
      case 'custom':
        await createCustomAgent();
        break;
      case 'manager':
        await useAgentManager();
        break;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancel')) {
      console.log('\n👋 Operation cancelled. Goodbye!');
    } else {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

async function usePredefinedAgents() {
  const agentType = await select({
    message: 'Select a predefined agent:',
    options: [
      { value: 'default', label: 'Default Assistant' },
      { value: 'coding', label: 'Coding Assistant' },
      { value: 'research', label: 'Research Assistant' },
    ],
  }) as string;
  
  const provider = await select({
    message: 'Select a provider:',
    options: [
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
      { value: 'gemini', label: 'Google Gemini' },
    ],
  }) as string;
  
  const message = await text({
    message: 'Enter your message:',
    placeholder: 'Ask me anything...',
    defaultValue: 'Hello!',
  }) as string;
  
  const s = spinner();
  s.start('Agent is thinking...');
  
  try {
    let response;
    switch (agentType) {
      case 'default':
        const defaultAgent = createDefaultAgent(provider as any);
        response = await defaultAgent.chat(message);
        break;
      case 'coding':
        const codingAgent = createCodingAgent(provider as any);
        response = await codingAgent.chat(message);
        break;
      case 'research':
        const researchAgent = createResearchAgent(provider as any);
        response = await researchAgent.chat(message);
        break;
    }
    
    s.stop('Response received!');
    console.log(`\n🤖 Agent Response:`);
    console.log(response!.content);
    console.log('\n');
  } catch (error) {
    s.stop('Error occurred!');
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }
}

async function createCustomAgent() {
  const name = await text({
    message: 'Agent name:',
    placeholder: 'My Custom Agent',
    defaultValue: 'Custom Assistant',
  }) as string;
  
  const role = await text({
    message: 'Agent role:',
    placeholder: 'a helpful assistant',
    defaultValue: 'a helpful assistant',
  }) as string;
  
  const systemPrompt = await text({
    message: 'System prompt:',
    placeholder: 'You are a helpful assistant.',
    defaultValue: 'You are a helpful assistant.',
  }) as string;
  
  const provider = await select({
    message: 'Select a provider:',
    options: [
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
      { value: 'gemini', label: 'Google Gemini' },
    ],
  }) as string;
  
  const model = await text({
    message: 'Model name:',
    placeholder: 'gpt-4o-mini',
    defaultValue: provider === 'openai' ? 'gpt-4o-mini' : 
                 provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 
                 'gemini-1.5-pro',
  }) as string;
  
  const temperature = await text({
    message: 'Temperature (0-1):',
    placeholder: '0.7',
    defaultValue: '0.7',
  }) as string;
  
  const config: AgentConfig = {
    name,
    role,
    systemPrompt,
    modelConfig: {
      provider: provider as any,
      model,
    },
    temperature: parseFloat(temperature),
  };
  
  const agent = createAgent(config);
  
  const message = await text({
    message: 'Enter your message:',
    placeholder: 'Ask me anything...',
    defaultValue: 'Hello!',
  }) as string;
  
  const s = spinner();
  s.start('Agent is thinking...');
  
  try {
    const response = await agent.chat(message);
    s.stop('Response received!');
    
    console.log(`\n🤖 ${name} Response:`);
    console.log(response.content);
    console.log('\n');
  } catch (error) {
    s.stop('Error occurred!');
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }
}

async function useAgentManager() {
  const agentManager = new AgentManager();
  
  // Create some agents
  const defaultAgent = createDefaultAgent('openai');
  const codingAgent = createCodingAgent('anthropic');
  
  agentManager.addAgent(defaultAgent);
  agentManager.addAgent(codingAgent);
  
  const agentNames = agentManager.listAgents();
  
  if (agentNames.length === 0) {
    console.log('No agents available in the manager.');
    return;
  }
  
  const selectedAgent = await select({
    message: 'Select an agent:',
    options: agentNames.map((name: string) => ({ value: name, label: name })),
  }) as string;
  
  const message = await text({
    message: 'Enter your message:',
    placeholder: 'Ask me anything...',
    defaultValue: 'Hello!',
  }) as string;
  
  const s = spinner();
  s.start('Agent is thinking...');
  
  try {
    const response = await agentManager.chatWith(selectedAgent, message);
    s.stop('Response received!');
    
    if (response) {
      console.log(`\n🤖 ${selectedAgent} Response:`);
      console.log(response.content);
      console.log('\n');
    }
  } catch (error) {
    s.stop('Error occurred!');
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }
}

// Run the interactive example
interactiveAgentUsage().catch(console.error);

export default interactiveAgentUsage;