import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  initializeClient, 
  chatCompletion, 
  getAvailableModels, 
  validateModel
} from '../src/useModels';
import { 
  Provider,
  ModelConfig,
  ChatMessage
} from '../src/types/models';

describe('useModels', () => {
  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should provide available models for each provider', () => {
    const openaiModels = getAvailableModels('openai');
    const anthropicModels = getAvailableModels('anthropic');
    const geminiModels = getAvailableModels('gemini');

    expect(openaiModels.length).toBeGreaterThan(0);
    expect(anthropicModels.length).toBeGreaterThan(0);
    expect(geminiModels.length).toBeGreaterThan(0);
  });

  it('should validate model names correctly', () => {
    expect(validateModel('openai', 'gpt-4')).toBe(true);
    expect(validateModel('openai', 'non-existent-model')).toBe(false);
    
    expect(validateModel('anthropic', 'claude-3-5-sonnet-latest')).toBe(true);
    expect(validateModel('anthropic', 'non-existent-model')).toBe(false);
    
    expect(validateModel('gemini', 'gemini-1.5-pro')).toBe(true);
    expect(validateModel('gemini', 'non-existent-model')).toBe(false);
  });

  // Note: Actual API calls are not tested here to avoid requiring real API keys
  // In a real test environment, you would mock the respective SDKs
});