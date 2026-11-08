import { useState } from 'react';

import { cn } from 'cn';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Doc } from '@/../convex/_generated/dataModel';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';

import { CodeContexts } from './code-contexts';
import { MessageProgress } from './message-progress';
import { MessageThinking } from './message-thinking';

interface ConversationMessageProps {
  data: Doc<'messages'>;
}

export const ConversationMessage = ({ data: message }: ConversationMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy message to clipboard');
    }
  };

  return (
    <Message key={message._id} from={message.role} className='group'>
      <MessageContent>
        {!!message.context?.length && <CodeContexts context={message.context} />}
        {message.role === 'assistant' && <MessageProgress message={message} />}
        {message.role === 'assistant' && <MessageThinking message={message} />}
        {!!message.content && (
          <MessageResponse isAnimating={message.status === 'processing'}>
            {message.content}
          </MessageResponse>
        )}
        {message.status === 'cancelled' && (
          <span className='pr-px text-muted-foreground italic'>Request cancelled</span>
        )}
      </MessageContent>

      {message.role === 'assistant' && message.status === 'completed' && (
        <MessageActions
          className={cn('group-hover:opacity-100 md:opacity-0', copied && 'md:opacity-100')}
        >
          <MessageAction
            onClick={handleCopy}
            label='Copy'
            disabled={copied}
            className='disabled:opacity-100'
          >
            {copied ? <CheckIcon className='size-3' /> : <CopyIcon className='size-3' />}
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  );
};
