import { NextResponse, type NextRequest } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  PAYMENT_REQUIRED,
  UNAUTHORIZED,
} from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

const requestSchema = z.object({
  projectId: z.string(),
  repoName: z.string().min(1).max(100),
  visibility: z.enum(['public', 'private']).default('private'),
  description: z.string().max(350).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const hasPro = has({ plan: 'pro' });
    if (!hasPro)
      return NextResponse.json(
        { error: 'Pro plan required. Upgrade to export repositories.' },
        { status: PAYMENT_REQUIRED }
      );

    const body = await req.json();
    const { data, error } = requestSchema.safeParse(body);
    if (!data || error)
      return NextResponse.json({ error: 'Invalid Request' }, { status: BAD_REQUEST });

    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;
    const { projectId, repoName, visibility, description } = data;

    const project = await convex.query(api.system.getProjectById, {
      internalKey,
      projectId: projectId as Id<'projects'>,
      ownerId: userId,
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: NOT_FOUND });

    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, 'github');

    const githubToken = tokens.data[0]?.token || null;
    if (!githubToken)
      return NextResponse.json(
        { error: 'GitHub not connected. Please reconnect your GitHub account.' },
        { status: BAD_REQUEST }
      );

    const event = await inngest.send({
      name: 'github/export.repo',
      data: {
        projectId,
        ownerId: userId,
        repoName,
        visibility,
        description,
      },
    });

    return NextResponse.json({ eventId: event.ids[0], projectId });
  } catch (error) {
    console.error('[EXPORT_GITHUB_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export GitHub repo',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
