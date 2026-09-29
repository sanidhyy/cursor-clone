import { ProjectIdLayoutView } from '@/features/projects/views/project-id-layout-view';

const ProjectIdLayout = async ({ children, params }: LayoutProps<'/projects/[projectId]'>) => {
  const { projectId } = await params;

  return <ProjectIdLayoutView projectId={projectId}>{children}</ProjectIdLayoutView>;
};

export default ProjectIdLayout;
