import { Spinner } from '@/components/ui/spinner';

export const AuthLoading = () => {
  return (
    <div className='flex h-screen items-center justify-center bg-background'>
      <Spinner className='size-6 text-ring' />
    </div>
  );
};
