import { serve } from 'inngest/next';

import { processMessage } from '@/features/conversations/inngest/process-message';
import { exportGitHubRepo } from '@/features/projects/inngest/export-github-repo';
import { importGitHubRepo } from '@/features/projects/inngest/import-github-repo';

import { inngest } from '@/inngest/client';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage, importGitHubRepo, exportGitHubRepo],
});
