'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useForm } from '@tanstack/react-form';
import ky from 'ky';
import { EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { AISettingsSchema } from '@/features/settings/schemas/ai-settings-schema';

import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/errors';

export const AISettingsForm = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const form = useForm({
    defaultValues: { apiKey: '' },
    validators: { onSubmit: AISettingsSchema },
    onSubmit: async ({ value }) => {
      try {
        const values = AISettingsSchema.parse(value);

        await ky.put('/api/settings/ai', {
          json: values,
          timeout: 30_000,
          retry: 0,
        });

        setConfigured(true);
        setApiKeyVisible(false);
        toast.success('API Key saved successfully');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to save API Key'));
      }
    },
  });

  useEffect(() => {
    void ky
      .get('/api/settings/ai')
      .json<{ configured: boolean; apiKey: string }>()
      .then((settings) => {
        form.setFieldValue('apiKey', settings.apiKey);
        setConfigured(settings.configured);
      });
  }, [form]);

  const handleRemove = async () => {
    await ky.delete('/api/settings/ai', { retry: 0 });

    form.reset({ apiKey: '' });
    setConfigured(false);
    setApiKeyVisible(false);
    toast.success('API Key removed successfully');
  };

  if (configured === null)
    return (
      <div role='status' className='flex items-center justify-center gap-2 py-8'>
        <Spinner /> Loading settings...
      </div>
    );

  return (
    <>
      <DeleteConfirmationDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title='Remove API Key'
        description='Remove your saved OpenAI API key? AI features will be unavailable until you add a key again.'
        onConfirm={handleRemove}
      />

      <form
        className='space-y-6'
        autoComplete='off'
        autoCapitalize='off'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <fieldset disabled={isSubmitting || confirmRemove} className='contents'>
              <form.Field name='apiKey'>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor='openai-api-key'>OpenAI API Key</FieldLabel>

                    <div className='relative'>
                      <Input
                        id='openai-api-key'
                        name={field.name}
                        type={apiKeyVisible ? 'text' : 'password'}
                        placeholder='sk-••••••••••••••••••••••••'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                        aria-describedby='openai-api-key-description openai-api-key-error'
                        autoComplete='new-password'
                        autoCorrect='off'
                        spellCheck={false}
                        className='pr-10'
                      />

                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        className='absolute inset-y-0 right-1 my-auto'
                        aria-label={apiKeyVisible ? 'Hide API key' : 'Show API key'}
                        aria-pressed={apiKeyVisible}
                        onClick={() => setApiKeyVisible((visible) => !visible)}
                      >
                        {apiKeyVisible ? (
                          <EyeOffIcon className='size-4' />
                        ) : (
                          <EyeIcon className='size-4' />
                        )}
                      </Button>
                    </div>

                    <FieldDescription id='openai-api-key-description'>
                      Get your API key from{' '}
                      <Link
                        href='https://platform.openai.com/api-keys'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        OpenAI
                      </Link>{' '}
                      and make sure your account has sufficient{' '}
                      <Link
                        href='https://platform.openai.com/settings/organization/billing/credit-grants'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        credits
                      </Link>
                      . Your key is encrypted and automatically deleted after 30 days.
                    </FieldDescription>

                    <FieldError id='openai-api-key-error' errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className='flex justify-end gap-2'>
                {configured && (
                  <Button
                    variant='destructive'
                    type='button'
                    onClick={() => setConfirmRemove(true)}
                  >
                    <Trash2Icon className='size-4' /> Remove API Key
                  </Button>
                )}

                <form.Subscribe selector={(state) => [state.canSubmit, state.values.apiKey]}>
                  {([canSubmit, apiKey]) => (
                    <Button type='submit' disabled={!canSubmit || !apiKey}>
                      {isSubmitting && <Spinner />}
                      {isSubmitting ? 'Verifying...' : 'Save'}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </fieldset>
          )}
        </form.Subscribe>
      </form>
    </>
  );
};
