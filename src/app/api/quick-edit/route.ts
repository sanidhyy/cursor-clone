import { NextResponse, type NextRequest } from 'next/server';

import { openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import { generateText, Output } from 'ai';

import {
  quickEditRequestSchema,
  quickEditResponseSchema,
} from '@/features/editor/schemas/quick-edit';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '@/constants/http-status-codes';
import { QUICK_EDIT_PROMPT } from '@/constants/prompts';
import { firecrawl } from '@/lib/firecrawl';

const URL_REGEX = /https?:\/\/[^\s)>\]]+/g;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

    const body = await req.json();

    const { data: validatedData, success: validatedDataSuccess } =
      quickEditRequestSchema.safeParse(body);

    if (!validatedData || !validatedDataSuccess)
      return NextResponse.json({ error: 'Invalid Request' }, { status: BAD_REQUEST });

    const urls: string[] = validatedData.instruction.match(URL_REGEX) || [];
    let documentationContext = '';

    if (urls.length > 0) {
      const scrapedResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const result = await firecrawl.scrape(url, {
              formats: ['markdown'],
            });

            if (result.markdown) return `<doc url="${url}">\n${result.markdown}\n</doc>`;

            return null;
          } catch {
            return null;
          }
        })
      );

      const validResults = scrapedResults.filter(Boolean);

      if (validResults.length > 0)
        documentationContext = `<documentation>\n${validResults.join('\n\n')}\n</documentation>`;
    }

    const prompt = QUICK_EDIT_PROMPT({
      ...validatedData,
      documentation: documentationContext,
    });

    const { output } = await generateText({
      model: openai('gpt-6-luna'),
      output: Output.object({ schema: quickEditResponseSchema }),
      prompt,
    });

    return NextResponse.json({ editedCode: output.editedCode });
  } catch (error) {
    console.error('[QUICK_EDIT_ERROR]: ', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate edit',
      },
      { status: INTERNAL_SERVER_ERROR }
    );
  }
}
