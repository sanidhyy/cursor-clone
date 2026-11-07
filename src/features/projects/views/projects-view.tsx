'use client';

import { useEffect, useState } from 'react';
import { Poppins } from 'next/font/google';
import Image from 'next/image';

import { cn } from 'cn';
import { SparkleIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

import { ImportGitHubDialog } from '@/features/projects/components/import-github-dialog';
import { NewProjectDialog } from '@/features/projects/components/new-project-dialog';
import { ProjectsCommandDialog } from '@/features/projects/components/projects-command-dialog';
import { ProjectsList } from '@/features/projects/components/projects-list';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

type Dialog = 'command' | 'import' | 'newProject';

export const ProjectsView = () => {
  const [activeDialog, setActiveDialog] = useState<Dialog | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (!e.metaKey && !e.ctrlKey)) return;

      const shortcuts: Record<string, Dialog> = {
        k: 'command',
        i: 'import',
        j: 'newProject',
      };

      const dialog = shortcuts[e.key.toLowerCase()];

      if (!dialog) return;

      e.preventDefault();
      setActiveDialog((prev) => (prev === dialog ? null : dialog));
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog
        open={activeDialog === 'command'}
        onOpenChange={(open) =>
          setActiveDialog((prev) => (open ? 'command' : prev === 'command' ? null : prev))
        }
      />
      <ImportGitHubDialog
        open={activeDialog === 'import'}
        onOpenChange={(open) =>
          setActiveDialog((prev) => (open ? 'import' : prev === 'import' ? null : prev))
        }
      />
      <NewProjectDialog
        open={activeDialog === 'newProject'}
        onOpenChange={(open) =>
          setActiveDialog((prev) => (open ? 'newProject' : prev === 'newProject' ? null : prev))
        }
      />

      <div className='flex min-h-screen flex-col items-center justify-center bg-sidebar p-6 md:p-16'>
        <div className='mx-auto flex w-full max-w-sm flex-col items-center gap-4'>
          <div className='flex w-full items-center justify-between gap-4'>
            <div className='group/logo flex w-full cursor-default items-center gap-2 select-none'>
              <Image
                src='/logo.svg'
                alt='Polaris Logo'
                height={46}
                width={46}
                className='size-8 md:size-11.5'
              />

              <h1 className={cn('text-4xl font-semibold md:text-5xl', poppins.className)}>
                Polaris
              </h1>
            </div>
          </div>

          <div className='flex w-full flex-col gap-4'>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setActiveDialog('newProject');
                }}
                className='flex h-full flex-col items-start justify-start gap-6 rounded-none border bg-background p-4'
              >
                <div className='flex w-full items-center justify-between'>
                  <SparkleIcon className='size-4' />
                  <Kbd className='border bg-accent'>&#8984;J</Kbd>
                </div>

                <span className='text-sm'>New</span>
              </Button>

              <Button
                variant='outline'
                onClick={() => {
                  setActiveDialog('import');
                }}
                className='flex h-full flex-col items-start justify-start gap-6 rounded-none border bg-background p-4'
              >
                <div className='flex w-full items-center justify-between'>
                  <FaGithub className='size-4' />
                  <Kbd className='border bg-accent'>&#8984;I</Kbd>
                </div>

                <span className='text-sm'>Import</span>
              </Button>
            </div>

            <ProjectsList
              onViewAll={() => {
                setActiveDialog('command');
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
