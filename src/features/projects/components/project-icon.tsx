import { cn } from 'cn';
import { AlertCircleIcon, GlobeIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

import type { Doc } from '@/../convex/_generated/dataModel';
import { Spinner } from '@/components/ui/spinner';

interface ProjectIconProps extends React.ComponentProps<'svg'> {
  importStatus: Doc<'projects'>['importStatus'];
}

export const ProjectIcon = ({ className, importStatus, ...props }: ProjectIconProps) => {
  switch (importStatus) {
    case 'completed':
      return <FaGithub className={cn('size-3.5 text-muted-foreground', className)} {...props} />;
    case 'failed':
      return (
        <AlertCircleIcon className={cn('size-3.5 text-muted-foreground', className)} {...props} />
      );
    case 'importing':
      return <Spinner className={cn('size-3.5 text-muted-foreground', className)} {...props} />;
    default:
      return <GlobeIcon className={cn('size-3.5 text-muted-foreground', className)} {...props} />;
  }
};
