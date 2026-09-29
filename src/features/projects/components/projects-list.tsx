import { INIT_PROJECTS } from '@/features/projects/constants';
import { useProjects } from '@/features/projects/hooks/use-projects';

import { Kbd } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';

import { ContinueCard } from './continue-card';
import { ProjectItem } from './project-item';

interface ProjectsListProps {
  onViewAll: () => void;
}

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {
  const projects = useProjects(INIT_PROJECTS);

  if (projects === undefined) {
    return (
      <div className='flex items-center justify-center p-4'>
        <Spinner className='size-4 text-center text-ring' />
      </div>
    );
  }

  if (!projects.length) return null;

  const [mostRecentProject, ...remainingProjects] = projects;

  return (
    <div className='flex flex-col gap-4'>
      <ContinueCard project={mostRecentProject} />

      {!!remainingProjects.length && (
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-xs text-muted-foreground'>Recent projects</span>

            <button
              className='flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
              onClick={onViewAll}
            >
              <span>View all</span>
              <Kbd className='border bg-accent'>&#8984;K</Kbd>
            </button>
          </div>

          <ul className='flex flex-col'>
            {remainingProjects.map((project) => (
              <ProjectItem key={project._id} project={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
