'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ky from 'ky';
import { toast } from 'sonner';

import { createProjectRequestSchema } from '@/features/projects/schemas';

import type { Id } from '@/../convex/_generated/dataModel';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmit = async (message: PromptInputMessage) => {
    const request = createProjectRequestSchema.safeParse({ prompt: message.text });
    if (!request.success) {
      toast.error(request.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { projectId } = await ky
        .post('/api/projects/create-with-prompt', {
          json: request.data,
        })
        .json<{ eventId: string; projectId: Id<'projects'> }>();

      toast.success('Project created');
      onOpenChange(false);
      setInput('');

      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className='p-0 sm:max-w-lg'>
        <DialogHeader className='sr-only'>
          <DialogTitle>What do you want to build?</DialogTitle>
          <DialogDescription>
            Describe your project and AI will help you create it.
          </DialogDescription>
        </DialogHeader>

        <PromptInput onSubmit={handleSubmit} className='border-none!'>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder='Ask Polaris to build...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSubmitting}
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit disabled={!input.trim() || isSubmitting} />
          </PromptInputFooter>
        </PromptInput>
      </DialogContent>
    </Dialog>
  );
};
