import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useProjects } from '@/features/projects/hooks/use-projects';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { formatTimestamp } from '@/lib/utils';

import { ProjectIcon } from './project-icon';

interface ProjectsCommandDialogProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProjectsCommandDialog = ({ open, onOpenChange }: ProjectsCommandDialogProps) => {
  const router = useRouter();
  const projects = useProjects();

  const handleSelect = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    onOpenChange(false);
  };

  if (projects === undefined) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Search Projects'
      description='Search and navigate to your projects'
    >
      <Command>
        <CommandInput placeholder='Search projects...' />

        <CommandList>
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup heading='Projects'>
            {projects.map((project) => (
              <CommandItem
                key={project._id}
                value={`${project.name}-${project._id}`}
                onSelect={() => handleSelect(project._id)}
              >
                <ProjectIcon
                  importStatus={project.importStatus}
                  className='group-data-selected/command-item:text-foreground/80!'
                />
                <span className='truncate text-muted-foreground group-data-selected/command-item:text-foreground'>
                  {project.name}
                </span>
                <CommandShortcut className='tracking-normal group-data-selected/command-item:text-foreground/80'>
                  {formatTimestamp(project.updatedAt)}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
