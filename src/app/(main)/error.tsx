'use client';

import Link from 'next/link';

import { AlertCircleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function MainError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role='alert'
      className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'
    >
      <AlertCircleIcon className='size-6 text-destructive' />
      <p>Unable to load this page. Please try again.</p>
      <div className='flex gap-2'>
        <Button onClick={reset}>Try again</Button>
        <Button variant='outline' render={<Link href='/' />}>
          Home
        </Button>
      </div>
    </div>
  );
}
