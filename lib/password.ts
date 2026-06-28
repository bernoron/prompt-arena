/**
 * Password hashing and verification using Node.js built-in scrypt.
 * No external dependencies required.
 *
 * Format: `<hex-salt>:<hex-hash>` (both stored as hex strings)
 */

import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LEN    = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const sepIdx = stored.indexOf(':');
  if (sepIdx === -1) return false;
  const salt       = stored.slice(0, sepIdx);
  const storedHash = Buffer.from(stored.slice(sepIdx + 1), 'hex');
  const derived    = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  if (derived.length !== storedHash.length) return false;
  return timingSafeEqual(derived, storedHash);
}
