import { Schema, type Effect, Option } from 'effect';
import type { AgentConfig, ModelConfig, ChatMessage } from './models';

// Workflow step schema
export const WorkflowStepSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  userInput: Schema.optional(Schema.String),
  systemPrompt: Schema.optional(Schema.String),
  agentConfig: Schema.optional(Schema.Struct({
    provider: Schema.Literal('openai', 'anthropic', 'gemini'),
    model: Schema.String,
    apiKey: Schema.optional(Schema.String),
    baseURL: Schema.optional(Schema.String)
  })),
  modelConfig: Schema.optional(Schema.Struct({
    provider: Schema.Literal('openai', 'anthropic', 'gemini'),
    model: Schema.String,
    apiKey: Schema.optional(Schema.String),
    baseURL: Schema.optional(Schema.String)
  }))
});

export type WorkflowStep = Schema.Schema.Type<typeof WorkflowStepSchema>;

// Workflow schema
export const WorkflowSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  steps: Schema.Array(WorkflowStepSchema),
  createdAt: Schema.Date,
  updatedAt: Schema.Date
});

export type Workflow = Schema.Schema.Type<typeof WorkflowSchema>;

// Workflow step result schema
export const WorkflowStepResultSchema = Schema.Struct({
  stepId: Schema.String,
  stepName: Schema.String,
  output: Schema.String,
  executionTime: Schema.Number,
  success: Schema.Boolean,
  error: Schema.optional(Schema.String)
});

export type WorkflowStepResult = Schema.Schema.Type<typeof WorkflowStepResultSchema>;

// Workflow execution result schema
export const WorkflowExecutionResultSchema = Schema.Struct({
  workflowId: Schema.String,
  stepResults: Schema.Array(WorkflowStepResultSchema),
  finalOutput: Schema.String,
  executionTime: Schema.Number,
  success: Schema.Boolean,
  error: Schema.optional(Schema.String)
});

export type WorkflowExecutionResult = Schema.Schema.Type<typeof WorkflowExecutionResultSchema>;

// Workflow context schema
export const WorkflowContextSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown
});

export type WorkflowContext = Schema.Schema.Type<typeof WorkflowContextSchema>;

// Workflow engine interface
export interface WorkflowEngine {
  readonly createWorkflow: (workflow: Workflow) => Effect.Effect<Workflow, never, never>;
  readonly getWorkflow: (id: string) => Effect.Effect<Workflow | undefined, never, never>;
  readonly updateWorkflow: (id: string, updates: Partial<Workflow>) => Effect.Effect<Workflow | undefined, never, never>;
  readonly deleteWorkflow: (id: string) => Effect.Effect<boolean, never, never>;
  readonly listWorkflows: () => Effect.Effect<Workflow[], never, never>;
  readonly getAvailableWorkflows: () => Effect.Effect<Workflow[], never, never>;
  readonly getWorkflowDefinitions: () => Effect.Effect<any[], never, never>;
  readonly setContext: (context: WorkflowContext) => Effect.Effect<void, never, never>;
  readonly getContext: () => Effect.Effect<WorkflowContext, never, never>;
  readonly executeWorkflow: (workflowId: string, initialContext?: WorkflowContext) => Effect.Effect<WorkflowExecutionResult, never, never>;
}

// Workflow builder interface
export interface WorkflowBuilder {
  readonly setDescription: (description: string) => WorkflowBuilder;
  readonly addStep: (step: WorkflowStep) => WorkflowBuilder;
  readonly build: () => Workflow;
}

// Workflow execution context
export interface WorkflowExecutionContext {
  readonly workflow: Workflow;
  readonly stepResults: WorkflowStepResult[];
  readonly currentContext: WorkflowContext;
  readonly startTime: number;
}
