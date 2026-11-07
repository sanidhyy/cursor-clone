import { createTool } from '@inngest/agent-kit';

import { deleteFilesParamsSchema } from '@/features/conversations/schemas/tools';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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

      try {
        return await toolStep?.run('delete-files', async () => {
          const files = await convex.query(api.system.getProjectFiles, { internalKey, projectId });
          const filesMap = new Map(files.map((file) => [file._id, file]));
          const selected = new Set(parsedParams.data.fileIds as Id<'files'>[]);
          const missing = [...selected].filter((id) => !filesMap.has(id));
          if (missing.length)
            return `Error: Files not found: ${missing.join(', ')}. Use listFiles to get valid IDs.`;

          const roots = [...selected].filter((id) => {
            let parentId = filesMap.get(id)?.parentId;
            const visited = new Set<Id<'files'>>();
            while (parentId && !visited.has(parentId)) {
              if (selected.has(parentId)) return false;
              visited.add(parentId);
              parentId = filesMap.get(parentId)?.parentId;
            }
            return true;
          });
          const results: string[] = [];
          for (const fileId of roots) {
            const file = filesMap.get(fileId)!;
            try {
              await convex.mutation(api.system.deleteFile, { internalKey, projectId, fileId });
              results.push(`Deleted ${file.type} "${file.name}" successfully`);
            } catch (error) {
              results.push(
                `Error deleting "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
          return results.join('\n');
        });
      } catch (error) {
        return `Error deleting files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
