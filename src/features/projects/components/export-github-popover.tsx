import { useState } from 'react';
import Link from 'next/link';

import { useClerk } from '@clerk/nextjs';
import { useForm } from '@tanstack/react-form';
import ky, { HTTPError } from 'ky';
import { CheckCheckIcon, CheckCircle2Icon, ExternalLinkIcon, XCircleIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

import { useProject } from '@/features/projects/hooks/use-projects';
import { projectRequestSchema } from '@/features/projects/schemas';
import {
  exportGitHubFormSchema,
  exportGitHubRequestSchema,
} from '@/features/projects/schemas/github';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncAction } from '@/hooks/use-async-action';
import { getErrorMessage } from '@/lib/errors';

interface ExportGitHubPopoverProps {
  projectId: string;
}

export const ExportGitHubPopover = ({ projectId }: ExportGitHubPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useAsyncAction('Unable to update export. Please try again.');
  const project = useProject(projectId);
  const { openUserProfile } = useClerk();

  const exportStatus = project?.exportStatus;
  const exportRepoUrl = project?.exportRepoUrl;

  const form = useForm({
    defaultValues: {
      repoName:
        project?.name
          ?.trim()
          .slice(0, 100)
          .replace(/[^a-zA-Z0-9._-]/g, '-') || '',
      visibility: 'private' as 'public' | 'private',
      description: '',
    },
    validators: {
      onSubmit: exportGitHubFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { repoName, visibility, description } = exportGitHubFormSchema.parse(value);
        await ky.post('/api/github/export', {
          json: exportGitHubRequestSchema.parse({
            projectId,
            repoName,
            visibility,
            description: description || undefined,
          }),
        });
      } catch (error) {
        if (error instanceof HTTPError) {
          const body = error.data as { error?: string } | undefined;

          toast.error(getErrorMessage(error, 'Failed to export GitHub repository'), {
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

          return;
        }

        toast.error(getErrorMessage(error, 'Failed to export GitHub repository'));
      }
    },
  });

  const handleCancelExport = () =>
    run(() =>
      ky.post('/api/github/export/cancel', {
        json: projectRequestSchema.parse({ projectId }),
      })
    );

  const handleResetExport = () =>
    run(async () => {
      await ky.post('/api/github/export/reset', {
        json: projectRequestSchema.parse({ projectId }),
      });
      setOpen(false);
    });

  const renderContent = () => {
    if (exportStatus === 'exporting') {
      return (
        <div className='flex flex-col items-center gap-3'>
          <Spinner className='size-6 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>Exporting to GitHub...</p>

          <Button
            size='sm'
            variant='outline'
            className='w-full'
            disabled={isPending}
            onClick={handleCancelExport}
          >
            {isPending ? 'Cancelling...' : 'Cancel'}
          </Button>
        </div>
      );
    }

    if (exportStatus === 'completed' && !!exportRepoUrl) {
      return (
        <div className='flex flex-col items-center gap-3'>
          <CheckCircle2Icon className='size-6 text-emerald-500' />
          <p className='text-sm font-medium'>Repository created</p>
          <p className='text-center text-xs text-muted-foreground'>
            Your project has been exported to GitHub.
          </p>

          <div className='flex w-full flex-col gap-2'>
            <Button
              size='sm'
              render={<Link href={exportRepoUrl} target='_blank' rel='noopener noreferrer' />}
              className='w-full'
            >
              <ExternalLinkIcon className='mr-1 size-4' />
              View on GitHub
            </Button>

            <Button
              size='sm'
              variant='outline'
              className='w-full'
              disabled={isPending}
              onClick={handleResetExport}
            >
              {isPending ? 'Closing...' : 'Close'}
            </Button>
          </div>
        </div>
      );
    }

    if (exportStatus === 'failed') {
      return (
        <div className='flex flex-col items-center gap-3'>
          <XCircleIcon className='size-6 text-rose-500' />
          <p className='text-sm text-muted-foreground'>Unable to export</p>
          <p className='text-center text-xs text-muted-foreground'>
            Something went wrong. Please try again.
          </p>

          <Button
            size='sm'
            variant='outline'
            className='w-full'
            disabled={isPending}
            onClick={handleResetExport}
          >
            {isPending ? 'Resetting...' : 'Retry'}
          </Button>
        </div>
      );
    }

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <fieldset disabled={isSubmitting} className='contents'>
              <div className='space-y-4'>
                <div className='space-y-1'>
                  <h4 className='text-sm font-medium'>Export to GitHub</h4>
                  <p className='text-sm text-muted-foreground'>
                    Export your project to a GitHub repository.
                  </p>
                </div>

                <form.Field name='repoName'>
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Repository Name</FieldLabel>

                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder='my-project'
                        />

                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name='visibility'>
                  {(field) => {
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>

                        <Select
                          value={field.state.value}
                          onValueChange={(value) =>
                            field.handleChange(value as 'public' | 'private')
                          }
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder='Select visibility' className='capitalize' />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value='private'>Private</SelectItem>
                            <SelectItem value='public'>Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name='description'>
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Description</FieldLabel>

                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder='A short description of your project'
                          rows={2}
                        />

                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type='submit'
                      size='sm'
                      className='w-full'
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Repository'}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </fieldset>
          )}
        </form.Subscribe>
      </form>
    );
  };

  const getStatusIcon = () => {
    if (exportStatus === 'exporting') return <Spinner className='size-3.5' />;
    if (exportStatus === 'completed')
      return <CheckCheckIcon className='size-3.5 text-emerald-500' />;
    if (exportStatus === 'failed') return <XCircleIcon className='size-3.5 text-rose-500' />;

    return <FaGithub className='size-3.5' />;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!isPending && !form.state.isSubmitting) setOpen(next);
      }}
    >
      <PopoverTrigger>
        <div className='flex h-full cursor-pointer items-center gap-1.5 border-l px-3 text-muted-foreground hover:bg-accent/30'>
          {getStatusIcon()}
          <span className='text-sm'>Export</span>
        </div>
      </PopoverTrigger>

      <PopoverContent className='w-80' align='start'>
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};
