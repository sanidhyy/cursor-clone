'use client';

import * as React from 'react';

import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

import { Navbar } from '@/features/projects/components/navbar';
import {
  DEFAULT_CONVERSATION_SIDEBAR_WIDTH,
  DEFAULT_MAIN_SIZE,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '@/features/projects/constants';

interface ProjectIdLayoutViewProps extends Readonly<React.PropsWithChildren> {
  projectId: string;
}

export const ProjectIdLayoutView = ({ children, projectId }: ProjectIdLayoutViewProps) => {
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
            <div>Conversation Sidebar</div>
          </Allotment.Pane>

          <Allotment.Pane>{children}</Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
