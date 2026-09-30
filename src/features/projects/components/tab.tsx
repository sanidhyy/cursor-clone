import * as React from 'react';

import { cn } from 'cn';

interface TabProps extends React.ComponentProps<'button'> {
  label: string;
  isActive: boolean;
}

export const Tab = ({ label, isActive, onClick, className, ...props }: TabProps) => {
  return (
    <button
      className={cn(
        'flex h-full cursor-pointer items-center gap-2 border-r px-3 text-muted-foreground hover:bg-accent/30',
        isActive && 'bg-background text-foreground',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className='text-sm'>{label}</span>
    </button>
  );
};
