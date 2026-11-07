import type { CodeContext } from '@/features/conversations/schemas';

export const formatMessageWithContext = (content: string, context: CodeContext[] = []) =>
  context.length ? `${content}\n\nSelected code context:\n${JSON.stringify(context)}` : content;
