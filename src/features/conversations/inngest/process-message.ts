import { createAgent, createNetwork, createState, openai } from '@inngest/agent-kit';
import { NonRetriableError } from 'inngest';

import {
  DEFAULT_CONVERSATION_TITLE,
  LAST_RECENT_MESSAGES,
  MAX_AGENT_NETWORK_ITERATIONS,
  MAX_CODING_AGENT_COMPLETION_TOKENS,
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

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from '@/constants/prompts';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

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

        if (!message || message.role !== 'assistant') return;

        await convex.mutation(api.system.updateMessageContent, {
          internalKey,
          messageId,
          status: 'incomplete',
          content:
            'My apologies, I encountered an error while processing your request. Let me know if you need anything else!',
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
    if (!assistantMessage || assistantMessage.role !== 'assistant')
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

    const shouldGenerateTitle = conversation.title.trim() === DEFAULT_CONVERSATION_TITLE.trim();

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: 'title-generator',
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: openai({
          model: 'gpt-6-luna',
          defaultParameters: { max_completion_tokens: MAX_TITLE_AGENT_COMPLETION_TOKENS },
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

    const codingAgent = createAgent({
      name: 'polaris',
      description: 'An expert AI coding assistant',
      system: CODING_AGENT_SYSTEM_PROMPT,
      model: openai({
        model: 'gpt-5',
        defaultParameters: { max_completion_tokens: MAX_CODING_AGENT_COMPLETION_TOKENS },
      }),
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

    const network = createNetwork({
      name: 'polaris-network',
      agents: [codingAgent],
      maxIter: MAX_AGENT_NETWORK_ITERATIONS,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (message) => message.type === 'text' && message.role === 'assistant'
        );
        const hasToolCalls = lastResult?.output.some((message) => message.type === 'tool_call');

        if (hasTextResponse && !hasToolCalls) return undefined;
        return codingAgent;
      },
    });

    const state = createState(
      {},
      {
        messages: [
          ...recentMessages.map((item) => ({
            type: 'text' as const,
            role: item.role,
            content: formatMessageWithContext(item.content, item.context),
          })),
          {
            type: 'text',
            role: 'user',
            content: formatMessageWithContext(userMessage.content, userMessage.context),
          },
        ],
      }
    );
    // Agent Kit places state messages after the system/input prompt. Keep the
    // current user request last in state, with no duplicate input prompt.
    const result = await network.run('', { state });

    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(
      (message) => message.type === 'text' && message.role === 'assistant'
    );

    let assistantResponse = '';

    if (textMessage?.type === 'text') {
      assistantResponse =
        typeof textMessage.content === 'string'
          ? textMessage.content
          : textMessage.content.map((c) => c.text).join('');
    }

    const completed =
      !!assistantResponse.trim() && !lastResult?.output.some((item) => item.type === 'tool_call');
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
