import * as React from 'react';
import { useState } from 'react';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import { UserButton } from '@clerk/nextjs';
import { cn } from 'cn';
import { CloudCheckIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

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

  const project = useProject(projectId);
  const renameProject = useRenameProject();

  const handleStartRename = () => {
    if (!project) return;
    setName(project.name);
    setIsRenaming(true);
  };

  const handleSubmit = () => {
    setIsRenaming(false);

    const trimmedName = name.trim();
    if (!trimmedName || !project || trimmedName === project.name) return;

    const result = projectNameSchema.safeParse(name);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    renameProject({ id: project._id, name: result.data });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') setIsRenaming(false);
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

        {!!project &&
          (project.importStatus === 'importing' ? (
            <Tooltip>
              <TooltipTrigger>
                <Spinner className='text-muted-foreground' />
              </TooltipTrigger>

              <TooltipContent side='right' sideOffset={10}>
                Importing...
              </TooltipContent>
            </Tooltip>
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
