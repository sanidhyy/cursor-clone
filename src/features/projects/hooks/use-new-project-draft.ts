import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'polaris:new-project-prompt';
const SAVE_DELAY = 500;

export const useNewProjectDraft = () => {
  const [input, setInputState] = useState('');
  const draft = useRef('');
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(() => {
    if (!dirty.current) return;

    try {
      if (draft.current) window.localStorage.setItem(STORAGE_KEY, draft.current);
      else window.localStorage.removeItem(STORAGE_KEY);

      dirty.current = false;
    } catch {
      // Keep the form usable when browser storage is unavailable or full.
    }
  }, []);

  useEffect(() => {
    if (!dirty.current) {
      try {
        draft.current = window.localStorage.getItem(STORAGE_KEY) ?? '';
        setInputState(draft.current);
      } catch {
        // A draft can still be edited without access to browser storage.
      }
    }

    const flush = () => {
      if (timer.current !== null) clearTimeout(timer.current);

      timer.current = null;

      persist();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
      flush();
    };
  }, [persist]);

  const setInput = useCallback(
    (value: string) => {
      draft.current = value;
      dirty.current = true;

      setInputState(value);

      if (timer.current !== null) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        timer.current = null;

        persist();
      }, SAVE_DELAY);
    },
    [persist]
  );

  const clearDraft = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);

    timer.current = null;
    draft.current = '';
    dirty.current = true;

    setInputState('');
    persist();
  }, [persist]);

  return { input, setInput, clearDraft };
};
