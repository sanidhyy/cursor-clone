import { useEffect, useState } from 'react';

import { CheckIcon, ChevronRightIcon, CircleIcon, XIcon } from 'lucide-react';

import type { Doc } from '@/../convex/_generated/dataModel';
import { Spinner } from '@/components/ui/spinner';

export const MessageProgress = ({ message }: { message: Doc<'messages'> }) => {
  const processing = message.status === 'processing';
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!processing) return;
    const update = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - message._creationTime) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [processing, message._creationTime]);

  const steps = message.steps ?? [];
  const active = steps.findLast((step) => step.status === 'running');
  const label = processing ? (active?.label ?? 'Waiting to start') : 'Activity';

  if (!processing && !steps.length) return null;

  return (
    <details className='group/progress w-full text-xs text-muted-foreground'>
      <summary className='flex cursor-pointer list-none items-center gap-2 rounded-sm py-1 outline-none focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'>
        {processing ? (
          <Spinner className='size-3' />
        ) : message.status === 'completed' ? (
          <CheckIcon className='size-3' />
        ) : message.status === 'incomplete' ? (
          <XIcon className='size-3 text-destructive' />
        ) : (
          <CircleIcon className='size-3' />
        )}
        <span role='status' aria-live='polite'>
          {label}
        </span>
        {processing && (
          <span className='tabular-nums' aria-live='off'>
            {elapsed}s
          </span>
        )}
        <ChevronRightIcon className='size-3 transition-transform group-open/progress:rotate-90' />
      </summary>
      <ol className='mt-1 flex max-h-48 flex-col gap-2 overflow-y-auto border-l pl-3'>
        {steps.map((step) => (
          <li key={step.id} className='flex items-center gap-2'>
            {step.status === 'running' && processing ? (
              <Spinner className='size-3' />
            ) : step.status === 'completed' ? (
              <CheckIcon className='size-3' />
            ) : step.status === 'failed' ? (
              <XIcon className='size-3 text-destructive' />
            ) : (
              <CircleIcon className='size-3' />
            )}
            <span>{step.label}</span>
            <span className='sr-only'>
              {step.status === 'running' && !processing ? 'Stopped' : step.status}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
};
