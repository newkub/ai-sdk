import {
  Effect,
  Ref,
  Schema
} from 'effect';
import { WorkflowExecutionResultSchema } from './types';
import type { Workflow, WorkflowContext, WorkflowStepResult } from './types';
import type { ChatMessage } from '../../types/models';

const simpleChatCompletion = async (messages: ChatMessage[], config: any): Promise<any> => {
  // This is a placeholder implementation
  return {
    content: `Mock response for: ${messages[messages.length - 1]?.content || 'empty message'}`,
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
};

// Execute workflow steps sequentially
export const executeWorkflowStep = (workflow: Workflow): Effect.Effect<unknown, never, never> =>
  Effect.gen(function* () {
    const contextRef = yield* Ref.make<WorkflowContext>({});
    const stepResults: WorkflowStepResult[] = [];
    let finalOutput = '';
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      // Execute each step in sequence
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        if (!step) continue; // Skip if step is undefined

        const currentContext = yield* Ref.get(contextRef);
        const stepStartTime = Date.now();
        const stepSuccess = true;
        let stepError: string | undefined;
        let output = '';

        try {
          if (step.agentConfig) {
            // Use agent for this step - simplified for now
            output = `Agent step: ${step.userInput || 'No input'}`;
          } else if (step.modelConfig) {
            // Use direct model for this step
            const messages: ChatMessage[] = [];

            if (step.systemPrompt) {
              messages.push({ role: 'system', content: step.systemPrompt });
            }

            // Add context to system message
            if (Object.keys(currentContext).length > 0) {
              const contextInfo = `\nContext Information:\n${JSON.stringify(currentContext, null, 2)}`;
              if (messages.length > 0 && messages[0]?.role === 'system') {
                // Create a new message instead of modifying existing one
                messages.push({ role: 'system', content: messages[0].content + contextInfo });
                // Remove the original system message
                messages.splice(0, 1);
              } else {
                messages.push({ role: 'system', content: contextInfo });
              }
            }

            messages.push({ role: 'user', content: step.userInput || '' });

            const response = yield* Effect.tryPromise(() =>
              simpleChatCompletion(messages, step.modelConfig)
            );
            output = response.content;
          } else {
            // Simple step with just user input
            output = step.userInput || '';
          }

          // Update context with output
          const newContext = { ...currentContext, [`step_${step.id}_output`]: output };

          const stepResult: WorkflowStepResult = {
            stepId: step.id,
            stepName: step.name,
            output,
            executionTime: Date.now() - stepStartTime,
            success: stepSuccess,
            error: stepError ?? undefined
          };

          stepResults.push(stepResult);

          // Update context with step output
          if (stepResult.success && stepResult.output) {
            yield* Ref.set(contextRef, newContext);
            finalOutput = stepResult.output;
          }

          // Stop execution if step failed
          if (!stepResult.success) {
            success = false;
            error = stepResult.error;
            break;
          }
        } catch (err) {
          const stepResult: WorkflowStepResult = {
            stepId: step.id,
            stepName: step.name,
            output: '',
            executionTime: Date.now() - stepStartTime,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          };

          stepResults.push(stepResult);
          success = false;
          error = stepResult.error;
          break;
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const executionResult = {
      workflowId: workflow.id,
      stepResults,
      finalOutput,
      executionTime: Date.now() - startTime,
      success,
      error: error ?? undefined
    };

    return executionResult as any;
  });
