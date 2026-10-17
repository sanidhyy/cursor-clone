'use client';

import { useState } from 'react';

import { Allotment } from 'allotment';
import { cn } from 'cn';

import { EditorView } from '@/features/editor/components/editor-view';
import { ExportGitHubPopover } from '@/features/projects/components/export-github-popover';
import { FileExplorer } from '@/features/projects/components/file-explorer';
import { Tab } from '@/features/projects/components/tab';
import {
  DEFAULT_MAIN_SIZE,
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '@/features/projects/constants';
import type { View } from '@/features/projects/types';

import { PreviewView } from './preview-view';

interface ProjectIdViewProps {
  projectId: string;
}

export const ProjectIdView = ({ projectId }: ProjectIdViewProps) => {
  const [activeView, setActiveView] = useState<View>('editor');

  return (
    <div className='flex h-full flex-col'>
      <nav className='flex h-8.75 items-center border-b bg-sidebar'>
        <Tab
          label='Code'
          isActive={activeView === 'editor'}
          onClick={() => setActiveView('editor')}
        />
        <Tab
          label='Preview'
          isActive={activeView === 'preview'}
          onClick={() => setActiveView('preview')}
        />

        <div className='flex h-full flex-1 justify-end'>
          <ExportGitHubPopover projectId={projectId} />
        </div>
      </nav>

      <div className='relative flex-1'>
        <div className={cn('invisible absolute inset-0', activeView === 'editor' && 'visible')}>
          <Allotment defaultSizes={[DEFAULT_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}>
            <Allotment.Pane
              snap
              minSize={MIN_SIDEBAR_WIDTH}
              maxSize={MAX_SIDEBAR_WIDTH}
              preferredSize={DEFAULT_SIDEBAR_WIDTH}
            >
              <FileExplorer projectId={projectId} />
            </Allotment.Pane>

            <Allotment.Pane>
              <EditorView projectId={projectId} />
            </Allotment.Pane>
          </Allotment>
        </div>

        <div className={cn('invisible absolute inset-0', activeView === 'preview' && 'visible')}>
          <PreviewView projectId={projectId} />
        </div>
      </div>
    </div>
  );
};
