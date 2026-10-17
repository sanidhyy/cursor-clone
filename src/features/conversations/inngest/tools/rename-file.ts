import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface RenameFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, 'File id is required'),
  newName: z.string().min(1, 'New name is required'),
});

export const createRenameFileTool = ({ internalKey }: RenameFileToolOptions) => {
  return createTool({
    name: 'renameFile',
    description: 'Rename a file or folder.',
    parameters: z.object({
      fileId: z.string().describe('The ID of the file or folder to rename'),
      newName: z.string().describe('The new name for the file or folder'),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsedParams = paramsSchema.safeParse(params);
      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { fileId, newName } = parsedParams.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<'files'>,
      });
      if (!file)
        return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;

      try {
        return await toolStep?.run('rename-file', async () => {
          await convex.mutation(api.system.renameFile, {
            internalKey,
            fileId: fileId as Id<'files'>,
            newName,
          });

          return `Renamed "${file.name}" to "${newName}" successfully.`;
        });
      } catch (error) {
        return `Error renaming file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
