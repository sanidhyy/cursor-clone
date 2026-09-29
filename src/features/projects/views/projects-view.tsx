'use client';

import { Poppins } from 'next/font/google';

import { SparkleIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

import { ProjectsList } from '@/features/projects/components/projects-list';
import { useCreateProject } from '@/features/projects/hooks/use-projects';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const ProjectsView = () => {
  const createProject = useCreateProject();

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-sidebar p-6 md:p-16'>
      <div className='mx-auto flex w-full max-w-sm flex-col items-center gap-4'>
        <div className='flex w-full items-center justify-between gap-4'>
          <div className='group/logo flex w-full items-center gap-2'>
            <img src='vercel.svg' alt='Polaris' className='size-8 md:size-11.5' />
            <h1 className={cn('text-4xl font-semibold md:text-5xl', poppins.className)}>Polaris</h1>
          </div>
        </div>

        <div className='flex w-full flex-col gap-4'>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                const projectName = uniqueNamesGenerator({
                  dictionaries: [adjectives, animals, colors],
                  separator: '-',
                  length: 3,
                });

                createProject({
                  name: projectName,
                });
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
              onClick={() => {}}
              className='flex h-full flex-col items-start justify-start gap-6 rounded-none border bg-background p-4'
            >
              <div className='flex w-full items-center justify-between'>
                <FaGithub className='size-4' />
                <Kbd className='border bg-accent'>&#8984;I</Kbd>
              </div>

              <span className='text-sm'>Import</span>
            </Button>
          </div>

          <ProjectsList onViewAll={() => {}} />
        </div>
      </div>
    </div>
  );
};
