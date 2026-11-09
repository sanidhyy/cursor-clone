import 'server-only';

import crypto from 'crypto';

import { env } from '@/env/server';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

const getKey = (salt: Buffer) =>
  crypto.pbkdf2Sync(env.VERIFICATION_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha256');

export const encrypt = (text: string): string => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(salt), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return `v1:${Buffer.concat([salt, iv, cipher.getAuthTag(), encrypted]).toString('base64')}`;
};

export const decrypt = (encryptedText: string): string => {
  try {
    if (!encryptedText.startsWith('v1:')) throw new Error('Unsupported encryption version');

    const buffer = Buffer.from(encryptedText.slice(3), 'base64');

    if (buffer.length <= SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
      throw new Error('Invalid encrypted data');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(salt), iv);

    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Unable to read your saved API key. Please replace it in AI Settings.');
  }
};
