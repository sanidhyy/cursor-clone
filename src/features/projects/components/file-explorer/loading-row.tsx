import * as React from 'react';

import { cn } from 'cn';

import { getItemPadding } from '@/features/projects/lib/utils';

import { Spinner } from '@/components/ui/spinner';

interface LoadingRowProps extends React.ComponentProps<'div'> {
  level?: number;
}

export const LoadingRow = ({ className, level = 0, style, ...props }: LoadingRowProps) => {
  return (
    <div
      className={cn('flex items-center justify-center py-2 text-muted-foreground', className)}
      style={{
        paddingLeft: getItemPadding(level, true),
        ...style,
      }}
      {...props}
    >
      <Spinner className='ml-0.5 size-4 text-ring' />
    </div>
  );
};
