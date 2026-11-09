import { NextResponse, type NextRequest } from 'next/server';

import { api } from '@/../convex/_generated/api';
import { INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { convex } from '@/lib/convex-client';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

  try {
    await convex.mutation(api.settings.removeExpiredAISettings, {
      internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
    });

    return NextResponse.json({ status: OK });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete AI Settings' },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
