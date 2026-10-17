import { NonRetriableError } from 'inngest';
import ky from 'ky';
import { Octokit } from 'octokit';

import { api } from '@/../convex/_generated/api';
import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import { convex } from '@/lib/convex-client';

interface ExportGitHubRepoEvent {
  projectId: Id<'projects'>;
  repoName: string;
  visibility: 'public' | 'private';
  description?: string;
  githubToken: string;
}

type FileWithUrl = Doc<'files'> & {
  storageUrl: string | null;
};

export const exportGitHubRepo = inngest.createFunction(
  {
    id: 'export-github-repo',
    cancelOn: [
      {
        event: 'github/export.cancel',
        if: 'event.data.projectId == async.data.projectId',
      },
    ],
    onFailure: async ({ event, step }) => {
      const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

      const { projectId } = event.data.event.data as ExportGitHubRepoEvent;

      await step.run('set-failed-status', async () => {
        await convex.mutation(api.system.updateExportStatus, {
          internalKey,
          projectId,
          status: 'failed',
        });
      });
    },
    triggers: { event: 'github/export.repo' },
  },
  async ({ event, step }) => {
    const { projectId, repoName, visibility, description, githubToken } =
      event.data as ExportGitHubRepoEvent;
    const internalKey = env.POLARIS_CONVEX_INTERNAL_KEY;

    await step.run('set-exporting-status', async () => {
      await convex.mutation(api.system.updateExportStatus, {
        internalKey,
        projectId,
        status: 'exporting',
      });
    });

    const octokit = new Octokit({ auth: githubToken });

    const { data: user } = await step.run(
      'get-github-user',
      async () => await octokit.rest.users.getAuthenticated()
    );

    const { data: repo } = await step.run('create-repo', async () => {
      return await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: description || 'Exported from Polaris',
        private: visibility === 'private',
        auto_init: true,
      });
    });

    await step.sleep('wait-for-repo-init', '3s');

    const initialCommitSha = await step.run('get-initial-commit', async () => {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: repoName,
        ref: 'heads/main',
      });

      return ref.object.sha;
    });

    const files = await step.run('fetch-project-files', async () => {
      return await convex.query(api.system.getProjectFilesWithUrls, {
        internalKey,
        projectId,
      });
    });

    const buildFilePaths = (files: FileWithUrl[]) => {
      const fileMap = new Map<Id<'files'>, FileWithUrl>();
      files.forEach((file) => fileMap.set(file._id, file));

      const getFullPath = (file: FileWithUrl): string => {
        if (!file.parentId) return file.name;

        const parent = fileMap.get(file.parentId);
        if (!parent) return file.name;

        return `${getFullPath(parent)}/${file.name}`;
      };

      const paths: Record<string, FileWithUrl> = {};
      files.forEach((file) => {
        paths[getFullPath(file)] = file;
      });

      return paths;
    };

    const filePaths = buildFilePaths(files);

    const fileEntries = Object.entries(filePaths).filter(([, file]) => file.type === 'file');
    if (!fileEntries.length) throw new NonRetriableError('No files to export');

    const treeItems = await step.run('create-blobs', async () => {
      const items: {
        path: string;
        mode: '100644';
        type: 'blob';
        sha: string;
      }[] = [];

      for (const [path, file] of fileEntries) {
        let content: string;
        let encoding: 'utf-8' | 'base64' = 'utf-8';

        if (file.content !== undefined) content = file.content;
        else if (!!file.storageUrl) {
          const response = await ky.get(file.storageUrl);
          const buffer = Buffer.from(await response.arrayBuffer());

          content = buffer.toString('base64');
          encoding = 'base64';
        } else continue;

        const { data: blob } = await octokit.rest.git.createBlob({
          owner: user.login,
          repo: repoName,
          content,
          encoding,
        });

        items.push({
          path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      }

      return items;
    });

    if (!treeItems.length) throw new NonRetriableError('Failed to create any file');

    const { data: tree } = await step.run('create-tree', async () => {
      return await octokit.rest.git.createTree({
        owner: user.login,
        repo: repoName,
        tree: treeItems,
      });
    });

    const { data: commit } = await step.run('create-commit', async () => {
      return await octokit.rest.git.createCommit({
        owner: user.login,
        repo: repoName,
        message: 'Initial commit from Polaris',
        tree: tree.sha,
        parents: [initialCommitSha],
      });
    });

    await step.run('update-branch-ref', async () => {
      return await octokit.rest.git.updateRef({
        owner: user.login,
        repo: repoName,
        ref: 'heads/main',
        sha: commit.sha,
        force: true,
      });
    });

    await step.run('set-completed-status', async () => {
      await convex.mutation(api.system.updateExportStatus, {
        internalKey,
        projectId,
        status: 'completed',
        repoUrl: repo.html_url,
      });
    });

    return {
      repoUrl: repo.html_url,
      filesExported: treeItems.length,
    };
  }
);
