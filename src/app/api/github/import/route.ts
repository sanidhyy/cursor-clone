import { NextResponse, type NextRequest } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';

import { api } from '@/../convex/_generated/api';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  PAYMENT_REQUIRED,
  UNAUTHORIZED,
} from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';
import { parseGitHubUrl } from '@/lib/utils';

const requestSchema = z.object({
  url: z.url(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const hasPro = has({ plan: 'pro' });
    if (!hasPro)
      return NextResponse.json(
        { error: 'Pro plan required. Upgrade to import repositories.' },
        { status: PAYMENT_REQUIRED }
      );

    const body = await req.json();
    const { data, error } = requestSchema.safeParse(body);
    if (!data || error)
      return NextResponse.json({ error: 'Invalid Request' }, { status: BAD_REQUEST });

    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;
    const { url } = data;

    const parsedGitHubUrlData = parseGitHubUrl(url);
    if (!parsedGitHubUrlData)
      return NextResponse.json({ error: 'Invalid GitHub Url' }, { status: BAD_REQUEST });

    const { owner, repo } = parsedGitHubUrlData;

    const clerk = await clerkClient();
    const tokens = await clerk.users.getUserOauthAccessToken(userId, 'github');

    const githubToken = tokens.data[0]?.token || null;
    if (!githubToken)
      return NextResponse.json(
        { error: 'GitHub not connected. Please reconnect your GitHub account.' },
        { status: BAD_REQUEST }
      );

    const projectId = await convex.mutation(api.system.createProject, {
      internalKey,
      name: repo,
      ownerId: userId,
    });

    const event = await inngest.send({
      name: 'github/import.repo',
      data: {
        owner,
        ownerId: userId,
        repo,
        projectId,
      },
    });

    return NextResponse.json({ eventId: event.ids[0], projectId });
  } catch (error) {
    console.error('[IMPORT_GITHUB_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import GitHub repo',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
