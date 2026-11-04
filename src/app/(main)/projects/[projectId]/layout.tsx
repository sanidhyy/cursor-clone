import type { Metadata } from 'next';

import { auth } from '@clerk/nextjs/server';

import { ProjectIdLayoutView } from '@/features/projects/views/project-id-layout-view';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { env } from '@/env/server';
import { convex } from '@/lib/convex-client';

export const generateMetadata = async ({
  params,
}: LayoutProps<'/projects/[projectId]'>): Promise<Metadata> => {
  const { projectId } = await params;
  let title = 'Project not found';

  try {
    const { userId } = await auth();
    if (!!userId) {
      const project = await convex.query(api.system.getProjectById, {
        internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
        ownerId: userId,
        projectId: projectId as Id<'projects'>,
      });

      if (!!project) title = project.name;
    }
  } catch {}

  return {
    title,
  };
};

const ProjectIdLayout = async ({ children, params }: LayoutProps<'/projects/[projectId]'>) => {
  const { projectId } = await params;

  return <ProjectIdLayoutView projectId={projectId}>{children}</ProjectIdLayoutView>;
};

export default ProjectIdLayout;
