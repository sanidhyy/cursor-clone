import * as React from 'react';
import { useRef, useState } from 'react';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import { UserButton } from '@clerk/nextjs';
import { cn } from 'cn';
import { AlertTriangleIcon, CloudCheckIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

import { useFileSaveStore } from '@/features/editor/hooks/use-file-autosave';
import { useProject, useRenameProject } from '@/features/projects/hooks/use-projects';
import { projectNameSchema } from '@/features/projects/schemas';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LINKS } from '@/config';
import { useAsyncAction } from '@/hooks/use-async-action';
import { formatTimestamp } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

interface NavbarProps {
  projectId: string;
}

export const Navbar = ({ projectId }: NavbarProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState('');

  const cancelled = useRef(false);
  const { isPending: isSavingName, run: runRename } = useAsyncAction('Unable to rename project');
  const saves = useFileSaveStore((state) => state.saves);
  const projectSaves = [...saves.values()].filter((save) => save.draft.projectId === projectId);
  const hasSaveError = projectSaves.some((save) => save.status === 'error');
  const isSavingFiles = projectSaves.some((save) => save.status !== 'error');
  const project = useProject(projectId);
  const renameProject = useRenameProject();

  const handleStartRename = () => {
    if (!project) return;

    cancelled.current = false;

    setName(project.name);
    setIsRenaming(true);
  };

  const handleSubmit = () => {
    if (cancelled.current || isSavingName) return;

    const trimmedName = name.trim();

    if (!trimmedName || !project || trimmedName === project.name) {
      setIsRenaming(false);

      return;
    }

    const result = projectNameSchema.safeParse(name);

    if (!result.success) {
      toast.error(result.error.issues[0].message);

      return;
    }

    void runRename(async () => {
      await renameProject({ id: project._id, name: result.data });

      setIsRenaming(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape' && !isSavingName) {
      cancelled.current = true;

      setIsRenaming(false);
    }
  };

  return (
    <nav className='flex items-center justify-between gap-x-2 border-b bg-sidebar p-2'>
      <div className='flex items-center gap-x-2'>
        <Breadcrumb>
          <BreadcrumbList className='gap-0!'>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href='/' />}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'group/logo flex h-7! w-fit! items-center gap-1.5 p-1.5!'
                )}
              >
                <Image src='/logo.svg' alt='Polaris Logo' width={20} height={20} />
                <span className={cn('text-sm font-medium', poppins.className)}>Polaris</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className='mr-1 ml-0' />

            <BreadcrumbItem>
              {isRenaming ? (
                <input
                  disabled={isSavingName}
                  aria-busy={isSavingName}
                  aria-label='Project name'
                  autoFocus
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={handleSubmit}
                  onKeyDown={handleKeyDown}
                  className='max-w-40 truncate bg-transparent text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring focus:ring-inset'
                />
              ) : (
                <BreadcrumbPage
                  onClick={handleStartRename}
                  className='max-w-40 cursor-pointer truncate text-sm font-medium hover:text-primary'
                >
                  {project?.name || 'Loading...'}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isSavingName && <Spinner className='size-4' />}
        {projectSaves.length > 0 && (
          <span role='status' className='flex items-center gap-1 text-xs text-muted-foreground'>
            {hasSaveError ? (
              <AlertTriangleIcon className='size-4 text-destructive' />
            ) : (
              <Spinner className='size-4' />
            )}
            {hasSaveError ? 'Save failed' : 'Saving...'}
          </span>
        )}
        {!!project &&
          !isSavingName &&
          !hasSaveError &&
          !isSavingFiles &&
          (project.importStatus === 'importing' ? (
            <Tooltip>
              <TooltipTrigger>
                <Spinner className='text-muted-foreground' />
              </TooltipTrigger>

              <TooltipContent side='right' sideOffset={10}>
                Importing...
              </TooltipContent>
            </Tooltip>
          ) : project.importStatus === 'failed' ? (
            <span role='alert' className='text-xs text-destructive'>
              Import failed. Try importing the repository again.
            </span>
          ) : (
            project.updatedAt && (
              <Tooltip>
                <TooltipTrigger>
                  <CloudCheckIcon className='size-4 text-muted-foreground' />
                </TooltipTrigger>

                <TooltipContent side='right' sideOffset={10}>
                  Saved {formatTimestamp(project.updatedAt)}
                </TooltipContent>
              </Tooltip>
            )
          ))}
      </div>

      <div className='flex items-center gap-3'>
        <Link
          href={LINKS.SOURCE_CODE}
          target='_blank'
          rel='noopener noreferrer'
          title='Source Code'
        >
          <FaGithub className='size-6' />
        </Link>

        <UserButton />
      </div>
    </nav>
  );
};
