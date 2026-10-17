import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useClerk } from '@clerk/nextjs';
import { useForm } from '@tanstack/react-form';
import ky, { HTTPError } from 'ky';
import { toast } from 'sonner';
import { z } from 'zod';

import type { Id } from '@/../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  url: z.url('Please enter a valid URL'),
});

interface ImportGitHubDialogProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ImportGitHubDialog = ({ open, onOpenChange }: ImportGitHubDialogProps) => {
  const router = useRouter();
  const { openUserProfile } = useClerk();

  const form = useForm({
    defaultValues: {
      url: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { projectId } = await ky
          .post('/api/github/import', {
            json: { url: value.url },
          })
          .json<{ eventId: string; projectId: Id<'projects'> }>();

        onOpenChange(false);
        form.reset();

        router.push(`/projects/${projectId}`);
      } catch (error) {
        if (error instanceof HTTPError) {
          const body = error.data as { error?: string } | undefined;

          toast.error(body?.error || 'Failed to import GitHub repository', {
            action: body?.error?.includes('GitHub not connected')
              ? {
                  label: 'Connect',
                  onClick: () => openUserProfile(),
                }
              : body?.error?.includes('Pro plan required')
                ? {
                    label: 'Upgrade Now',
                    onClick: () =>
                      openUserProfile({
                        __experimental_startPath: '/billing',
                      }),
                  }
                : undefined,
          });

          onOpenChange(false);
          return;
        }

        toast.error(error instanceof Error ? error.message : 'Failed to import GitHub repository');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Enter a GitHub repository URL to import. A new project will be created with the
            repository contents.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name='url'>
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Repository URL</FieldLabel>

                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder='https://github.com/owner/repo'
                  />

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter className='mt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type='submit' disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Importing...' : 'Import'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
