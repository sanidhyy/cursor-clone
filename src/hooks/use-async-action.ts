import { useCallback, useRef, useState } from 'react';

import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/errors';

export const useAsyncAction = (errorMessage: string) => {
  const [isPending, setIsPending] = useState(false);
  const pending = useRef(false);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      if (pending.current) return false;

      pending.current = true;
      setIsPending(true);

      try {
        await action();

        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, errorMessage));

        return false;
      } finally {
        pending.current = false;
        setIsPending(false);
      }
    },
    [errorMessage]
  );

  return { isPending, run };
};
