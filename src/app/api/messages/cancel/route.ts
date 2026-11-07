import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { projectRequestSchema } from '@/features/projects/schemas';

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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json();
    const { data, error } = projectRequestSchema.safeParse(body);
    if (!data || error)
      return NextResponse.json(
        { error: error?.issues[0]?.message || 'Invalid Request' },
        { status: BAD_REQUEST }
      );

    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;
    const { projectId } = data;

    const project = await convex.query(api.system.getProjectById, {
      internalKey,
      projectId: projectId as Id<'projects'>,
      ownerId: userId,
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: NOT_FOUND });

    const processingMessages = await convex.query(api.system.processingMessages, {
      internalKey,
      projectId: projectId as Id<'projects'>,
    });

    if (!processingMessages.length) return NextResponse.json({ messageIds: [] });

    const cancelledIds = await Promise.all(
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

        return message._id;
      })
    );

    return NextResponse.json({ messageIds: cancelledIds });
  } catch (error) {
    console.error('[MESSAGES_CANCEL_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate message',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
