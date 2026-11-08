import { BrainIcon, ChevronRightIcon } from 'lucide-react';

import type { Doc } from '@/../convex/_generated/dataModel';
import { MessageResponse } from '@/components/ai-elements/message';
import { Spinner } from '@/components/ui/spinner';

export const MessageThinking = ({ message }: { message: Doc<'messages'> }) => {
  const summaries = message.reasoningSummaries?.filter((summary) => summary.text.trim());

  if (!summaries?.length) return null;

  const processing = message.status === 'processing';

  const thinking =
    processing &&
    message.steps?.some((step) => step.status === 'running' && step.label === 'Thinking');

  return (
    <details open={processing} className='group/thinking w-full text-xs text-muted-foreground'>
      <summary className='flex cursor-pointer list-none items-center gap-2 rounded-sm py-1 outline-none focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'>
        {thinking ? <Spinner className='size-3' /> : <BrainIcon className='size-3' />}
        <span>{thinking ? 'Thinking' : 'Thinking summary'}</span>
        <ChevronRightIcon className='size-3 transition-transform group-open/thinking:rotate-90' />
      </summary>
      <div className='mt-1 flex max-h-64 flex-col gap-3 overflow-y-auto border-l pl-3'>
        {summaries.map((summary, index) => (
          <div key={summary.id}>
            {summaries.length > 1 && <p className='mb-1 font-medium'>Step {index + 1}</p>}
            <MessageResponse
              className='text-xs'
              isAnimating={!!thinking && index === summaries.length - 1}
            >
              {summary.text}
            </MessageResponse>
          </div>
        ))}
      </div>
    </details>
  );
};
