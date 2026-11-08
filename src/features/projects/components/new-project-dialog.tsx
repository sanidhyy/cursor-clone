'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import ky from 'ky';
import { toast } from 'sonner';

import { PROJECT_TEMPLATES } from '@/features/projects/constants/project-templates';
import { useNewProjectDraft } from '@/features/projects/hooks/use-new-project-draft';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/errors';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

const TEMPLATE_ROWS = [
  PROJECT_TEMPLATES.slice(0, 3),
  PROJECT_TEMPLATES.slice(3, 7),
  PROJECT_TEMPLATES.slice(7),
];

export const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const { input, setInput, clearDraft } = useNewProjectDraft();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmit = async (message: PromptInputMessage) => {
    const request = createProjectRequestSchema.safeParse({ prompt: message.text });

    if (!request.success) {
      toast.error(request.error.issues[0].message);

      return false;
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
      clearDraft();

      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create project'));

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto bg-transparent p-1 shadow-none ring-0 sm:max-w-4xl'
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>What do you want to build?</DialogTitle>
          <DialogDescription>
            Describe your project and AI will help you create it.
          </DialogDescription>
        </DialogHeader>

        <PromptInput onSubmit={handleSubmit} className='mx-auto max-w-xl rounded-xl bg-popover'>
          <PromptInputBody>
            <PromptInputTextarea
              ref={inputRef}
              placeholder='Ask Polaris to build...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSubmitting}
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={!input.trim() || isSubmitting}
              status={isSubmitting ? 'submitted' : undefined}
            />
          </PromptInputFooter>
        </PromptInput>

        <div className='px-1 pb-1'>
          <p id='project-templates-label' className='sr-only'>
            Start with a template
          </p>
          <div
            role='group'
            aria-labelledby='project-templates-label'
            className='flex flex-col items-center gap-3'
          >
            {TEMPLATE_ROWS.map((templates) => (
              <div key={templates[0].title} className='flex flex-wrap justify-center gap-3'>
                {templates.map((template) => (
                  <Button
                    key={template.title}
                    type='button'
                    variant='outline'
                    className='h-10 px-3.5'
                    disabled={isSubmitting}
                    onClick={() => {
                      setInput(template.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <span aria-hidden='true'>{template.emoji}</span>
                    {template.title}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
