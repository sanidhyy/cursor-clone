import { XIcon } from 'lucide-react';

import type { CodeContext } from '@/features/conversations/schemas';

import { Button } from '@/components/ui/button';

interface CodeContextsProps {
  context: CodeContext[];
  onRemove?: (index: number) => void;
}

export const CodeContexts = ({ context, onRemove }: CodeContextsProps) => (
  <div className='flex flex-col gap-1'>
    {context.map((item, index) => (
      <div
        key={`${item.fileId}-${index}`}
        className='flex min-w-0 items-start gap-1 rounded-md border p-2 text-xs'
      >
        <details className='min-w-0 flex-1'>
          <summary className='cursor-pointer truncate font-mono' title={item.path}>
            {item.path}
          </summary>
          <pre className='mt-2 max-h-32 overflow-auto whitespace-pre-wrap'>{item.code}</pre>
        </details>
        {onRemove && (
          <Button
            type='button'
            size='icon-xs'
            variant='ghost'
            aria-label={`Remove ${item.path} selection`}
            onClick={() => onRemove(index)}
          >
            <XIcon className='size-3' />
          </Button>
        )}
      </div>
    ))}
  </div>
);
