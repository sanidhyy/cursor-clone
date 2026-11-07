import { createTool } from '@inngest/agent-kit';

import { createFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface CreateFilesToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createCreateFilesTool = ({ internalKey, projectId }: CreateFilesToolOptions) => {
  return createTool({
    name: 'createFiles',
    description:
      'Create multiple files at once in the same folder. Use this to batch create files that share the same parent folder. More efficient than creating files one by one.',
    parameters: createFilesParamsSchema,

    handler: async (params, { step: toolStep }) => {
      const parsedParams = createFilesParamsSchema.safeParse(params);

      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { parentId, files } = parsedParams.data;

      try {
        return await toolStep?.run('create-files', async () => {
          let resolvedParentId: Id<'files'> | undefined;

          if (!!parentId) {
            try {
              resolvedParentId = parentId as Id<'files'>;

              const parentFolder = await convex.query(api.system.getFileById, {
                internalKey,
                projectId,
                fileId: resolvedParentId,
              });

              if (!parentFolder)
                return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
              if (parentFolder.type !== 'folder')
                return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
            } catch {
              return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
            }
          }

          const results = await convex.mutation(api.system.createFiles, {
            internalKey,
            projectId,
            parentId: resolvedParentId,
            files,
          });

          const createdFiles = results.filter((result) => !result.error);
          const failedFiles = results.filter((result) => !!result.error);

          let response = `Created ${createdFiles.length} file(s)`;

          if (!!createdFiles.length)
            response += `: ${createdFiles.map((result) => result.name).join(', ')}`;

          if (!!failedFiles.length)
            response += `. Failed: ${failedFiles.map((result) => `${result.name} (${result.error})`).join(', ')}`;

          return response;
        });
      } catch (error) {
        return `Error creating files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
