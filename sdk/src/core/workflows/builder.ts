import { Effect, Ref } from 'effect';
import type { Workflow, WorkflowStep, WorkflowBuilder } from './types';

// Workflow builder implementation using Effect
export const createWorkflowBuilder = (id: string, name: string): Effect.Effect<WorkflowBuilder, never, never> =>
  Effect.gen(function* () {
    const workflowRef = yield* Ref.make<Workflow>({
      id,
      name,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const setDescription = (description: string): WorkflowBuilder => ({
      setDescription,
      addStep,
      build
    });

    const addStep = (step: WorkflowStep): WorkflowBuilder => {
      // Update workflow with new step
      Ref.update(workflowRef, (workflow: Workflow) => ({
        ...workflow,
        steps: [...workflow.steps, step],
        updatedAt: new Date()
      }));

      return {
        setDescription,
        addStep,
        build
      };
    };

    const build = (): Workflow =>
      Effect.runSync(Ref.get(workflowRef));

    return {
      setDescription,
      addStep,
      build
    };
  });
