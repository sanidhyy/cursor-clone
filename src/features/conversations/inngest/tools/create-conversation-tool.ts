import type { GetStepTools, Inngest } from 'inngest';
import type { z } from 'zod';

// Tool execution stays outside the model's durable step so file operations retain
// their own Inngest checkpoints and are not repeated when inference is replayed.
export const createConversationTool = <Schema extends z.ZodType, Output>(definition: {
  name: string;
  description: string;
  parameters: Schema;
  handler: (input: unknown, options: { step?: GetStepTools<Inngest.Any> }) => Promise<Output>;
}) => definition;
