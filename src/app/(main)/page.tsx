'use client';

import { useMutation, useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);

  return (
    <div className='flex flex-col items-center justify-center gap-2'>
      <h1>Home</h1>
      <Button onClick={() => createProject({ name: `New Project (${new Date().toISOString()})` })}>
        Create Project
      </Button>
      {projects?.map((project) => (
        <div key={project._id} className='flex flex-col rounded border p-2'>
          <p>Name: {project.name}</p>
          <p>Owner ID: {project.ownerId}</p>
        </div>
      ))}
    </div>
  );
};

export default HomePage;
