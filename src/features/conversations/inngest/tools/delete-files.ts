import { createTool } from '@inngest/agent-kit';

import { deleteFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface DeleteFilesToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createDeleteFilesTool = ({ internalKey, projectId }: DeleteFilesToolOptions) => {
  return createTool({
    name: 'deleteFiles',
    description:
      'Delete files or folders from the project. If deleting a folder, all contents will be deleted recursively.',
    parameters: deleteFilesParamsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsedParams = deleteFilesParamsSchema.safeParse(params);
      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { fileIds } = parsedParams.data;

      const filesToDelete: { id: string; name: string; type: Doc<'files'>['type'] }[] = [];

      for (const fileId of fileIds) {
        const file = await convex.query(api.system.getFileById, {
          internalKey,
          projectId,
          fileId: fileId as Id<'files'>,
        });

        if (!file)
          return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;

        filesToDelete.push({
          id: file._id,
          name: file.name,
          type: file.type,
        });
      }

      try {
        return await toolStep?.run('delete-files', async () => {
          const results: string[] = [];

          for (const file of filesToDelete) {
            await convex.mutation(api.system.deleteFile, {
              internalKey,
              projectId,
              fileId: file.id as Id<'files'>,
            });

            results.push(`Delete ${file.type} "${file.name}" successfully`);
          }

          return results.join('\n');
        });
      } catch (error) {
        return `Error deleting files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
