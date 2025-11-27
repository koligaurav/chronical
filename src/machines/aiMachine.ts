
/**
 * This XState machine manages the flow of an AI text generator by 
 * organizing everything into clear states. It starts in idle, moves to generating 
 * when a request is made, and calls the AI through callGrok. If the call succeeds, 
 * it stores the generated text and goes to success; if it fails, it goes to failure and
 * saves the error. From success, the user can continue, and from failure they can retry or cancel.
 * Overall,it makes the AI request process predictable and easy to control.
 */
import { setup, assign, fromPromise } from 'xstate';

interface Context {
  error?: string | null;
  lastGenerated?: string | null;
}

interface GrokInput {
  text: string;
}

interface GrokResponse {
  generatedText: string;
}

type Events =
  | { type: 'GENERATE'; prompt?: string }
  | { type: 'CONTINUE' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

export const aiMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
  },
  actors: {
    callGrok: fromPromise<GrokResponse, GrokInput>(async () => {
      throw new Error("Not implemented");
    })
  },
}).createMachine({
  id: 'ai',
  initial: 'idle',
  context: {
    error: null,
    lastGenerated: null
  },
  states: {
    idle: {
      on: {
        GENERATE: 'generating'
      }
    },

    generating: {
      entry: assign({
        error: () => null
      }),

      invoke: {
        id: 'callGrok',
        src: 'callGrok',
        input: ({ context }) => ({ text: context.lastGenerated || '' }), 

        onDone: {
          target: 'success',
          actions: assign({
            lastGenerated: ({ event }) => event.output.generatedText
          })
        },

        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => (event.error as Error).message || 'Unknown error'
          })
        }
      }
    },

    success: {
      on: { CONTINUE: 'idle' }
    },

    failure: {
      on: {
        RETRY: 'generating',
        CANCEL: 'idle'
      }
    }
  }
});