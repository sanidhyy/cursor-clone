import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';

import { convex } from '@/features/projects/lib/convex-client';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface ReadFilesToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().trim().min(1, 'File id cannot be empty'))
    .min(1, 'Provide at least one file id'),
});

export const createReadFilesTool = ({ internalKey }: ReadFilesToolOptions) => {
  return createTool({
    name: 'readFiles',
    description: 'Read the content of files from the project. Returns file contents.',
    parameters: z.object({
      fileIds: z.array(z.string()).describe('Array of file IDs to read'),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsedParams = paramsSchema.safeParse(params);
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
