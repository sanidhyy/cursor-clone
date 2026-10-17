import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

const requestSchema = z.object({
  conversationId: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json();
    const { data, error } = requestSchema.safeParse(body);
    if (!data || error)
      return NextResponse.json({ error: 'Invalid Request' }, { status: BAD_REQUEST });

    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;
    const { conversationId, message } = data;

    const conversation = await convex.query(api.system.getConversationById, {
      conversationId: conversationId as Id<'conversations'>,
      internalKey,
    });
    if (!conversation)
      return NextResponse.json({ error: 'Conversation not found' }, { status: NOT_FOUND });

    const projectId = conversation.projectId;

    const processingMessages = await convex.query(api.system.processingMessages, {
      internalKey,
      projectId,
    });

    if (!!processingMessages.length) {
      await Promise.all(
        processingMessages.map(async (message) => {
          await inngest.send({
            name: 'message/cancel',
            data: {
              messageId: message._id,
            },
          });

          await convex.mutation(api.system.updateMessageStatus, {
            internalKey,
            messageId: message._id,
            status: 'cancelled',
          });
        })
      );
    }

    await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId: conversationId as Id<'conversations'>,
      projectId,
      role: 'user',
      content: message,
    });

    const assistantMessageId = await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId: conversationId as Id<'conversations'>,
      projectId,
      role: 'assistant',
      content: '',
      status: 'processing',
    });

    const event = await inngest.send({
      name: 'message/sent',
      data: {
        messageId: assistantMessageId,
        conversationId,
        projectId,
        message,
      },
    });

    return NextResponse.json({ eventId: event.ids[0], messageId: assistantMessageId });
  } catch (error) {
    console.error('[MESSAGES_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate message',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
