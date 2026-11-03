import type { Metadata } from 'next';

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
    const projectName = await convex.query(api.system.getProjectTitle, {
      id: projectId as Id<'projects'>,
      internalKey: env.POLARIS_CONVEX_INTERNAL_KEY,
    });
    if (!!projectName) title = projectName;
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
