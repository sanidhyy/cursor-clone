import { createTool } from '@inngest/agent-kit';

import { updateFileParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface UpdateFileToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createUpdateFileTool = ({ internalKey, projectId }: UpdateFileToolOptions) => {
  return createTool({
    name: 'updateFile',
    description: 'Update the content of an existing file.',
    parameters: updateFileParamsSchema,

    handler: async (params, { step: toolStep }) => {
      const parsedParams = updateFileParamsSchema.safeParse(params);

      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { fileId, content } = parsedParams.data;

      try {
        return await toolStep?.run('update-file', async () => {
          const file = await convex.query(api.system.getFileById, {
            internalKey,
            projectId,
            fileId: fileId as Id<'files'>,
          });

          if (!file)
            return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
          if (file.type === 'folder')
            return `Error: "${fileId}" is a folder, not a file. You can only update file contents.`;

          if (file.storageId) return 'Error: Binary files cannot be updated as text.';

          await convex.mutation(api.system.updateFile, {
            internalKey,
            projectId,
            fileId: fileId as Id<'files'>,
            content,
          });

          return `File "${file.name}" updated successfully.`;
        });
      } catch (error) {
        return `Error updating file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
