import { createTool } from '@inngest/agent-kit';

import { readFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { convex } from '@/lib/convex-client';

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
            name: string;
            content: string;
          }[] = [];

          for (const fileId of fileIds) {
            const file = await convex.query(api.system.getFileById, {
              internalKey,
              projectId,
              fileId: fileId as Id<'files'>,
            });

            if (file && file.content)
              results.push({ id: file._id, name: file.name, content: file.content });
          }

          if (!results.length)
            return `Error: No files found with provided IDs. Use listFiles to get valid fileIDs.`;

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
