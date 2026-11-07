import ky from 'ky';
import { z } from 'zod';

import { SUGGESTION_API_TIMEOUT } from '@/features/editor/constants';
import {
  suggestionRequestSchema,
  suggestionResponseSchema,
} from '@/features/editor/schemas/suggestion';

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;

type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

export const fetcher = async (
  payload: SuggestionRequest,
  signal: AbortSignal
): Promise<string | null> => {
  try {
    const { data: validatedPayload, error: validationError } =
      suggestionRequestSchema.safeParse(payload);

    if (!validatedPayload || validationError)
      throw new Error(validationError?.issues[0]?.message || 'Invalid Request');

    const response = await ky
      .post('/api/suggestion', {
        json: validatedPayload,
        signal,
        timeout: SUGGESTION_API_TIMEOUT,
        retry: 0, // do not retry
      })
      .json<SuggestionResponse>();

    const { data: validatedResponse, success: validatedResponseSuccess } =
      suggestionResponseSchema.safeParse(response);

    if (!validatedResponse || !validatedResponseSuccess) throw new Error('Invalid Response');

    return validatedResponse.suggestion || null;
  } catch {
    return null;
  }
};
