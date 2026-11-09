import 'server-only';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { getAISettingsErrorMessage } from '@/features/settings/server/errors';

export const verifyAISettings = async (apiKey: string) => {
  try {
    const openai = createOpenAI({ apiKey });

    const completion = await generateText({
      model: openai.chat('gpt-4o-mini'),
      maxOutputTokens: 5,
      messages: [{ content: 'hi', role: 'user' }],
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(20_000),
    });

    if (!completion.text.trim()) return { error: 'No response from API', success: false };

    return { error: null, success: true };
  } catch (error) {
    return { error: getAISettingsErrorMessage(error), success: false };
  }
};
