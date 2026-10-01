export const DEBOUNCE_MS = 1500; // debounce time for saving file
export const SUGGESTION_DEBOUNCE_MS = 300; // debounce time for showing inline suggestions

export const SUGGESTION_API_TIMEOUT = 10_000; // timeout for inline suggestions api request

// inline suggestions request payload lengths
export const MAX_SUGGESTION_PAYLOAD_LENGTH = {
  FILE_NAME: 255,
  CODE: 100_000,
  CURRENT_LINE: 10_000,
  PREVIOUS_LINES: 20_000,
  TEXT_BEFORE_CURSOR: 10_000,
  TEXT_AFTER_CURSOR: 10_000,
  NEXT_LINES: 20_000,
};
