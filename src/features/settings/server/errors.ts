import 'server-only';

import { APICallError } from 'ai';

export const getAISettingsErrorMessage = (error: unknown): string => {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401) return 'Invalid API key. Please check your key and try again';

    if (error.statusCode === 429) {
      const isQuota = /insufficient_quota|exceeded your current quota|quota|billing/i.test(
        error.responseBody || error.message
      );

      return isQuota
        ? 'Not enough credits. Please purchase more credits and try again'
        : 'Rate limit reached. Please try again in a moment';
    }

    if (error.statusCode === 403 || error.statusCode === 404)
      return 'This API key does not have access to the requested model. Check your OpenAI project permissions.';

    if (error.statusCode && error.statusCode >= 500)
      return 'OpenAI is temporarily unavailable. Please try again in a moment';
  }

  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
    return 'The request timed out. Please try again.';

  return 'Unable to complete the OpenAI request. Please check your key and try again.';
};
