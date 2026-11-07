import { createTool } from '@inngest/agent-kit';

import { createFolderParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface CreateFolderToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createCreateFolderTool = ({ internalKey, projectId }: CreateFolderToolOptions) => {
  return createTool({
    name: 'createFolder',
    description: 'Create a new folder in the project',
    parameters: createFolderParamsSchema,

    handler: async (params, { step: toolStep }) => {
      const parsedParams = createFolderParamsSchema.safeParse(params);

      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { name, parentId } = parsedParams.data;

      try {
        return await toolStep?.run('create-folder', async () => {
          if (!!parentId) {
            try {
              const parentFolder = await convex.query(api.system.getFileById, {
                internalKey,
                projectId,
                fileId: parentId as Id<'files'>,
              });

              if (!parentFolder)
                return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
              if (parentFolder.type !== 'folder')
                return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
            } catch {
              return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
            }
          }

          const folderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId,
            name,
            parentId: parentId ? (parentId as Id<'files'>) : undefined,
          });

          return `Folder created with ID: ${folderId}`;
        });
      } catch (error) {
        return `Error creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
