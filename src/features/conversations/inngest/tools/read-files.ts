import { readFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

import { createConversationTool as createTool } from './create-conversation-tool';

interface ReadFilesToolOptions {
  internalKey: string;
  projectId: Id<'projects'>;
}

export const createReadFilesTool = ({ internalKey, projectId }: ReadFilesToolOptions) => {
  return createTool({
    name: 'readFiles',
    description: 'Read the content of files from the project. Returns file contents.',
    parameters: readFilesParamsSchema,

    handler: async (params, { step: toolStep }) => {
      const parsedParams = readFilesParamsSchema.safeParse(params);

      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { fileIds } = parsedParams.data;

      try {
        return await toolStep?.run('read-files', async () => {
          const results: {
            id: string;
            name?: string;
            content?: string;
            error?: string;
          }[] = [];

          for (const fileId of fileIds) {
            try {
              const file = await convex.query(api.system.getFileById, {
                internalKey,
                projectId,
                fileId: fileId as Id<'files'>,
              });

              if (!file) results.push({ id: fileId, error: 'File not found' });
              else if (file.type === 'folder')
                results.push({ id: fileId, name: file.name, error: 'This is a folder' });
              else if (file.storageId)
                results.push({
                  id: fileId,
                  name: file.name,
                  error: 'Binary files cannot be read as text',
                });
              else results.push({ id: fileId, name: file.name, content: file.content ?? '' });
            } catch (error) {
              results.push({
                id: fileId,
                error: error instanceof Error ? error.message : 'Unable to read file',
              });
            }
          }

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
