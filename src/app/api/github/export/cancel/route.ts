import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

const requestSchema = z.object({
  projectId: z.string(),
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
    const { projectId } = data;

    const event = await inngest.send({
      name: 'github/export.cancel',
      data: {
        projectId,
      },
    });

    await convex.mutation(api.system.updateExportStatus, {
      internalKey,
      projectId: projectId as Id<'projects'>,
      status: 'cancelled',
    });

    return NextResponse.json({ eventId: event.ids[0], projectId });
  } catch (error) {
    console.error('[CANCEL_EXPORT_GITHUB_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel GitHub repo export',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
