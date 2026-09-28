import { firecrawl } from '@/lib/firecrawl';

import { inngest } from './client';

// TODO: Call a cheap model to auto detect the urls (even invalid ones like https://"example.com and auto correct them to https://example.com)
const URL_REGEX = /https?:\/\/[^\s]+/g;

export const processTask = inngest.createFunction(
  { id: 'process-task', triggers: { event: 'app/task.created' } },
  async ({ event, step }) => {
    const prompt = event.data.prompt as string;

    const urls = (await step.run('extract-urls', async () => {
      return prompt.match(URL_REGEX) || [];
    })) as string[];

    const scrapedContent = await step.run('scrape-urls', async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await firecrawl.scrape(url, { formats: ['markdown'] });

          return result.markdown || null;
        })
      );

      return results.filter(Boolean).join('\n\n');
    });

    const finalPrompt = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion: ${prompt}`
      : prompt;

    return { message: finalPrompt };
  }
);
