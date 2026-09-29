import Link from 'next/link';

import { getProjectIcon } from '@/features/projects/lib/get-project-icon';

import { Doc } from '@/../convex/_generated/dataModel';
import { formatTimestamp } from '@/lib/utils';

interface ProjectItemProps {
  project: Doc<'projects'>;
}

export const ProjectItem = ({ project }: ProjectItemProps) => {
  return (
    <Link
      href={`/projects/${project._id}`}
      className='group flex w-full items-center justify-between py-1 text-sm font-medium text-foreground/60 hover:text-foreground'
    >
      <div className='flex items-center gap-2'>
        {getProjectIcon(project.importStatus)}

        <span className='truncate'>{project.name}</span>
      </div>

      <span className='text-xs text-muted-foreground transition-colors group-hover:text-foreground/60'>
        {formatTimestamp(project.updatedAt)}
      </span>
    </Link>
  );
};
