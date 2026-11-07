import { LoadingState } from '@/components/loading-state';

export default function Loading() {
  return (
    <div className='h-screen'>
      <LoadingState label='Loading workspace...' />
    </div>
  );
}
