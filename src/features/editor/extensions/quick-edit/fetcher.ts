import ky from 'ky';
import { toast } from 'sonner';
import { z } from 'zod';

import { QUICK_EDIT_API_TIMEOUT } from '@/features/editor/constants';
import {
  quickEditRequestSchema,
  quickEditResponseSchema,
} from '@/features/editor/schemas/quick-edit';

type QuickEditRequest = z.infer<typeof quickEditRequestSchema>;
type QuickEditResponse = z.infer<typeof quickEditResponseSchema>;

export const fetcher = async (
  payload: QuickEditRequest,
  signal: AbortSignal
): Promise<string | null> => {
  try {
    const { data: validatedPayload, success: validatedPayloadSuccess } =
      quickEditRequestSchema.safeParse(payload);

    if (!validatedPayload || !validatedPayloadSuccess) throw new Error('Invalid Request');

    const response = await ky
      .post('/api/quick-edit', {
        json: validatedPayload,
        signal,
        timeout: QUICK_EDIT_API_TIMEOUT,
        retry: 0, // do not retry
      })
      .json<QuickEditResponse>();

    const { data: validatedResponse, success: validatedResponseSuccess } =
      quickEditResponseSchema.safeParse(response);

    if (!validatedResponse || !validatedResponseSuccess) throw new Error('Invalid Response');

    return validatedResponse.editedCode || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null;

    toast.error(error instanceof Error ? error.message : 'Failed to fetch AI quick edit');
    return null;
  }
};
