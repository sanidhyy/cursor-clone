'use client';

import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import { UserButton } from '@clerk/nextjs';
import { cn } from 'cn';

import { useProject } from '@/features/projects/hooks/use-projects';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buttonVariants } from '@/components/ui/button';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

interface NavbarProps {
  projectId: string;
}

export const Navbar = ({ projectId }: NavbarProps) => {
  const project = useProject(projectId);

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
              <BreadcrumbPage className='max-w-40 cursor-pointer truncate text-sm font-medium hover:text-primary'>
                {project?.name || 'Loading...'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className='flex items-center gap-2'>
        <UserButton />
      </div>
    </nav>
  );
};
