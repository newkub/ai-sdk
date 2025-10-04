xst# AI SDK

A powerful TypeScript SDK for working with multiple AI providers (OpenAI, Anthropic, Google Gemini) through a unified interface with advanced agent and workflow capabilities.

## Features

- **Multi-Provider Support**: Works with OpenAI, Anthropic, and Google Gemini
- **Unified API**: Consistent interface across all providers
- **Agent System**: High-level abstraction for creating specialized AI agents
- **Workflow Engine**: Create and execute complex multi-step AI workflows
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Context Management**: Maintain state across conversations and workflows

## Installation

```bash
npm install @packages/ai
```

## Quick Start

### Basic Model Usage

```typescript
import { initializeClient, chatCompletion } from '@packages/ai';

// Initialize client
initializeClient({
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY
});

// Get a response
const response = await chatCompletion(
  [{ role: 'user', content: 'Hello!' }],
  { provider: 'openai', model: 'gpt-4o-mini' }
);

console.log(response.content);
```

### Using Agents

```typescript
import { createDefaultAgent, createCodingAgent } from '@packages/ai';

// Create agents
const assistant = createDefaultAgent('openai');
const coder = createCodingAgent('anthropic');

// Chat with agents
const response1 = await assistant.chat('What is the capital of France?');
const response2 = await coder.chat('Write a function to calculate fibonacci numbers');

console.log(response1.content);
console.log(response2.content);
```

### Using Workflows

```typescript
import { createWorkflowEngine, createWorkflowBuilder } from '@packages/ai';

// Create workflow engine
const workflowEngine = createWorkflowEngine();

// Create a workflow
const workflowBuilder = createWorkflowBuilder('research-workflow', 'Research Workflow');
const workflow = workflowBuilder
  .setDescription('Research and summarize a topic')
  .addStep({
    id: 'research',
    name: 'Research',
    agentConfig: {
      name: 'Researcher',
      role: 'an expert researcher',
      modelConfig: {
        provider: 'openai',
        model: 'gpt-4o'
      }
    },
    userInput: 'Research quantum computing advancements'
  })
  .addStep({
    id: 'summarize',
    name: 'Summarize',
    agentConfig: {
      name: 'Summarizer',
      role: 'an expert summarizer',
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-latest'
      }
    },
    userInput: 'Summarize: {{previous_output}}'
  })
  .build();

// Register and execute workflow
workflowEngine.createWorkflow(workflow);
const result = await workflowEngine.executeWorkflow('research-workflow');
console.log(result.finalOutput);
```

## API Reference

### Core Modules

#### useModels

The foundational module that provides a unified interface to multiple AI providers.

##### Key Functions

- `initializeClient(config)`: Initialize a client for a provider
- `chatCompletion(messages, config, options)`: Get a chat completion from any provider
- `getAvailableModels(provider)`: Get available models for a provider
- `validateModel(provider, model)`: Validate if a model is supported

##### Supported Providers

1. **OpenAI**: `openai` - Supports GPT models (gpt-4, gpt-4o, gpt-4o-mini, etc.)
2. **Anthropic**: `anthropic` - Supports Claude models (claude-3-5-sonnet, claude-3-opus, etc.)
3. **Google Gemini**: `gemini` - Supports Gemini models (gemini-1.5-pro, gemini-1.5-flash, etc.)

#### useAgents

High-level abstraction for creating specialized AI agents with context management.

##### Agent Classes

- `Agent`: Base agent class with context management
- `AgentManager`: Manage multiple agents

##### Predefined Agents

- `createDefaultAgent(provider)`: General-purpose assistant
- `createCodingAgent(provider)`: Specialized for programming tasks
- `createResearchAgent(provider)`: Focused on research and analysis

##### Agent Methods

- `chat(message, options)`: Chat with the agent
- `setContext(context)`: Set context for the agent
- `getContext()`: Get current agent context
- `getConfig()`: Get agent configuration

#### useWorkflow

System for creating and executing complex multi-step AI workflows.

##### Workflow Classes

- `WorkflowEngine`: Manages workflows and execution
- `WorkflowBuilder`: Fluent API for creating workflows

##### Key Methods

- `createWorkflow(workflow)`: Register a workflow
- `executeWorkflow(workflowId, context)`: Execute a workflow
- `setContext(context)`: Set context for workflows
- `listWorkflows()`: List all registered workflows

##### Workflow Components

- `Workflow`: Collection of steps with metadata
- `WorkflowStep`: Individual steps that can use agents or direct models
- `WorkflowExecutionResult`: Detailed results of workflow execution

## Environment Variables

Set your API keys as environment variables:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
```

## Examples

### Custom Agents

```typescript
import { createAgent, type AgentConfig } from '@packages/ai';

const config: AgentConfig = {
  name: 'Math Tutor',
  role: 'a helpful math tutor',
  systemPrompt: 'You are an expert math tutor...',
  modelConfig: {
    provider: 'gemini',
    model: 'gemini-1.5-pro'
  },
  temperature: 0.3
};

const mathTutor = createAgent(config);
const response = await mathTutor.chat('Explain the Pythagorean theorem');
```

### Agent Context

```typescript
// Set context for an agent
mathTutor.setContext({
  studentLevel: 'High School',
  preferredExplanationStyle: 'Visual with examples'
});

// The context will be included in subsequent conversations
const response = await mathTutor.chat('Explain trigonometry');
```

### Complex Workflows

```typescript
import { createWorkflowEngine, createWorkflowBuilder } from '@packages/ai';

const engine = createWorkflowEngine();
engine.setContext({ userId: '123', theme: 'dark' });

const workflow = createWorkflowBuilder('content-creation', 'Content Creation Workflow')
  .addStep({
    id: 'brainstorm',
    name: 'Brainstorm Ideas',
    agentConfig: {
      name: 'Ideas Generator',
      role: 'a creative ideas generator',
      modelConfig: { provider: 'openai', model: 'gpt-4o' }
    },
    userInput: 'Generate 5 blog post ideas about AI ethics'
  })
  .addStep({
    id: 'outline',
    name: 'Create Outline',
    agentConfig: {
      name: 'Content Outliner',
      role: 'a content outliner',
      modelConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet-latest' }
    },
    userInput: 'Create a detailed outline for: {{previous_output}}'
  })
  .addStep({
    id: 'write',
    name: 'Write Content',
    agentConfig: {
      name: 'Content Writer',
      role: 'a professional content writer',
      modelConfig: { provider: 'gemini', model: 'gemini-1.5-pro' }
    },
    userInput: 'Write a full article based on this outline: {{previous_output}}'
  })
  .build();

engine.createWorkflow(workflow);
const result = await engine.executeWorkflow('content-creation');
console.log(result.finalOutput);
```

## Type Safety

The SDK provides comprehensive TypeScript typings for all components:

```typescript
import { 
  ModelConfig, 
  ChatMessage, 
  ChatOptions, 
  AgentConfig, 
  Workflow 
} from '@packages/ai/types';
```

All interfaces properly extend base types and provide strong typing for configuration objects and responses.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.