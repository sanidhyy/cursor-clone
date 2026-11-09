import 'server-only';

import { NextResponse } from 'next/server';

import { createOpenAI } from '@ai-sdk/openai';

import {
  AI_SETTINGS_MAX_AGE,
  AI_SETTINGS_REQUIRED,
  AI_SETTINGS_REQUIRED_CODE,
} from '@/features/settings/constants';

import { api } from '@/../convex/_generated/api';
import { PRECONDITION_REQUIRED } from '@/constants/http-status-codes';
import { env } from '@/env/server';
import { convex } from '@/lib/convex-client';
import { decrypt } from '@/lib/encryption';

export class AISettingsRequiredError extends Error {
  constructor(message = AI_SETTINGS_REQUIRED) {
    super(message);
    this.name = 'AISettingsRequiredError';
  }
}

export const getOpenAI = async (ownerId: string) => {
  const settings = await convex.query(api.settings.getEncryptedAISettings, {
    internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
    ownerId,
  });

  // Enforce expiry here too: a cached Convex query may predate the expiry time.
  if (!settings || settings.updatedAt <= Date.now() - AI_SETTINGS_MAX_AGE)
    throw new AISettingsRequiredError();

  let apiKey: string;

  try {
    apiKey = decrypt(settings.apiKey);
  } catch {
    throw new AISettingsRequiredError(
      'Unable to read your saved API key. Please replace it in AI Settings.'
    );
  }

  return createOpenAI({ apiKey });
};

export const aiSettingsRequiredResponse = (error: unknown) =>
  error instanceof AISettingsRequiredError
    ? NextResponse.json(
        { error: error.message, code: AI_SETTINGS_REQUIRED_CODE },
        { status: PRECONDITION_REQUIRED }
      )
    : null;
