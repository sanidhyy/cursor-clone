'use client';

import { useSettingsModal } from '@/features/settings/hooks/use-settings-modal';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AISettingsForm } from './ai-settings-form';

export const SettingsModal = () => {
  const { isOpen, onClose } = useSettingsModal();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>

          <DialogDescription>
            Connect your OpenAI account to power your Polaris AI assistant.
          </DialogDescription>
        </DialogHeader>

        <AISettingsForm />
      </DialogContent>
    </Dialog>
  );
};
