import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Trash2Icon } from 'lucide-react';

import { useDeleteProject, useProjects } from '@/features/projects/hooks/use-projects';

import type { Doc } from '@/../convex/_generated/dataModel';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
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
  const deleteProject = useDeleteProject();
  const [deleteTarget, setDeleteTarget] = React.useState<Doc<'projects'> | null>(null);

  const handleSelect = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    onOpenChange(false);
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title='Search Projects'
        description='Search, open, or delete your projects'
      >
        <Command>
          <CommandInput placeholder='Search projects...' />

          <CommandList>
            <CommandGroup heading='Projects'>
              {projects === undefined ? (
                <LoadingState label='Loading projects...' />
              ) : (
                <CommandEmpty>No projects found.</CommandEmpty>
              )}

              {projects?.map((project) => (
                <CommandItem
                  key={project._id}
                  value={`${project.name}-${project._id}`}
                  onSelect={() => handleSelect(project._id)}
                  className='[&>svg:last-child]:hidden'
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
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    className='text-muted-foreground'
                    title={`Delete project ${project.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(project);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title='Delete project?'
        description={`Permanently delete “${deleteTarget?.name ?? ''}” and all its files, uploads, conversations, and messages? This cannot be undone. Any exported GitHub repository will remain.`}
        onConfirm={async () => {
          if (deleteTarget) await deleteProject(deleteTarget._id);
        }}
      />
    </>
  );
};
