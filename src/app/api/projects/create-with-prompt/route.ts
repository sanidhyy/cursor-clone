import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

import { DEFAULT_CONVERSATION_TITLE } from '@/features/conversations/constants';
import { createProjectRequestSchema } from '@/features/projects/schemas';

import { api } from '@/../convex/_generated/api';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json().catch(() => null);
    const { data, error } = createProjectRequestSchema.safeParse(body);

    if (!data || error)
      return NextResponse.json(
        { error: error?.issues[0]?.message || 'Invalid Request' },
        { status: BAD_REQUEST }
      );

    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;
    const { prompt } = data;

    const projectName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors],
      separator: '-',
      length: 3,
    });

    const { projectId, conversationId } = await convex.mutation(
      api.system.createProjectWithConversation,
      {
        internalKey,
        projectName,
        conversationTitle: DEFAULT_CONVERSATION_TITLE,
        ownerId: userId,
      }
    );

    const userMessageId = await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId,
      projectId,
      role: 'user',
      content: prompt,
    });

    const assistantMessageId = await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId,
      projectId,
      role: 'assistant',
      content: '',
      status: 'processing',
    });

    const event = await inngest.send({
      name: 'message/sent',
      data: {
        messageId: assistantMessageId,
        userMessageId,
        ownerId: userId,
        conversationId,
        projectId,
        message: prompt,
      },
    });

    return NextResponse.json({ eventId: event.ids[0], projectId });
  } catch (error) {
    console.error('[CREATE_PROJECT_WITH_PROMPT_ERROR]: ', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
