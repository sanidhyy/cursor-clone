import ky from 'ky';
import { toast } from 'sonner';
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
    const { data: validatedPayload, success: validatedPayloadSuccess } =
      suggestionRequestSchema.safeParse(payload);

    if (!validatedPayload || !validatedPayloadSuccess) throw new Error('Invalid Request');

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
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null;

    toast.error(error instanceof Error ? error.message : 'Failed to fetch AI completion');
    return null;
  }
};
