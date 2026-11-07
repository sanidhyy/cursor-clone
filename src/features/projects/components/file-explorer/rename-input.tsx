import { useRef, useState } from 'react';

import { FileIcon, FolderIcon } from '@react-symbols/icons/utils';
import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';
import { toast } from 'sonner';

import { getItemPadding } from '@/features/projects/lib/utils';
import { fileNameSchema } from '@/features/projects/schemas/files';
import type { FileType } from '@/features/projects/types';

import { Spinner } from '@/components/ui/spinner';
import { useAsyncAction } from '@/hooks/use-async-action';

interface RenameInputProps {
  type: FileType;
  defaultValue: string;
  isOpen?: boolean;
  level: number;
  onSubmit: (name: string) => Promise<void>;
  onCancel: VoidFunction;
}

export const RenameInput = ({
  type,
  defaultValue,
  isOpen,
  level,
  onSubmit,
  onCancel,
}: RenameInputProps) => {
  const [value, setValue] = useState(defaultValue);
  const cancelled = useRef(false);
  const { isPending, run } = useAsyncAction('Unable to rename file or folder');

  const handleSubmit = () => {
    if (cancelled.current || isPending) return;

    const trimmedValue = value.trim() || defaultValue;
    const result = fileNameSchema.safeParse(trimmedValue);

    if (!result.success) {
      toast.error(result.error.issues[0].message);

      return;
    }

    void run(() => onSubmit(result.data));
  };

  return (
    <div
      className='flex h-5.5 w-full items-center gap-1 bg-accent/30'
      style={{
        paddingLeft: getItemPadding(level, type === 'file'),
      }}
    >
      <div className='flex items-center gap-0.5'>
        {type === 'folder' && (
          <ChevronRightIcon
            className={cn('size-4 shrink-0 text-muted-foreground', isOpen && 'rotate-90')}
          />
        )}

        {type === 'file' && <FileIcon fileName={value} autoAssign className='size-4' />}
        {type === 'folder' && <FolderIcon folderName={value} className='size-4' />}
      </div>

      {isPending && <Spinner className='size-3' />}
      <input
        disabled={isPending}
        aria-busy={isPending}
        aria-label='Rename'
        autoFocus
        type='text'
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className='flex-1 bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring focus:ring-inset'
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape' && !isPending) {
            e.preventDefault();
            cancelled.current = true;
            onCancel();
          }
        }}
        onFocus={(e) => {
          if (type === 'folder') e.currentTarget.select();
          else {
            const value = e.currentTarget.value;
            const lastDotIndex = value.lastIndexOf('.');

            if (!!lastDotIndex) e.currentTarget.setSelectionRange(0, lastDotIndex);
            else e.currentTarget.select();
          }
        }}
      />
    </div>
  );
};
