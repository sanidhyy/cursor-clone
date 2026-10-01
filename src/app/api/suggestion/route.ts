import { NextResponse, type NextRequest } from 'next/server';

import { openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import { generateText, Output } from 'ai';

import { suggestionRequestSchema, suggestionResponseSchema } from '@/features/editor/schemas';

import { MAX_OUTPUT_TOKENS } from '@/constants';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { SUGGESTION_PROMPT, SUGGESTION_SYSTEM_PROMPT } from '@/constants/prompts';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json();

    const { data: validatedData, success: validatedDataSuccess } =
      suggestionRequestSchema.safeParse(body);

    if (!validatedData || !validatedDataSuccess)
      return NextResponse.json({ error: 'Invalid Request' }, { status: BAD_REQUEST });

    const prompt = SUGGESTION_PROMPT(validatedData);

    const { output } = await generateText({
      model: openai('gpt-5.4-nano'),
      system: SUGGESTION_SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      output: Output.object({
        schema: suggestionResponseSchema,
      }),
    });

    return NextResponse.json({ suggestion: output.suggestion });
  } catch (error) {
    console.error('[SUGGESTION_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate suggestion',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
