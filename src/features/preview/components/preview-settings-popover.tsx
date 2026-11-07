'use client';

import { useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { cn } from 'cn';
import { SettingsIcon } from 'lucide-react';

import { useUpdateProjectSettings } from '@/features/projects/hooks/use-projects';
import { previewSettingsFormSchema } from '@/features/projects/schemas';

import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PreviewSettingsPopoverProps {
  projectId: Id<'projects'>;
  initialValues?: Doc<'projects'>['settings'];
  onSave?: VoidFunction;
}

export const PreviewSettingsPopover = ({
  projectId,
  initialValues,
  onSave,
}: PreviewSettingsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const updateSettings = useUpdateProjectSettings();

  const form = useForm({
    defaultValues: {
      installCommand: initialValues?.installCommand || '',
      devCommand: initialValues?.devCommand || '',
    },
    validators: {
      onSubmit: previewSettingsFormSchema,
    },
    onSubmit: async ({ value }) => {
      const settings = previewSettingsFormSchema.parse(value);
      await updateSettings({
        id: projectId,
        settings: {
          installCommand: settings.installCommand || undefined,
          devCommand: settings.devCommand || undefined,
        },
      });

      setOpen(false);
      onSave?.();
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        installCommand: initialValues?.installCommand || '',
        devCommand: initialValues?.devCommand || '',
      });
    }

    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), 'h-full rounded-none')}
        title='Preview settings'
      >
        <SettingsIcon className='size-3' />
      </PopoverTrigger>

      <PopoverContent className='w-80' align='end'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className='space-y-4'>
            <div className='space-y-1'>
              <h4 className='text-sm font-medium'>Preview settings</h4>

              <p className='text-xs text-muted-foreground'>
                Configure how your project runs in the preview.
              </p>
            </div>

            <form.Field name='installCommand'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Install Command</FieldLabel>

                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='npm install'
                  />

                  <FieldDescription>Command to install dependencies</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name='devCommand'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Start Command</FieldLabel>

                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='npm run dev'
                  />

                  <FieldDescription>Command to start the development server</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type='submit'
                  size='sm'
                  className='w-full'
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
