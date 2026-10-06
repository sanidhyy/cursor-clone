import { useState } from 'react';

import ky from 'ky';
import { HistoryIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from '@/features/conversations/hooks/use-conversations';

import type { Id } from '@/../convex/_generated/dataModel';
import { DEFAULT_CONVERSATION_TITLE } from '@/../convex/constants';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';

import { ConversationMessage } from './conversation-message';

interface ConversationSidebarProps {
  projectId: string;
}

export const ConversationSidebar = ({ projectId }: ConversationSidebarProps) => {
  const [input, setInput] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(
    null
  );

  const createConversation = useCreateConversation();
  const conversations = useConversations(projectId as Id<'projects'>);

  const activeConversationId = selectedConversationId || conversations?.[0]?._id || null;

  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);

  const isProcessing = conversationMessages?.some((msg) => msg.status === 'processing');

  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        projectId: projectId as Id<'projects'>,
        title: DEFAULT_CONVERSATION_TITLE,
      });

      setSelectedConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create new conversation');
      return null;
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if (isProcessing && !message.text) {
      // TODO: await handleClick()
      setInput('');
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) return;
    }

    try {
      await ky.post('/api/messages', {
        json: {
          conversationId,
          message: message.text,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Message failed to send');
    }

    setInput('');
  };

  return (
    <div className='flex h-full flex-col bg-sidebar'>
      <div className='flex h-8.75 items-center justify-between border-b'>
        <div className='truncate pl-3 text-sm'>
          {activeConversation?.title || DEFAULT_CONVERSATION_TITLE}
        </div>

        <div className='flex items-center gap-1 px-1'>
          <Button size='icon-xs' variant='highlight' title='History'>
            <HistoryIcon className='size-3.5' />
          </Button>

          <Button
            onClick={handleCreateConversation}
            size='icon-xs'
            variant='highlight'
            title='New Conversation'
          >
            <PlusIcon className='size-3.5' />
          </Button>
        </div>
      </div>

      <Conversation className='flex-1'>
        <ConversationContent>
          {conversationMessages?.map((message) => (
            <ConversationMessage key={message._id} data={message} />
          ))}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className='p-3'>
        <PromptInput onSubmit={handleSubmit} className='mt-2'>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              disabled={isProcessing}
              placeholder='Ask Polaris anything...'
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools />

            <PromptInputSubmit
              disabled={isProcessing ? false : !input.trim()}
              status={isProcessing ? 'streaming' : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
