const ProjectIdPage = async ({ params }: PageProps<'/projects/[projectId]'>) => {
  const { projectId } = await params;

  return <div>Project ID: {projectId}</div>;
};

export default ProjectIdPage;
