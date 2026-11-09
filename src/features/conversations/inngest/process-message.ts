import { generateText } from 'ai';
import { NonRetriableError } from 'inngest';

import {
  DEFAULT_CONVERSATION_TITLE,
  LAST_RECENT_MESSAGES,
  MAX_TITLE_AGENT_COMPLETION_TOKENS,
} from '@/features/conversations/constants';
import { createCreateFilesTool } from '@/features/conversations/inngest/tools/create-files';
import { createCreateFolderTool } from '@/features/conversations/inngest/tools/create-folder';
import { createDeleteFilesTool } from '@/features/conversations/inngest/tools/delete-files';
import { createListFilesTool } from '@/features/conversations/inngest/tools/list-files';
import { createReadFilesTool } from '@/features/conversations/inngest/tools/read-files';
import { createRenameFileTool } from '@/features/conversations/inngest/tools/rename-file';
import { createScrapeUrlsTool } from '@/features/conversations/inngest/tools/scrape-urls';
import { createUpdateFileTool } from '@/features/conversations/inngest/tools/update-file';
import { formatMessageWithContext } from '@/features/conversations/lib/utils';
import { AISettingsRequiredError, getOpenAI } from '@/features/settings/server/ai-settings';
import { getAISettingsErrorMessage } from '@/features/settings/server/errors';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { TITLE_GENERATOR_SYSTEM_PROMPT } from '@/constants/prompts';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

import { streamResponse } from './stream-response';

interface MessageEvent {
  ownerId: string;
  messageId: Id<'messages'>;
  userMessageId: Id<'messages'>;
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
      const { messageId, conversationId, projectId, ownerId } = event.data.event
        .data as MessageEvent;

      const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

      await step.run('update-message-on-failure', async () => {
        const conversation = await convex.query(api.system.getConversationById, {
          internalKey,
          conversationId,
          ownerId,
        });

        if (!conversation || conversation.projectId !== projectId) return;

        const message = await convex.query(api.system.getMessageById, {
          internalKey,
          messageId,
          projectId,
          conversationId,
        });

        if (!message || message.role !== 'assistant' || message.status !== 'processing') return;

        await convex.mutation(api.system.updateMessageContent, {
          internalKey,
          messageId,
          status: 'incomplete',
          content: [
            message.content,
            'I encountered an error before finishing. Some changes may already be applied; review them and send a follow-up to continue.',
          ]
            .filter(Boolean)
            .join('\n\n'),
        });
      });
    },
  },
  async ({ event, step }) => {
    const { messageId, userMessageId, conversationId, projectId, message, ownerId } =
      event.data as MessageEvent;
    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

    await step.sleep('wait-for-db-sync', '1s');

    const conversation = await step.run('authorize-conversation', async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
        ownerId,
      });
    });

    if (!conversation || conversation.projectId !== projectId)
      throw new NonRetriableError('Conversation not found');

    const assistantMessage = await step.run('get-assistant-message', async () => {
      return await convex.query(api.system.getMessageById, {
        internalKey,
        messageId,
        projectId,
        conversationId,
      });
    });

    if (
      !assistantMessage ||
      assistantMessage.role !== 'assistant' ||
      assistantMessage.status !== 'processing'
    )
      throw new NonRetriableError('Message not found');

    const userMessage = await step.run('get-user-message', async () => {
      return await convex.query(api.system.getMessageById, {
        internalKey,
        messageId: userMessageId,
        projectId,
        conversationId,
      });
    });

    if (!userMessage || userMessage.role !== 'user')
      throw new NonRetriableError('Message not found');

    const recentMessages = await step.run('get-recent-messages', async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: LAST_RECENT_MESSAGES,
        beforeMessageId: userMessageId,
      });
    });

    await step.run('prepare-response', () =>
      convex.mutation(api.system.updateMessageProgress, {
        internalKey,
        messageId,
        step: { id: 'prepare', label: 'Preparing conversation', status: 'running' },
      })
    );

    const shouldGenerateTitle = conversation.title.trim() === DEFAULT_CONVERSATION_TITLE.trim();

    if (shouldGenerateTitle) {
      const title = await step.run('generate-conversation-title', async () => {
        try {
          const openai = await getOpenAI(ownerId);
          const { text } = await generateText({
            model: openai.chat('gpt-6-luna'),
            system: TITLE_GENERATOR_SYSTEM_PROMPT,
            prompt: message,
            maxOutputTokens: MAX_TITLE_AGENT_COMPLETION_TOKENS,
            providerOptions: { openai: { reasoningEffort: 'none' } },
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(30_000),
          });

          return text.trim();
        } catch (error) {
          throw error instanceof AISettingsRequiredError
            ? new NonRetriableError(error.message)
            : new Error(getAISettingsErrorMessage(error));
        }
      });

      if (title) {
        await step.run('update-conversation-title', () =>
          convex.mutation(api.system.updateConversationTitle, {
            internalKey,
            conversationId,
            title,
          })
        );
      }
    }

    await step.run('conversation-ready', () =>
      convex.mutation(api.system.updateMessageProgress, {
        internalKey,
        messageId,
        step: { id: 'prepare', label: 'Conversation ready', status: 'completed' },
      })
    );

    const result = await streamResponse({
      ownerId,
      internalKey,
      messageId,
      step,
      messages: [
        ...recentMessages.map((item) => ({
          role: item.role,
          content: formatMessageWithContext(item.content, item.context),
        })),
        {
          role: 'user',
          content: formatMessageWithContext(userMessage.content, userMessage.context),
        },
      ],
      tools: [
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey, projectId }),
        createUpdateFileTool({ internalKey, projectId }),
        createCreateFilesTool({ internalKey, projectId }),
        createCreateFolderTool({ internalKey, projectId }),
        createRenameFileTool({ internalKey, projectId }),
        createDeleteFilesTool({ internalKey, projectId }),
        createScrapeUrlsTool(),
      ],
    });

    let assistantResponse = result.content;
    const completed = result.completed;

    if (!completed) {
      assistantResponse = [
        assistantResponse,
        'I stopped before completing the request. Some changes may already be applied; review them and send a follow-up to continue.',
      ]
        .filter(Boolean)
        .join('\n\n');
    }

    await step.run('update-assistant-message', async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
        status: completed ? 'completed' : 'incomplete',
      });
    });

    return { messageId, conversationId };
  }
);
