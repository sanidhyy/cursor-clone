'use client';

import * as React from 'react';
import Link from 'next/link';

import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';
import { Navbar } from '@/features/projects/components/navbar';
import {
  DEFAULT_CONVERSATION_SIDEBAR_WIDTH,
  DEFAULT_MAIN_SIZE,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '@/features/projects/constants';
import { useProject } from '@/features/projects/hooks/use-projects';

import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';

interface ProjectIdLayoutViewProps extends Readonly<React.PropsWithChildren> {
  projectId: string;
}

export const ProjectIdLayoutView = ({ children, projectId }: ProjectIdLayoutViewProps) => {
  const project = useProject(projectId);

  if (project === undefined)
    return (
      <div className='h-screen'>
        <LoadingState label='Loading project...' />
      </div>
    );
  if (project === null)
    return (
      <div
        role='alert'
        className='flex h-screen flex-col items-center justify-center gap-4 p-6 text-center'
      >
        <p>This project is unavailable or you don’t have access.</p>
        <Button render={<Link href='/' />}>Back to projects</Button>
      </div>
    );

  return (
    <div className='flex h-screen w-full flex-col'>
      <Navbar projectId={projectId} />

      <div className='flex flex-1 overflow-hidden'>
        <Allotment
          className='flex-1'
          defaultSizes={[DEFAULT_CONVERSATION_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}
        >
          <Allotment.Pane
            snap
            minSize={MIN_SIDEBAR_WIDTH}
            maxSize={MAX_SIDEBAR_WIDTH}
            preferredSize={DEFAULT_CONVERSATION_SIDEBAR_WIDTH}
          >
            <ErrorBoundary key={projectId} label='the conversation'>
              <ConversationSidebar projectId={projectId} />
            </ErrorBoundary>
          </Allotment.Pane>

          <Allotment.Pane>{children}</Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
