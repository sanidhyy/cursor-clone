import { useEditor } from '@/features/editor/hooks/use-editor';

import type { Id } from '@/../convex/_generated/dataModel';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { Tab } from './tab';

interface TopNavigationProps {
  projectId: string;
}

export const TopNavigation = ({ projectId }: TopNavigationProps) => {
  const { openTabs } = useEditor(projectId as Id<'projects'>);

  return (
    <ScrollArea className='flex-1'>
      <nav className='flex h-8.75 items-center border-b bg-sidebar'>
        {openTabs.map((fileId, i) => (
          <Tab key={fileId} fileId={fileId} isFirst={i === 0} projectId={projectId} />
        ))}
      </nav>

      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  );
};
