import { useEditor } from '@/features/editor/hooks/use-editor';

import type { Id } from '@/../convex/_generated/dataModel';

import { FileBreadcrumbs } from './file-breadcrumbs';
import { TopNavigation } from './top-navigation';

interface EditorViewProps {
  projectId: string;
}

export const EditorView = ({ projectId }: EditorViewProps) => {
  const { activeTabId } = useEditor(projectId as Id<'projects'>);

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center'>
        <TopNavigation projectId={projectId} />
      </div>

      {activeTabId && <FileBreadcrumbs projectId={projectId} />}
    </div>
  );
};
