import { TopNavigation } from './top-navigation';

interface EditorViewProps {
  projectId: string;
}

export const EditorView = ({ projectId }: EditorViewProps) => {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center'>
        <TopNavigation projectId={projectId} />
      </div>
    </div>
  );
};
