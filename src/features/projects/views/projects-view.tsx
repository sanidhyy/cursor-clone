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

export const ProjectsView = () => {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  const closeAllDialogs = () => {
    setCommandDialogOpen(false);
    setImportDialogOpen(false);
    setNewProjectDialogOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          closeAllDialogs();
          setCommandDialogOpen((prevCommandDialogOpen) => !prevCommandDialogOpen);
        }

        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          closeAllDialogs();
          setImportDialogOpen((prevImportDialogOpen) => !prevImportDialogOpen);
        }

        if (e.key.toLowerCase() === 'j') {
          e.preventDefault();
          closeAllDialogs();
          setNewProjectDialogOpen((prevNewProjectDialogOpen) => !prevNewProjectDialogOpen);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen} />
      <ImportGitHubDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />

      <div className='flex min-h-screen flex-col items-center justify-center bg-sidebar p-6 md:p-16'>
        <div className='mx-auto flex w-full max-w-sm flex-col items-center gap-4'>
          <div className='flex w-full items-center justify-between gap-4'>
            <div className='group/logo flex w-full items-center gap-2'>
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
                  closeAllDialogs();
                  setNewProjectDialogOpen(true);
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
                  closeAllDialogs();
                  setImportDialogOpen(true);
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
                closeAllDialogs();
                setCommandDialogOpen(true);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
