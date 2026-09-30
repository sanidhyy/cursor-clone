import { BASE_PADDING, LEVEL_PADDING } from '@/features/projects/constants';

export const getItemPadding = (level: number, isFile: boolean) => {
  const fileOffset = isFile ? 16 : 0; // extra padding for files since they don't have chevron icon

  return BASE_PADDING + level * LEVEL_PADDING + fileOffset;
};
