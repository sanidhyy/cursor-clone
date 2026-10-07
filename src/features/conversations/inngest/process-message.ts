import { createAgent, openai } from '@inngest/agent-kit';
import { NonRetriableError } from 'inngest';

import {
  DEFAULT_CONVERSATION_TITLE,
  LAST_RECENT_MESSAGES,
} from '@/features/conversations/constants';
import { convex } from '@/features/projects/lib/convex-client';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from '@/constants/prompts';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';

interface MessageEvent {
  messageId: Id<'messages'>;
  conversationId: Id<'conversations'>;
  projectId: Id<'projects'>;
  message: string;
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
    const { messageId, conversationId, projectId, message } = event.data as MessageEvent;
    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

    await step.sleep('wait-for-db-sync', '1s');

    const conversation = await step.run('get-conversation', async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) throw new NonRetriableError('Conversation not found');

    const recentMessages = await step.run('get-recent-messages', async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: LAST_RECENT_MESSAGES,
      });
    });

    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    const contextMessages = recentMessages.filter(
      (message) => message._id !== messageId && !!message.content.trim()
    );

    if (!!contextMessages.length) {
      const historyText = contextMessages
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join('\n\n');

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n
        ## Current Request: \nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    const shouldGenerateTitle = conversation.title.trim() === DEFAULT_CONVERSATION_TITLE.trim();

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: 'title-generator',
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: openai({
          model: 'gpt-6-luna',
          defaultParameters: { max_completion_tokens: 50 },
        }),
      });

      const { output } = await titleAgent.run(message, { step });

      const textMessage = output.find(
        (message) => message.type === 'text' && message.role === 'assistant'
      );

      if (textMessage?.type === 'text') {
        const title =
          typeof textMessage.content === 'string'
            ? textMessage.content.trim()
            : textMessage.content
                .map((content) => content.text)
                .join('')
                .trim();

        if (!!title.trim()) {
          await step.run('update-conversation-title', async () => {
            await convex.mutation(api.system.updateConversationTitle, {
              internalKey,
              conversationId,
              title: title.trim(),
            });
          });
        }
      }
    }

    await step.run('update-assistant-message', async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: 'AI processed this message',
      });
    });
  }
);
