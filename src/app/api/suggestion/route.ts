import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { generateText, Output } from 'ai';

import {
  suggestionRequestSchema,
  suggestionResponseSchema,
} from '@/features/editor/schemas/suggestion';
import { aiSettingsRequiredResponse, getOpenAI } from '@/features/settings/server/ai-settings';
import { getAISettingsErrorMessage } from '@/features/settings/server/errors';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { SUGGESTION_PROMPT } from '@/constants/prompts';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json().catch(() => null);

    const { data: validatedData, error: validationError } = suggestionRequestSchema.safeParse(body);

    if (!validatedData || validationError)
      return NextResponse.json(
        { error: validationError?.issues[0]?.message || 'Invalid Request' },
        { status: BAD_REQUEST }
      );

    const openai = await getOpenAI(userId);

    const prompt = SUGGESTION_PROMPT(validatedData);

    const { output } = await generateText({
      model: openai('gpt-6-luna'),
      prompt,
      output: Output.object({
        schema: suggestionResponseSchema,
      }),
    });

    return NextResponse.json({ suggestion: output.suggestion });
  } catch (error) {
    const settingsResponse = aiSettingsRequiredResponse(error);

    if (settingsResponse) return settingsResponse;

    return NextResponse.json(
      {
        error: getAISettingsErrorMessage(error),
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
