import { useRef, useState } from 'react';

import ky from 'ky';
import { HistoryIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { DEFAULT_CONVERSATION_TITLE } from '@/features/conversations/constants';
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from '@/features/conversations/hooks/use-conversations';
import { sendMessageRequestSchema } from '@/features/conversations/schemas';
import { projectRequestSchema } from '@/features/projects/schemas';

import type { Id } from '@/../convex/_generated/dataModel';
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
import { promptSchema } from '@/schemas/common';

import { ConversationMessage } from './conversation-message';
import { PastConversationsDialog } from './past-conversations-dialog';

interface ConversationSidebarProps {
  projectId: string;
}

export const ConversationSidebar = ({ projectId }: ConversationSidebarProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(
    null
  );
  const [pastConversationsOpen, setPastConversationsOpen] = useState(false);

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

  const handleCancel = async () => {
    try {
      await ky.post('/api/messages/cancel', {
        json: projectRequestSchema.parse({ projectId }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel request');
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if (submissionPending.current || isProcessing) return false;
    const text = promptSchema.safeParse(message.text);
    if (!text.success) {
      toast.error(text.error.issues[0].message);
      return false;
    }

    submissionPending.current = true;
    setIsSubmitting(true);
    try {
      const conversationId = activeConversationId || (await handleCreateConversation());
      if (!conversationId) return false;
      await ky.post('/api/messages', {
        json: sendMessageRequestSchema.parse({
          conversationId,
          message: text.data,
        }),
      });
      setInput((current) => (current === message.text ? '' : current));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Message failed to send');
      return false;
    } finally {
      submissionPending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PastConversationsDialog
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        projectId={projectId as Id<'projects'>}
        onSelect={setSelectedConversationId}
      />

      <div className='flex h-full flex-col bg-sidebar'>
        <div className='flex h-8.75 items-center justify-between border-b'>
          <div className='truncate pl-3 text-sm'>
            {activeConversation?.title || DEFAULT_CONVERSATION_TITLE}
          </div>

          <div className='flex items-center gap-1 px-1'>
            <Button
              size='icon-xs'
              variant='highlight'
              title='Conversation History'
              onClick={() => setPastConversationsOpen(true)}
            >
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
                disabled={isSubmitting || (!isProcessing && !input.trim())}
                status={isProcessing ? 'streaming' : isSubmitting ? 'submitted' : undefined}
                onStop={handleCancel}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
