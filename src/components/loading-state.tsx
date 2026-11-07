import { Spinner } from '@/components/ui/spinner';

export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => (
  <div
    role='status'
    className='flex h-full items-center justify-center gap-2 p-4 text-sm text-muted-foreground'
  >
    <Spinner className='size-4' />
    {label}
  </div>
);
