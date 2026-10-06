'use client';

import * as React from 'react';

import { useConversations } from '@/features/conversations/hooks/use-conversations';

import type { Id } from '@/../convex/_generated/dataModel';
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

  const handleSelect = (conversationId: Id<'conversations'>) => {
    onSelect(conversationId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Past Conversations'
      description='Search and select a past conversation'
    >
      <Command>
        <CommandInput placeholder='Search conversations...' />

        <CommandList>
          <CommandEmpty>No conversations found.</CommandEmpty>

          <CommandGroup heading='Conversations'>
            {conversations?.map((conversation) => (
              <CommandItem
                key={conversation._id}
                value={`${conversation.title}-${conversation._id}`}
                onSelect={() => handleSelect(conversation._id)}
              >
                <div className='flex flex-col gap-0.5'>
                  <span>{conversation.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    {formatTimestamp(conversation._creationTime)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
