import { Effect, Ref } from 'effect';
import type { Workflow, WorkflowContext, WorkflowEngine } from './types';
import { executeWorkflowStep } from './execution';

// Workflow engine implementation using Effect
export const createWorkflowEngine = (): Effect.Effect<WorkflowEngine, never, never> =>
  Effect.gen(function* () {
    // Store workflows in memory using Ref
    const workflowsRef = yield* Ref.make(new Map<string, Workflow>());
    const contextRef = yield* Ref.make<WorkflowContext>({});

    const createWorkflow = (workflow: Workflow): Effect.Effect<Workflow, never, never> =>
      Effect.gen(function* () {
        const now = new Date();
        const newWorkflow: Workflow = {
          ...workflow,
          createdAt: now,
          updatedAt: now
        };

        yield* Ref.update(workflowsRef, (workflows: Map<string, Workflow>) =>
          new Map(workflows.set(newWorkflow.id, newWorkflow))
        );

        return newWorkflow;
      });

    const getWorkflow = (id: string): Effect.Effect<Workflow | undefined, never, never> =>
      Ref.get(workflowsRef).pipe(
        Effect.map((workflows: Map<string, Workflow>) => workflows.get(id))
      );

    const updateWorkflow = (id: string, updates: Partial<Workflow>): Effect.Effect<Workflow | undefined, never, never> =>
      Effect.gen(function* () {
        const workflows = yield* Ref.get(workflowsRef);
        const workflow = workflows.get(id);

        if (!workflow) {
          return undefined;
        }

        const updatedWorkflow: Workflow = {
          ...workflow,
          ...updates,
          updatedAt: new Date()
        };

        yield* Ref.update(workflowsRef, (workflows: Map<string, Workflow>) =>
          new Map(workflows.set(id, updatedWorkflow))
        );

        return updatedWorkflow;
      });

    const deleteWorkflow = (id: string): Effect.Effect<boolean, never, never> =>
      Ref.modify(workflowsRef, (workflows: Map<string, Workflow>) => {
        const exists = workflows.has(id);
        if (exists) {
          workflows.delete(id);
        }
        return [exists, workflows];
      });

    const listWorkflows = (): Effect.Effect<Workflow[], never, never> =>
      Ref.get(workflowsRef).pipe(
        Effect.map((workflows: Map<string, Workflow>) => Array.from(workflows.values()))
      );

    const getAvailableWorkflows = (): Effect.Effect<Workflow[], never, never> =>
      Ref.get(workflowsRef).pipe(
        Effect.map((workflows: Map<string, Workflow>) => Array.from(workflows.values()))
      );

    const getWorkflowDefinitions = (): Effect.Effect<any[], never, never> =>
      Ref.get(workflowsRef).pipe(
        Effect.map((workflows: Map<string, Workflow>) =>
          Array.from(workflows.values()).map(workflow => ({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            steps: workflow.steps.map(step => ({
              id: step.id,
              name: step.name,
              description: step.description,
              inputSchema: step.agentConfig || step.modelConfig ? {
                type: step.agentConfig ? 'agent' : 'model',
                config: step.agentConfig || step.modelConfig
              } : null
            }))
          }))
        )
      );

    const setContext = (newContext: WorkflowContext): Effect.Effect<void, never, never> =>
      Ref.update(contextRef, (context: WorkflowContext) => ({ ...context, ...newContext }));

    const getContext = (): Effect.Effect<WorkflowContext, never, never> =>
      Ref.get(contextRef).pipe(
        Effect.map((context: WorkflowContext) => ({ ...context }))
      );

    const executeWorkflow = (workflowId: string, initialContext?: WorkflowContext): Effect.Effect<any, never, never> =>
      Effect.gen(function* () {
        const workflow = yield* getWorkflow(workflowId);

        if (!workflow) {
          return {
            workflowId,
            stepResults: [],
            finalOutput: `Workflow with ID ${workflowId} not found`,
            executionTime: 0,
            success: false,
            error: `Workflow with ID ${workflowId} not found`
          };
        }

        // Set initial context if provided
        if (initialContext) {
          yield* setContext(initialContext);
        }

        // Execute the workflow
        const result = yield* executeWorkflowStep(workflow);

        return result;
      });

    return {
      createWorkflow,
      getWorkflow,
      updateWorkflow,
      deleteWorkflow,
      listWorkflows,
      getAvailableWorkflows,
      getWorkflowDefinitions,
      setContext,
      getContext,
      executeWorkflow
    };
  });
