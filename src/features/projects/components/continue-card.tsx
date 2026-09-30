import Link from 'next/link';

import { cn } from 'cn';
import { ArrowRightIcon } from 'lucide-react';

import type { Doc } from '@/../convex/_generated/dataModel';
import { buttonVariants } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/utils';

import { ProjectIcon } from './project-icon';

interface ContinueCardProps {
  project: Doc<'projects'>;
}

export const ContinueCard = ({ project }: ContinueCardProps) => {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-xs text-muted-foreground'>Last updated</span>

      <Link
        href={`/projects/${project._id}`}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'group flex h-auto flex-col items-start justify-start gap-2 rounded-none border bg-background p-4'
        )}
      >
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ProjectIcon importStatus={project.importStatus} />
            <span className='truncate font-medium'>{project.name}</span>
          </div>

          <ArrowRightIcon className='size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
        </div>

        <span className='text-xs text-muted-foreground'>{formatTimestamp(project.updatedAt)}</span>
      </Link>
    </div>
  );
};
