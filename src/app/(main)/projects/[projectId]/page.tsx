import { ProjectIdView } from '@/features/projects/views/project-id-view';

const ProjectIdPage = async ({ params }: PageProps<'/projects/[projectId]'>) => {
  const { projectId } = await params;

  return <ProjectIdView projectId={projectId} />;
};

export default ProjectIdPage;
