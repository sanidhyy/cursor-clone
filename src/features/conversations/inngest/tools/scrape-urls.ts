import { createTool } from '@inngest/agent-kit';

import { scrapeUrlsParamsSchema } from '@/features/conversations/schemas/tools';

import { firecrawl } from '@/lib/firecrawl';

export const createScrapeUrlsTool = () => {
  return createTool({
    name: 'scrape-urls',
    description:
      'Scrape content from URLs to get documentation or reference material. Use this when the user provides URLs or references external documentation. Returns markdown content from the scraped pages.',
    parameters: scrapeUrlsParamsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsedParams = scrapeUrlsParamsSchema.safeParse(params);
      if (!parsedParams.success) return `Error: ${parsedParams.error.issues[0].message}`;

      const { urls } = parsedParams.data;

      try {
        return await toolStep?.run('scrape-urls', async () => {
          const results: { url: string; content: string }[] = [];

          for (const url of urls) {
            try {
              const result = await firecrawl.scrape(url, {
                formats: ['markdown'],
              });

              if (!!result.markdown) results.push({ url, content: result.markdown });
            } catch {
              results.push({ url, content: `Failed to scrape URL: ${url}` });
            }
          }

          if (!results.length) return 'No content could be scraped from the provided URLs.';

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error scraping URLs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
};
