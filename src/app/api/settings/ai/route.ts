import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { verifyAISettings } from '@/features/settings/actions';
import { AI_SETTINGS_MAX_AGE } from '@/features/settings/constants';
import { AISettingsSchema } from '@/features/settings/schemas/ai-settings-schema';

import { api } from '@/../convex/_generated/api';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { convex } from '@/lib/convex-client';
import { decrypt, encrypt } from '@/lib/encryption';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };

  try {
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED, headers });

    const settings = await convex.query(api.settings.getEncryptedAISettings, {
      internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
      ownerId: userId,
    });

    if (!settings || settings.updatedAt <= Date.now() - AI_SETTINGS_MAX_AGE)
      return NextResponse.json({ configured: false, apiKey: '', updatedAt: null }, { headers });

    return NextResponse.json(
      { configured: true, apiKey: decrypt(settings.apiKey), updatedAt: settings.updatedAt },
      { headers }
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to read your saved API key. Please try again or replace it in AI Settings.',
      },
      { status: INTERNAL_SERVER_ERROR, headers }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const { data, error } = AISettingsSchema.safeParse(await req.json().catch(() => null));

    if (!data || error)
      return NextResponse.json(
        { error: error?.issues[0]?.message || 'Invalid API key' },
        { status: BAD_REQUEST }
      );

    const verification = await verifyAISettings(data.apiKey);

    if (!verification.success)
      return NextResponse.json({ error: verification.error }, { status: BAD_REQUEST });

    await convex.mutation(api.settings.saveAISettings, {
      internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
      ownerId: userId,
      apiKey: encrypt(data.apiKey),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    await convex.mutation(api.settings.removeAISettings, {
      internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
      ownerId: userId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
