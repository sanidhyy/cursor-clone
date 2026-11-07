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
import { convex } from '@/lib/convex-client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json().catch(() => null);
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

    await convex.mutation(api.system.updateExportStatus, {
      internalKey,
      projectId: projectId as Id<'projects'>,
      status: undefined,
      repoUrl: undefined,
    });

    return NextResponse.json({ projectId });
  } catch (error) {
    console.error('[RESET_EXPORT_GITHUB_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reset GitHub repo export',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
