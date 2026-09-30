import * as React from 'react';

import { FileIcon } from '@react-symbols/icons/utils';

import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFilePath } from '@/features/projects/hooks/use-files';

import { Id } from '@/../convex/_generated/dataModel';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface FileBreadcrumbsProps {
  projectId: string;
}

export const FileBreadcrumbs = ({ projectId }: FileBreadcrumbsProps) => {
  const { activeTabId } = useEditor(projectId as Id<'projects'>);
  const filePath = useFilePath(activeTabId);

  if (filePath === undefined || !activeTabId) {
    return (
      <div className='border-b bg-background p-2 pl-4'>
        <Breadcrumb>
          <BreadcrumbList className='gap-0.5 sm:gap-0.5'>
            <BreadcrumbItem className='text-sm'>
              <BreadcrumbPage>&nbsp;</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  return (
    <div className='border-b bg-background p-2 pl-4'>
      <Breadcrumb>
        <BreadcrumbList className='gap-0.5 sm:gap-0.5'>
          {filePath.map((item, i) => {
            const isLast = i === filePath.length - 1;

            return (
              <React.Fragment key={item._id}>
                <BreadcrumbItem className='text-sm'>
                  {isLast ? (
                    <BreadcrumbPage className='flex items-center gap-1'>
                      <FileIcon fileName={item.name} autoAssign className='size-4' />
                      {item.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className='cursor-default'>{item.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
