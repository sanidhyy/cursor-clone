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
import { useChatStore } from '@/features/conversations/store/use-chat-store';
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
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAsyncAction } from '@/hooks/use-async-action';
import { getErrorMessage } from '@/lib/errors';
import { promptSchema } from '@/schemas/common';

import { CodeContexts } from './code-contexts';
import { ConversationMessage } from './conversation-message';
import { PastConversationsDialog } from './past-conversations-dialog';

interface ConversationSidebarProps {
  projectId: string;
}

export const ConversationSidebar = ({ projectId }: ConversationSidebarProps) => {
  const draftProjectId = projectId as Id<'projects'>;
  const { input, context } = useChatStore((state) => state.getDraft(draftProjectId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(
    null
  );
  const [pastConversationsOpen, setPastConversationsOpen] = useState(false);

  const { isPending: isCreating, run: runCreate } = useAsyncAction('Unable to create conversation');
  const { isPending: isCancelling, run: runCancel } = useAsyncAction('Unable to cancel request');
  const createConversation = useCreateConversation();
  const conversations = useConversations(projectId as Id<'projects'>);

  const activeConversationId =
    conversations?.find((conversation) => conversation._id === selectedConversationId)?._id ||
    conversations?.[0]?._id ||
    null;

  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);

  const isLoading =
    conversations === undefined ||
    (!!activeConversationId &&
      (activeConversation === undefined || conversationMessages === undefined));

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
      toast.error(getErrorMessage(error, 'Unable to create new conversation'));

      return null;
    }
  };

  const handleCancel = () =>
    runCancel(() =>
      ky.post('/api/messages/cancel', {
        json: projectRequestSchema.parse({ projectId }),
      })
    );

  const handleSubmit = async (message: PromptInputMessage) => {
    if (submissionPending.current || isProcessing || isLoading || isCreating || isCancelling)
      return false;

    const text = promptSchema.safeParse(message.text);

    if (!text.success) {
      toast.error(text.error.issues[0].message);

      return false;
    }

    submissionPending.current = true;
    setIsSubmitting(true);

    const submittedContext = useChatStore.getState().getDraft(draftProjectId).context;

    try {
      const conversationId = activeConversationId || (await handleCreateConversation());

      if (!conversationId) return false;

      await ky.post('/api/messages', {
        json: sendMessageRequestSchema.parse({
          conversationId,
          message: text.data,
          context: submittedContext,
        }),
      });

      useChatStore.getState().clearSubmitted(draftProjectId, message.text, submittedContext);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Message failed to send'));

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
        onSelect={(id) => {
          if (!submissionPending.current) setSelectedConversationId(id);
        }}
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
              disabled={isSubmitting || isCreating || isCancelling}
              title='Conversation History'
              onClick={() => setPastConversationsOpen(true)}
            >
              <HistoryIcon className='size-3.5' />
            </Button>

            <Button
              disabled={isCreating || isSubmitting || isLoading || isProcessing || isCancelling}
              onClick={() => {
                void runCreate(handleCreateConversation);
              }}
              size='icon-xs'
              variant='highlight'
              title='New Conversation'
            >
              {isCreating ? <Spinner className='size-3.5' /> : <PlusIcon className='size-3.5' />}
            </Button>
          </div>
        </div>

        <Conversation className='flex-1'>
          <ConversationContent
            className={
              isLoading || !conversationMessages?.length
                ? 'h-full items-center justify-center'
                : undefined
            }
          >
            {isLoading && <LoadingState label='Loading conversation...' />}
            {!isLoading && !conversationMessages?.length && (
              <p className='p-4 text-center text-sm text-muted-foreground'>
                Send a message to start a conversation.
              </p>
            )}
            {conversationMessages?.map((message) => (
              <ConversationMessage key={message._id} data={message} />
            ))}
          </ConversationContent>

          <ConversationScrollButton />
        </Conversation>

        <div className='p-3'>
          <CodeContexts
            context={context}
            onRemove={(index) => useChatStore.getState().removeContext(draftProjectId, index)}
          />
          <PromptInput onSubmit={handleSubmit} className='mt-2'>
            <PromptInputBody>
              <PromptInputTextarea
                id={`chat-input-${projectId}`}
                onChange={(e) => useChatStore.getState().setInput(draftProjectId, e.target.value)}
                value={input}
                disabled={isProcessing || isLoading || isCreating || isCancelling}
                placeholder='Ask Polaris anything...'
              />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools />

              <PromptInputSubmit
                disabled={
                  isSubmitting ||
                  isLoading ||
                  isCreating ||
                  isCancelling ||
                  (!isProcessing && !input.trim())
                }
                status={
                  isCancelling || isSubmitting
                    ? 'submitted'
                    : isProcessing
                      ? 'streaming'
                      : undefined
                }
                onStop={handleCancel}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
