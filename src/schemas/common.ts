import { z } from 'zod';

export const idSchema = z.string().trim().min(1, 'ID is required').max(128, 'ID is too long');

export const promptSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a message')
  .max(10_000, 'Message must be 10,000 characters or fewer');

export const codeSchema = z.string().max(500_000, 'Code must be 500,000 characters or fewer');

export const httpUrlSchema = z
  .url({ protocol: /^https?$/, error: 'Please enter a valid HTTP or HTTPS URL' })
  .trim()
  .max(2048, 'URL is too long');

export const queryLimitSchema = z.number().int().min(1).max(1000);

export const secretSchema = z.string().trim().min(1).max(4096);

export const redirectPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .regex(/^\/(?!\/)/, 'Redirect must be a local path');
