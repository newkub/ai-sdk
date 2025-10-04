import { describe, it, expect, beforeEach } from 'vitest';
import { 
  WorkflowEngine, 
  WorkflowBuilder,
  createWorkflowEngine,
  createWorkflowBuilder
} from '../src/useWorkflow';
import { type Workflow, WorkflowStep } from '../src/types/workflows';

describe('useWorkflow', () => {
  let workflowEngine: WorkflowEngine;
  
  beforeEach(() => {
    workflowEngine = createWorkflowEngine();
  });
  
  it('should create a workflow engine', () => {
    expect(workflowEngine).toBeInstanceOf(WorkflowEngine);
  });
  
  it('should create a workflow using the builder pattern', () => {
    const builder = createWorkflowBuilder('test-workflow', 'Test Workflow');
    const workflow = builder
      .setDescription('A test workflow')
      .addStep({
        id: 'step-1',
        name: 'First Step',
        userInput: 'Do something'
      })
      .build();
    
    expect(workflow.id).toBe('test-workflow');
    expect(workflow.name).toBe('Test Workflow');
    expect(workflow.description).toBe('A test workflow');
    expect(workflow.steps).toHaveLength(1);
  });
  
  it('should register and retrieve workflows', () => {
    const workflow: Workflow = {
      id: 'registered-workflow',
      name: 'Registered Workflow',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const createdWorkflow = workflowEngine.createWorkflow(workflow);
    const retrievedWorkflow = workflowEngine.getWorkflow('registered-workflow');
    
    expect(createdWorkflow).toEqual(workflow);
    expect(retrievedWorkflow).toEqual(workflow);
  });
  
  it('should update a workflow', () => {
    const workflow: Workflow = {
      id: 'update-workflow',
      name: 'Original Name',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    workflowEngine.createWorkflow(workflow);
    
    const updates = { name: 'Updated Name' };
    const updatedWorkflow = workflowEngine.updateWorkflow('update-workflow', updates);
    
    expect(updatedWorkflow?.name).toBe('Updated Name');
    expect(updatedWorkflow?.updatedAt).toBeInstanceOf(Date);
  });
  
  it('should delete a workflow', () => {
    const workflow: Workflow = {
      id: 'delete-workflow',
      name: 'Delete Workflow',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    workflowEngine.createWorkflow(workflow);
    const deleted = workflowEngine.deleteWorkflow('delete-workflow');
    const retrieved = workflowEngine.getWorkflow('delete-workflow');
    
    expect(deleted).toBe(true);
    expect(retrieved).toBeUndefined();
  });
  
  it('should list all workflows', () => {
    const workflow1: Workflow = {
      id: 'workflow-1',
      name: 'Workflow 1',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const workflow2: Workflow = {
      id: 'workflow-2',
      name: 'Workflow 2',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    workflowEngine.createWorkflow(workflow1);
    workflowEngine.createWorkflow(workflow2);
    
    const workflows = workflowEngine.listWorkflows();
    
    expect(workflows).toHaveLength(2);
    expect(workflows.map(w => w.id)).toContain('workflow-1');
    expect(workflows.map(w => w.id)).toContain('workflow-2');
  });
  
  it('should manage context', () => {
    const initialContext = { userId: '123', theme: 'dark' };
    workflowEngine.setContext(initialContext);
    
    const context = workflowEngine.getContext();
    expect(context).toEqual(initialContext);
    
    // Update context
    workflowEngine.setContext({ theme: 'light', language: 'en' });
    const updatedContext = workflowEngine.getContext();
    
    expect(updatedContext).toEqual({ userId: '123', theme: 'light', language: 'en' });
  });
});