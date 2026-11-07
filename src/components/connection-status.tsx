'use client';

import { useConvexConnectionState } from 'convex/react';

export const ConnectionStatus = () => {
  const { isWebSocketConnected, hasEverConnected, connectionRetries } = useConvexConnectionState();

  if (isWebSocketConnected || (!hasEverConnected && connectionRetries === 0)) return null;

  return (
    <div
      role='status'
      className='fixed inset-x-0 top-0 z-50 border-b bg-background px-3 py-2 text-center text-xs text-destructive'
    >
      {hasEverConnected ? 'Connection lost. Reconnecting...' : 'Unable to connect. Retrying...'}{' '}
      Some changes may still be waiting to save.
    </div>
  );
};
