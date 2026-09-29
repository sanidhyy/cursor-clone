import * as React from 'react';

import { Navbar } from '@/features/projects/components/navbar';

interface ProjectIdLayoutViewProps extends Readonly<React.PropsWithChildren> {
  projectId: string;
}

export const ProjectIdLayoutView = ({ children, projectId }: ProjectIdLayoutViewProps) => {
  return (
    <div className='flex h-screen w-full flex-col'>
      <Navbar projectId={projectId} />
      {children}
    </div>
  );
};
