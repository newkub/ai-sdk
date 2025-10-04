import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  Agent, 
  AgentManager, 
  createAgent, 
  createDefaultAgent, 
  createCodingAgent, 
  createResearchAgent
} from '../src/useAgents';
import type { AgentConfig } from '../src/types/agents';

describe('useAgents', () => {
  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  const mockAgentConfig: AgentConfig = {
    name: 'Test Agent',
    role: 'a test agent',
    systemPrompt: 'You are a test agent.',
    modelConfig: {
      provider: 'openai',
      model: 'gpt-4o-mini'
    }
  };

  it('should create an agent with the correct configuration', () => {
    const agent = createAgent(mockAgentConfig);
    expect(agent).toBeInstanceOf(Agent);
    
    const config = agent.getConfig();
    expect(config.name).toBe(mockAgentConfig.name);
    expect(config.role).toBe(mockAgentConfig.role);
  });

  it('should manage context correctly', () => {
    const agent = createAgent(mockAgentConfig);
    
    // Set context
    const context = { userId: '123', preference: 'concise' };
    agent.setContext(context);
    
    // Get context
    const retrievedContext = agent.getContext();
    expect(retrievedContext).toEqual(context);
    
    // Update context
    agent.setContext({ preference: 'detailed', language: 'en' });
    const updatedContext = agent.getContext();
    expect(updatedContext).toEqual({ userId: '123', preference: 'detailed', language: 'en' });
    
    // Clear context
    agent.clearContext();
    const clearedContext = agent.getContext();
    expect(clearedContext).toEqual({});
  });

  it('should create predefined agents', () => {
    const defaultAgent = createDefaultAgent();
    const codingAgent = createCodingAgent();
    const researchAgent = createResearchAgent();
    
    expect(defaultAgent).toBeInstanceOf(Agent);
    expect(codingAgent).toBeInstanceOf(Agent);
    expect(researchAgent).toBeInstanceOf(Agent);
    
    const defaultConfig = defaultAgent.getConfig();
    const codingConfig = codingAgent.getConfig();
    const researchConfig = researchAgent.getConfig();
    
    expect(defaultConfig.name).toBe('Default Assistant');
    expect(codingConfig.name).toBe('Coding Assistant');
    expect(researchConfig.name).toBe('Research Assistant');
  });

  it('should manage agents with AgentManager', () => {
    const agentManager = new AgentManager();
    const agent = createAgent(mockAgentConfig);
    
    // Add agent
    agentManager.addAgent(agent);
    
    // List agents
    const agentList = agentManager.listAgents();
    expect(agentList).toContain(mockAgentConfig.name);
    
    // Get agent
    const retrievedAgent = agentManager.getAgent(mockAgentConfig.name);
    expect(retrievedAgent).toBeDefined();
    
    // Remove agent
    const removed = agentManager.removeAgent(mockAgentConfig.name);
    expect(removed).toBe(true);
    
    // Try to get removed agent
    const missingAgent = agentManager.getAgent(mockAgentConfig.name);
    expect(missingAgent).toBeUndefined();
  });
});