import { streamText, tool, type ModelMessage } from 'ai';
import { NonRetriableError, type GetStepTools } from 'inngest';

import {
  MAX_AGENT_NETWORK_ITERATIONS,
  MAX_CODING_AGENT_COMPLETION_TOKENS,
  MAX_REASONING_SUMMARY_CHARACTERS,
} from '@/features/conversations/constants';
import { AISettingsRequiredError, getOpenAI } from '@/features/settings/server/ai-settings';
import { getAISettingsErrorMessage } from '@/features/settings/server/errors';

import { api } from '@/../convex/_generated/api';
import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { CODING_AGENT_SYSTEM_PROMPT } from '@/constants/prompts';
import type { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

import type { createConversationTool } from './tools/create-conversation-tool';

type ConversationTool = ReturnType<typeof createConversationTool>;

type ProgressStep = NonNullable<Doc<'messages'>['steps']>[number];

const toolLabels: Record<string, string> = {
  listFiles: 'Exploring project files',
  readFiles: 'Reading files',
  updateFile: 'Updating a file',
  createFiles: 'Creating files',
  createFolder: 'Creating a folder',
  renameFile: 'Renaming a file',
  deleteFiles: 'Deleting files',
  'scrape-urls': 'Reading web references',
};

export const streamResponse = async ({
  ownerId,
  messageId,
  internalKey,
  messages,
  tools,
  step,
}: {
  ownerId: string;
  messageId: Id<'messages'>;
  internalKey: string;
  messages: ModelMessage[];
  tools: ConversationTool[];
  step: GetStepTools<typeof inngest>;
}) => {
  const definitions = Object.fromEntries(
    tools.map((definition) => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: definition.parameters,
      }),
    ])
  );

  const publish = async (progress: {
    content?: string;
    step?: ProgressStep;
    reasoningSummary?: { id: string; text: string };
  }) => {
    const active = await convex.mutation(api.system.updateMessageProgress, {
      internalKey,
      messageId,
      ...progress,
    });

    if (!active) throw new NonRetriableError('Request is no longer active');
  };

  let content = '';
  let summaryCharacters = 0;

  for (let iteration = 0; iteration < MAX_AGENT_NETWORK_ITERATIONS; iteration++) {
    const modelStepId = `model-${iteration}`;
    const prefix = content ? `${content}\n\n` : '';

    const result = await step.run(`stream-model-${iteration}`, async () => {
      let text = '';
      let summary = '';
      let lastReasoningPart: string | undefined;
      let lastPublished = 0;
      let label = iteration === 0 ? 'Analyzing your request' : 'Planning the next step';

      await publish({
        content,
        step: { id: modelStepId, label, status: 'running' },
        reasoningSummary: { id: modelStepId, text: '' },
      });

      const controller = new AbortController();

      try {
        const openai = await getOpenAI(ownerId);
        const response = streamText({
          abortSignal: controller.signal,
          model: openai.responses('gpt-5'),
          system: CODING_AGENT_SYSTEM_PROMPT,
          messages,
          tools: definitions,
          maxOutputTokens: MAX_CODING_AGENT_COMPLETION_TOKENS,
          providerOptions: {
            openai: { strictJsonSchema: false, reasoningSummary: 'auto', store: false },
          },
          maxRetries: 0,
          onError: () => {},
        });

        for await (const chunk of response.fullStream) {
          if (chunk.type === 'error') throw chunk.error;

          let changedPhase = false;

          if (chunk.type === 'text-delta') {
            changedPhase = !text;
            text += chunk.text;
            label = 'Writing response';
          } else if (chunk.type === 'reasoning-delta') {
            changedPhase = label !== 'Thinking';

            const separator = lastReasoningPart && lastReasoningPart !== chunk.id ? '\n\n' : '';

            summary = (summary + separator + chunk.text).slice(
              0,
              Math.max(0, MAX_REASONING_SUMMARY_CHARACTERS - summaryCharacters)
            );
            lastReasoningPart = chunk.id;
            label = 'Thinking';
          } else if (chunk.type === 'tool-input-start') {
            changedPhase = true;
            label = `Preparing: ${toolLabels[chunk.toolName] ?? 'Using a tool'}`;
          }

          // Responses exposes reasoning summaries through these deltas. Opaque
          // reasoning context is kept only in the server's durable checkpoints.
          if (changedPhase || Date.now() - lastPublished >= 250) {
            await publish({
              content: prefix + text,
              step: { id: modelStepId, label, status: 'running' },
              reasoningSummary: { id: modelStepId, text: summary },
            });

            lastPublished = Date.now();
          }
        }

        const toolCalls = await response.toolCalls;
        const finishReason = await response.finishReason;

        const reasoning = (await response.reasoning)
          .filter((part) => part.type === 'reasoning')
          .map((part) => ({
            type: 'reasoning' as const,
            text: part.text,
            providerOptions: part.providerMetadata,
          }));

        await publish({
          content: prefix + text,
          step: { id: modelStepId, label, status: 'completed' },
          reasoningSummary: { id: modelStepId, text: summary },
        });

        return { text, toolCalls, finishReason, reasoning, summaryLength: summary.length };
      } catch (error) {
        controller.abort();

        if (error instanceof NonRetriableError) throw error;

        throw error instanceof AISettingsRequiredError
          ? new NonRetriableError(error.message)
          : new Error(getAISettingsErrorMessage(error));
      }
    });

    content = prefix + result.text;
    summaryCharacters += result.summaryLength;

    messages.push({
      role: 'assistant',
      content: [
        ...result.reasoning,
        ...(result.text ? [{ type: 'text' as const, text: result.text }] : []),
        ...result.toolCalls.map((call) => ({
          type: 'tool-call' as const,
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          input: call.input,
          providerOptions: call.providerMetadata,
        })),
      ],
    });

    if (!result.toolCalls.length) {
      return { content, completed: !!result.text.trim() && result.finishReason === 'stop' };
    }

    for (const [index, call] of result.toolCalls.entries()) {
      const id = `tool-${iteration}-${index}`;
      const label = toolLabels[call.toolName] ?? 'Using a tool';

      await step.run(`start-${id}`, () => publish({ step: { id, label, status: 'running' } }));

      const definition = tools.find((candidate) => candidate.name === call.toolName);

      const output =
        !call.invalid && definition
          ? await definition.handler(call.input, { step })
          : 'Error: Invalid tool arguments. Correct them and try again.';

      const value = typeof output === 'string' ? output : JSON.stringify(output ?? null);
      const failed = /^error\b/i.test(value) || /"error"\s*:/.test(value);

      await step.run(`finish-${id}`, () =>
        publish({ step: { id, label, status: failed ? 'failed' : 'completed' } })
      );

      messages.push({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            output: { type: 'text', value },
          },
        ],
      });
    }
  }

  return { content, completed: false };
};
