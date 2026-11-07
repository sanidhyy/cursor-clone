'use client';

import * as React from 'react';

import { Trash2Icon } from 'lucide-react';

import {
  useConversations,
  useDeleteConversation,
} from '@/features/conversations/hooks/use-conversations';

import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatTimestamp } from '@/lib/utils';

interface PastConversationsDialogProps {
  projectId: Id<'projects'>;
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  onSelect: (conversationId: Id<'conversations'>) => void;
}

export const PastConversationsDialog = ({
  projectId,
  open,
  onOpenChange,
  onSelect,
}: PastConversationsDialogProps) => {
  const conversations = useConversations(projectId);
  const deleteConversation = useDeleteConversation();
  const [deleteTarget, setDeleteTarget] = React.useState<Doc<'conversations'> | null>(null);

  const handleSelect = (conversationId: Id<'conversations'>) => {
    onSelect(conversationId);
    onOpenChange(false);
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title='Past Conversations'
        description='Search, open, or delete a past conversation'
      >
        <Command>
          <CommandInput placeholder='Search conversations...' />

          <CommandList>
            <CommandGroup heading='Conversations'>
              {conversations === undefined ? (
                <LoadingState label='Loading conversations...' />
              ) : (
                <CommandEmpty>No conversations found.</CommandEmpty>
              )}

              {conversations?.map((conversation) => (
                <CommandItem
                  key={conversation._id}
                  value={`${conversation.title}-${conversation._id}`}
                  onSelect={() => handleSelect(conversation._id)}
                  className='border border-transparent data-selected:border-input/30 data-selected:bg-input/30 [&>svg:last-child]:hidden'
                >
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <span className='truncate'>{conversation.title}</span>

                    <span className='text-xs text-muted-foreground'>
                      {formatTimestamp(conversation._creationTime)}
                    </span>
                  </div>

                  <Button
                    variant='ghost'
                    size='icon-xs'
                    className='ml-auto text-muted-foreground'
                    title={`Delete conversation ${conversation.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(conversation);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title='Delete conversation?'
        description={`Permanently delete “${deleteTarget?.title ?? ''}” and all its messages? This cannot be undone. Project files will remain.`}
        onConfirm={async () => {
          if (deleteTarget) await deleteConversation({ id: deleteTarget._id });
        }}
      />
    </>
  );
};
