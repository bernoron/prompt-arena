/**
 * E-Mail encryption at rest — AES-256-GCM + HMAC-SHA256 blind index.
 *
 * Why AES-256-GCM:
 *   - Authenticated encryption: any tampering with the ciphertext is detected.
 *   - Random IV per call: encrypting the same address twice yields different ciphertext.
 *
 * Why a separate HMAC blind index (emailHash):
 *   - AES-GCM is randomised → can't search by ciphertext.
 *   - We store HMAC-SHA256(email) for uniqueness checks without exposing plaintext.
 *
 * KEY SIZE: EMAIL_SECRET must be at least 32 characters; we derive a fixed-size
 * key via SHA-256 to avoid padding surprises with arbitrary-length secrets.
 *
 * @spec AC-12-001, AC-12-002, AC-12-009
 */

import { createHmac, createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const DEV_FALLBACK = 'dev-email-secret-NOT-FOR-PRODUCTION!';
// 96-bit (12-byte) IV is the spec-correct size for AES-GCM; 16-byte triggers
// a non-standard GHASH-based IV derivation in OpenSSL. Existing rows with 16-byte
// IVs continue to decrypt correctly because decryptEmail reads the IV length from
// the stored hex rather than this constant.
const IV_BYTES     = 12;
const KEY_BYTES    = 32; // AES-256

function getKey(): Buffer {
  const secret = process.env.EMAIL_SECRET ?? DEV_FALLBACK;
  // SHA-256 of the secret → always a valid 32-byte AES key, regardless of secret length
  return createHash('sha256').update(secret).digest();
}

/** Encrypt plaintext email. Returns `<ivHex>:<ciphertextHex>:<authTagHex>`. */
export function encryptEmail(email: string): string {
  const iv     = randomBytes(IV_BYTES);
  const key    = getKey();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc    = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Decrypt a stored email value.
 * Throws if the ciphertext has been tampered with (GCM auth-tag mismatch).
 */
export function decryptEmail(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid email ciphertext format');
  const [ivHex, encHex, tagHex] = parts;
  const key      = getKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/**
 * Deterministic HMAC-SHA256 blind index for uniqueness checks.
 * The email is normalised (lowercase, trimmed) before hashing so
 * "Max@Example.com" and "max@example.com" collide correctly.
 */
export function hashEmail(email: string): string {
  const secret = process.env.EMAIL_SECRET ?? DEV_FALLBACK;
  return createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('hex');
}

/** Returns true when EMAIL_SECRET is properly configured for production. */
export function isEmailSecretConfigured(): boolean {
  return Boolean(process.env.EMAIL_SECRET);
}
