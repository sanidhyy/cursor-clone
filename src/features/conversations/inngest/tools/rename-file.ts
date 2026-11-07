import { createTool } from '@inngest/agent-kit';

import { renameFileParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface RenameFileToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createRenameFileTool = ({ internalKey, projectId }: RenameFileToolOptions) => {
  return createTool({
    name: 'renameFile',
    description: 'Rename a file or folder.',
    parameters: renameFileParamsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsedParams = renameFileParamsSchema.safeParse(params);
      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { fileId, newName } = parsedParams.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        projectId,
        fileId: fileId as Id<'files'>,
      });
      if (!file)
        return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;

      try {
        return await toolStep?.run('rename-file', async () => {
          await convex.mutation(api.system.renameFile, {
            internalKey,
            projectId,
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
