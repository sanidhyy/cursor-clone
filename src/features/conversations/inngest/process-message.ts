import { convex } from '@/features/projects/lib/convex-client';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';

interface MessageEvent {
  messageId: Id<'messages'>;
}

export const processMessage = inngest.createFunction(
  {
    id: 'process-message',
    triggers: { event: 'message/sent' },
    cancelOn: [
      {
        event: 'message/cancel',
        if: 'event.data.messageId == async.data.messageId',
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

      await step.run('update-message-on-failure', async () => {
        await convex.mutation(api.system.updateMessageContent, {
          internalKey,
          messageId,
          content:
            'My apologies, I encountered an error while processing your request. Let me know if you need anything else!',
        });
      });
    },
  },
  async ({ event, step }) => {
    const { messageId } = event.data as MessageEvent;
    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

    await step.sleep('wait-for-ai-processing', '5s');
    await step.run('update-assistant-message', async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: 'AI processed this message',
      });
    });
  }
);
