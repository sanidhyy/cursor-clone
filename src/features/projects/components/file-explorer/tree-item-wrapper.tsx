import * as React from 'react';

import { cn } from 'cn';

import { getItemPadding } from '@/features/projects/lib/utils';

import type { Doc } from '@/../convex/_generated/dataModel';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface TreeItemWrapperProps extends Readonly<React.PropsWithChildren> {
  file: Doc<'files'>;
  level: number;
  isActive?: boolean;
  onClick?: VoidFunction;
  onDoubleClick?: VoidFunction;
  onRename?: VoidFunction;
  onDelete?: VoidFunction;
  onCreateFile?: VoidFunction;
  onCreateFolder?: VoidFunction;
}

export const TreeItemWrapper = ({
  file,
  level,
  children,
  isActive,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}: TreeItemWrapperProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onRename?.();
          }
        }}
        className={cn(
          'group flex h-5.5 w-full cursor-pointer items-center gap-1 outline-none hover:bg-accent/30 focus:ring-1 focus:ring-ring focus:ring-inset',
          isActive && 'bg-accent/30'
        )}
        style={{ paddingLeft: getItemPadding(level, file.type === 'file') }}
      >
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent finalFocus={false} className='w-64'>
        {file.type === 'folder' && (
          <>
            <ContextMenuItem onClick={onCreateFile} className='text-sm'>
              New File...
            </ContextMenuItem>
            <ContextMenuItem onClick={onCreateFolder} className='text-sm'>
              New Folder...
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem onClick={onRename} className='text-sm'>
          Rename... <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className='text-sm'>
          Delete Permanently <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
