import { HTTPError } from 'ky';

import { AI_SETTINGS_REQUIRED_CODE } from './constants';
import { useSettingsModal } from './hooks/use-settings-modal';

export const handleAISettingsRequired = (error: unknown) => {
  if (!(error instanceof HTTPError)) return;

  const data = error.data as { code?: unknown } | undefined;

  if (data?.code === AI_SETTINGS_REQUIRED_CODE) useSettingsModal.getState().onOpen();
};
