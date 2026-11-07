'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { AlertCircleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export class ErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Unable to load ${this.props.label}`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError)
      return (
        <div
          role='alert'
          className='flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-sm'
        >
          <AlertCircleIcon className='size-5 text-destructive' />
          <p>Unable to load {this.props.label}.</p>
          <Button size='sm' variant='outline' onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    return this.props.children;
  }
}
