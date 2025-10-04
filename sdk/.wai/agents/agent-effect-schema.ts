import { Schema, Effect } from 'effect';
import { Project, VariableDeclarationKind, InterfaceDeclaration, PropertySignature } from 'ts-morph';

// Agent configuration schema using Effect Schema
export const AgentModelConfigSchema = Schema.Struct({
  provider: Schema.Literal('openai', 'anthropic', 'gemini'),
  model: Schema.String,
  apiKey: Schema.optional(Schema.String),
  baseURL: Schema.optional(Schema.String),
  temperature: Schema.optional(Schema.Number),
  maxTokens: Schema.optional(Schema.Number)
});

export const AgentInputSchema = Schema.Struct({
  types: Schema.Array(Schema.String),
  maxLength: Schema.optional(Schema.Number)
});

export const AgentOrganizationSchema = Schema.Struct({
  name: Schema.String,
  team: Schema.optional(Schema.String),
  department: Schema.optional(Schema.String)
});

export const AgentResponseSchema = Schema.Struct({
  format: Schema.Literal('text', 'markdown', 'json'),
  style: Schema.optional(Schema.String),
  tone: Schema.optional(Schema.String)
});

export const AgentConfigurationSchema = Schema.Struct({
  schema: Schema.optional(Schema.String),
  name: Schema.String,
  roles: Schema.Array(Schema.String),
  instructions: Schema.String,
  goal: Schema.String,
  input: AgentInputSchema,
  organization: AgentOrganizationSchema,
  response: AgentResponseSchema,
  skills: Schema.optional(Schema.Array(Schema.String)),
  partners: Schema.optional(Schema.Array(Schema.String)),
  tasks: Schema.optional(Schema.Array(Schema.String)),
  hooks: Schema.optional(Schema.Array(Schema.String)),
  docs: Schema.optional(Schema.String),
  modelConfig: AgentModelConfigSchema
});

// Schema version for ts-morph integration
export const SCHEMA_VERSION = '1.0.0';

// Type inference from schemas
export type AgentConfiguration = Schema.Schema.Type<typeof AgentConfigurationSchema>;
export type AgentModelConfig = Schema.Schema.Type<typeof AgentModelConfigSchema>;
export type AgentInput = Schema.Schema.Type<typeof AgentInputSchema>;
export type AgentOrganization = Schema.Schema.Type<typeof AgentOrganizationSchema>;
export type AgentResponse = Schema.Schema.Type<typeof AgentResponseSchema>;

// Validation utility functions using Effect Schema (Zod-compatible interface)
export const validateAgentConfig = (data: unknown) => {
  try {
    const result = Schema.decodeUnknownSync(AgentConfigurationSchema)(data);
    return {
      success: true as const,
      data: result
    };
  } catch (error) {
    return {
      success: false as const,
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
};

export const parseAgentConfig = (data: unknown) => {
  return Schema.decodeUnknownSync(AgentConfigurationSchema)(data);
};

// Enhanced schema generation utility for ts-morph
export const generateAgentSchema = () => {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://wrikka.com/schemas/agent-config-${SCHEMA_VERSION}.json`,
    title: 'AI Agent Configuration',
    description: 'Schema for configuring AI agents with roles, capabilities, and model settings',
    type: 'object',
    properties: {
      schema: {
        type: 'string',
        description: 'Schema version identifier'
      },
      name: {
        type: 'string',
        description: 'Unique name identifier for the agent'
      },
      roles: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of roles this agent can perform'
      },
      instructions: {
        type: 'string',
        description: 'Detailed instructions for the agent behavior'
      },
      goal: {
        type: 'string',
        description: 'Primary goal or purpose of the agent'
      },
      input: {
        type: 'object',
        properties: {
          types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Supported input types'
          },
          maxLength: {
            type: 'number',
            description: 'Maximum input length in characters'
          }
        },
        required: ['types']
      },
      organization: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Organization name'
          },
          team: {
            type: 'string',
            description: 'Team name within organization'
          },
          department: {
            type: 'string',
            description: 'Department within organization'
          }
        },
        required: ['name']
      },
      response: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['text', 'markdown', 'json'],
            description: 'Output format type'
          },
          style: {
            type: 'string',
            description: 'Response style preference'
          },
          tone: {
            type: 'string',
            description: 'Response tone preference'
          }
        },
        required: ['format']
      },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of specific skills the agent possesses'
      },
      partners: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of partner agents for collaboration'
      },
      tasks: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of specific tasks the agent can perform'
      },
      hooks: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of lifecycle hooks for the agent'
      },
      docs: {
        type: 'string',
        description: 'Documentation reference path'
      },
      modelConfig: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'gemini'],
            description: 'AI model provider'
          },
          model: {
            type: 'string',
            description: 'Specific model identifier'
          },
          apiKey: {
            type: 'string',
            description: 'API key for the provider'
          },
          baseURL: {
            type: 'string',
            description: 'Base URL for API endpoint'
          },
          temperature: {
            type: 'number',
            description: 'Model temperature setting'
          },
          maxTokens: {
            type: 'number',
            description: 'Maximum tokens for response'
          }
        },
        required: ['provider', 'model']
      }
    },
    required: ['name', 'roles', 'instructions', 'goal', 'input', 'organization', 'response', 'modelConfig']
  };
};

// Generate TypeScript types using ts-morph from Effect Schema
export const generateTypeScriptTypes = (outputPath?: string): string => {
  const project = new Project();

  // Create a source file for the generated types
  const sourceFile = project.createSourceFile(
    outputPath || 'generated-agent-types.ts',
    '',
    { overwrite: true }
  );

  // Add imports
  sourceFile.addImportDeclaration({
    namedImports: ['Schema'],
    moduleSpecifier: 'effect'
  });

  // Generate interface for AgentConfiguration
  const configInterface = sourceFile.addInterface({
    name: 'AgentConfiguration',
    isExported: true
  });

  // Add properties based on the schema structure
  configInterface.addProperty({
    name: 'schema',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'name',
    type: 'string'
  });

  configInterface.addProperty({
    name: 'roles',
    type: 'readonly string[]'
  });

  configInterface.addProperty({
    name: 'instructions',
    type: 'string'
  });

  configInterface.addProperty({
    name: 'goal',
    type: 'string'
  });

  configInterface.addProperty({
    name: 'input',
    type: 'AgentInput'
  });

  configInterface.addProperty({
    name: 'organization',
    type: 'AgentOrganization'
  });

  configInterface.addProperty({
    name: 'response',
    type: 'AgentResponse'
  });

  configInterface.addProperty({
    name: 'skills',
    type: 'readonly string[] | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'partners',
    type: 'readonly string[] | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'tasks',
    type: 'readonly string[] | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'hooks',
    type: 'readonly string[] | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'docs',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  configInterface.addProperty({
    name: 'modelConfig',
    type: 'AgentModelConfig'
  });

  // Generate AgentModelConfig interface
  const modelConfigInterface = sourceFile.addInterface({
    name: 'AgentModelConfig',
    isExported: true
  });

  modelConfigInterface.addProperty({
    name: 'provider',
    type: "'openai' | 'anthropic' | 'gemini'"
  });

  modelConfigInterface.addProperty({
    name: 'model',
    type: 'string'
  });

  modelConfigInterface.addProperty({
    name: 'apiKey',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  modelConfigInterface.addProperty({
    name: 'baseURL',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  modelConfigInterface.addProperty({
    name: 'temperature',
    type: 'number | undefined',
    hasQuestionToken: true
  });

  modelConfigInterface.addProperty({
    name: 'maxTokens',
    type: 'number | undefined',
    hasQuestionToken: true
  });

  // Generate other interfaces
  const inputInterface = sourceFile.addInterface({
    name: 'AgentInput',
    isExported: true
  });

  inputInterface.addProperty({
    name: 'types',
    type: 'readonly string[]'
  });

  inputInterface.addProperty({
    name: 'maxLength',
    type: 'number | undefined',
    hasQuestionToken: true
  });

  const organizationInterface = sourceFile.addInterface({
    name: 'AgentOrganization',
    isExported: true
  });

  organizationInterface.addProperty({
    name: 'name',
    type: 'string'
  });

  organizationInterface.addProperty({
    name: 'team',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  organizationInterface.addProperty({
    name: 'department',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  const responseInterface = sourceFile.addInterface({
    name: 'AgentResponse',
    isExported: true
  });

  responseInterface.addProperty({
    name: 'format',
    type: "'text' | 'markdown' | 'json'"
  });

  responseInterface.addProperty({
    name: 'style',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  responseInterface.addProperty({
    name: 'tone',
    type: 'string | undefined',
    hasQuestionToken: true
  });

  return sourceFile.getFullText();
};
