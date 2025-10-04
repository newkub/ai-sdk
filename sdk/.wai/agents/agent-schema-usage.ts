import { AgentConfigurationSchema, validateAgentConfig, parseAgentConfig, generateAgentSchema } from './agent-effect-schema';
import fs from 'fs';
import path from 'path';

// Example usage of Effect Schema for agent configuration
export const validateAgentConfigurations = async () => {
  const agentDir = path.join(process.cwd(), '.wai', 'agents');

  // List of agent configuration files
  const agentFiles = [
    'default-assistant.json',
    'code-reviewer.json',
    'documentation-expert.json'
  ];

  console.log('🔍 Validating agent configuration files using Effect Schema...\n');

  for (const file of agentFiles) {
    const filePath = path.join(agentDir, file);
    try {
      // Read and parse JSON file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const configData = JSON.parse(fileContent);

      // Validate against Zod Schema (returns Either-like result)
      const validation = validateAgentConfig(configData);

      if (validation.success) {
        console.log(`✅ ${file} - Valid`);
        console.log(`   Name: ${validation.data.name}`);
        console.log(`   Roles: ${validation.data.roles.join(', ')}`);
        console.log(`   Provider: ${validation.data.modelConfig.provider}`);
        console.log(`   Model: ${validation.data.modelConfig.model}`);
      } else {
        console.log(`❌ ${file} - Invalid`);
        console.log('   Errors:');
        console.log(`     - ${validation.error.message}`);
      }
    } catch (error) {
      console.log(`❌ ${file} - Error reading file: ${error.message}`);
    }

    console.log('');
  }
};

// Example of creating a new agent configuration with Effect Schema validation
export const createValidatedAgentConfig = () => {
  const newAgentConfig = {
    schema: "https://wrikka.com/schemas/agent-config-1.0.0.json",
    name: 'test-agent',
    roles: ['testing', 'validation'],
    instructions: 'You are a test agent for validating configurations.',
    goal: 'Ensure all agent configurations are valid',
    input: {
      types: ['text'],
      maxLength: 1000
    },
    organization: {
      name: 'test-corp',
      team: 'qa-team',
      department: 'engineering'
    },
    response: {
      format: 'text',
      style: 'detailed',
      tone: 'professional'
    },
    skills: ['validation', 'testing'],
    modelConfig: {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 1000
    }
  };

  try {
    // Validate and decode using Zod Schema (returns Either-like result)
    const validation = validateAgentConfig(newAgentConfig);

    if (validation.success) {
      console.log('✅ New agent config is valid:');
      console.log(JSON.stringify(validation.data, null, 2));

      // Save to file
      const filePath = path.join(process.cwd(), '.wai', 'agents', 'test-agent.json');
      fs.writeFileSync(filePath, JSON.stringify(validation.data, null, 2));
      console.log(`💾 Saved validated config to ${filePath}`);
    } else {
      console.log('❌ New agent config is invalid:');
      console.log(validation.error.message);
    }

  } catch (error) {
    console.log('❌ Error validating new agent config:');
    console.log(error.message);
  }
};

// Generate JSON Schema for external tools
export const generateJSONSchemaFile = () => {
  const jsonSchema = generateAgentSchema();
  const schemaPath = path.join(process.cwd(), '.wai', 'agents', 'agent-config-schema.json');

  fs.writeFileSync(schemaPath, JSON.stringify(jsonSchema, null, 2));
  console.log(`📋 Generated JSON Schema at ${schemaPath}`);

  return jsonSchema;
};

// Example of using ts-morph for code generation
export const generateAgentTypeDefinitions = () => {
  // This would use ts-morph to generate TypeScript definitions
  // from the Effect Schema
  console.log('🔧 Would generate TypeScript definitions using ts-morph...');

  // Example of what ts-morph could generate:
  const typeDefinitions = `
// Auto-generated types from Effect Schema
export interface AgentConfiguration {
  readonly schema?: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly instructions: string;
  readonly goal: string;
  readonly input: AgentInput;
  readonly organization: AgentOrganization;
  readonly response: AgentResponse;
  readonly skills?: readonly string[];
  readonly partners?: readonly string[];
  readonly tasks?: readonly string[];
  readonly hooks?: readonly string[];
  readonly docs?: string;
  readonly modelConfig: AgentModelConfig;
}

export interface AgentModelConfig {
  readonly provider: 'openai' | 'anthropic' | 'gemini';
  readonly model: string;
  readonly apiKey?: string;
  readonly baseURL?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface AgentInput {
  readonly types: readonly string[];
  readonly maxLength?: number;
}

export interface AgentOrganization {
  readonly name: string;
  readonly team?: string;
  readonly department?: string;
}

export interface AgentResponse {
  readonly format: 'text' | 'markdown' | 'json';
  readonly style?: string;
  readonly tone?: string;
}
`;

  console.log('Generated TypeScript definitions:');
  console.log(typeDefinitions);
};

// Export utilities for use in other modules
export {
  AgentConfigurationSchema,
  validateAgentConfig,
  parseAgentConfig,
  generateAgentSchema
};
