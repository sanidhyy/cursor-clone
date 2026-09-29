import { AlertCircleIcon, GlobeIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

import { Doc } from '@/../convex/_generated/dataModel';
import { Spinner } from '@/components/ui/spinner';

export const getProjectIcon = (importStatus: Doc<'projects'>['importStatus']) => {
  switch (importStatus) {
    case 'completed':
      return <FaGithub className='size-3.5 text-muted-foreground' />;
    case 'failed':
      return <AlertCircleIcon className='size-3.5 text-muted-foreground' />;
    case 'importing':
      return <Spinner className='size-3.5 text-muted-foreground' />;
    default:
      return <GlobeIcon className='size-3.5 text-muted-foreground' />;
  }
};
