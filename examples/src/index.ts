#!/usr/bin/env bun

/**
 * Main entry point for AI SDK examples
 * Allows users to select which example to run
 */

import { select } from '@clack/prompts';
import { setTimeout } from 'timers/promises';

async function main() {
  console.log('🤖 AI SDK Examples');
  console.log('==================\n');
  
  try {
    const example = await select({
      message: 'Select an example to run:',
      options: [
        { value: 'chat', label: 'Interactive Chat Example' },
        { value: 'agent', label: 'Agent Usage Example' },
      ],
    }) as string;
    
    console.log('\n');
    
    switch (example) {
      case 'chat':
        await import('./chatExample');
        break;
      case 'agent':
        await import('./agentExample');
        break;
      default:
        console.log('Unknown example selected');
        break;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancel')) {
      console.log('\n👋 Goodbye!');
    } else {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

main().catch(console.error);