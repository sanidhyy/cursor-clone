import { createTool } from '@inngest/agent-kit';

import { listFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

interface ListFilesToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createListFilesTool = ({ internalKey, projectId }: ListFilesToolOptions) => {
  return createTool({
    name: 'listFiles',
    description:
      'List all files and folders in the project. Returns names, IDs, types, and parentId for each item. Items with parentId: null are at root level. Use the parentId to understand the folder structure - items with the same parentId are in the same folder.',
    parameters: listFilesParamsSchema,

    handler: async (_params, { step: toolStep }) => {
      try {
        return await toolStep?.run('list-files', async () => {
          const files = await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId,
          });

          // sort: folders first, then files, alphabetically within each group
          const sortedFiles = files.sort((a, b) => {
            // folders come before files
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

            // within same type, sort alphabetically by name
            return a.name.localeCompare(b.name);
          });

          const fileList = sortedFiles.map((file) => ({
            id: file._id,
            name: file.name,
            type: file.type,
            parentId: file.parentId || null,
          }));

          return JSON.stringify(fileList);
        });
      } catch (error) {
        return `Error listing files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
