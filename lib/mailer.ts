/**
 * Outbound e-mail (CR-003, @spec AC-01-015).
 *
 * The app previously never SENT mail (feature 12 only stored addresses encrypted).
 * This module introduces a minimal, pluggable transport so the password-reset
 * flow can be built and tested end-to-end today with a mock/log transport, and
 * a real provider (SMTP / Resend / Postmark / SES) can be wired in later purely
 * via configuration — no call-site changes.
 *
 * Transport selection (resolved per send from env):
 *   - RESEND_API_KEY set  → Resend HTTP API transport (real delivery).
 *   - otherwise           → "log" transport: writes the message to the
 *     structured logger instead of a real inbox. Used in dev/test, and as a
 *     safe fallback in production before the secret is configured.
 *
 * Callers depend only on `sendMail` / `sendPasswordResetEmail`, so swapping the
 * transport never touches the routes.
 */

import { logger } from './logger';

/** Default sender. Resend's shared onboarding domain works for first tests;
 *  override with MAIL_FROM once you've verified your own domain. */
const DEFAULT_FROM = 'PromptArena <onboarding@resend.dev>';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailTransport {
  name: string;
  send(msg: MailMessage): Promise<void>;
}

/** Dev/test transport: logs the mail instead of delivering it. */
const logTransport: MailTransport = {
  name: 'log',
  async send(msg: MailMessage): Promise<void> {
    // Never log the raw body/link at info level in production-shaped output;
    // the subject + recipient are enough to confirm dispatch. The reset link
    // itself is surfaced to tests via the request route's dev-only field.
    logger.info('mail dispatched (log transport)', { to: msg.to, subject: msg.subject });
  },
};

/**
 * Resend HTTP API transport (https://resend.com/docs/api-reference/emails/send-email).
 * No SDK dependency — a single fetch keeps the surface small and edge-friendly.
 */
export function createResendTransport(apiKey: string): MailTransport {
  return {
    name: 'resend',
    async send(msg: MailMessage): Promise<void> {
      const from = process.env.MAIL_FROM || DEFAULT_FROM;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          ...(msg.html ? { html: msg.html } : {}),
        }),
      });

      if (!res.ok) {
        // Surface a bounded error; the caller logs it and degrades gracefully.
        const detail = await res.text().catch(() => '');
        throw new Error(`Resend API error ${res.status}: ${detail.slice(0, 200)}`);
      }
    },
  };
}

/**
 * Resolve the active transport from env, per send. Real delivery when
 * RESEND_API_KEY is set; otherwise the log transport (dev/test, or production
 * before the secret is configured — password reset then no-ops loudly rather
 * than crashing).
 */
export function getMailTransport(): MailTransport {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) return createResendTransport(apiKey);

  if (process.env.NODE_ENV === 'production') {
    logger.warn('e-mail provider not configured (RESEND_API_KEY missing) — using log transport');
  }
  return logTransport;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  await getMailTransport().send(msg);
}

/** Compose + send the German password-reset e-mail (BAC-01-014). */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'PromptArena – Passwort zurücksetzen';
  const text = [
    'Hallo,',
    '',
    'du hast angefragt, dein PromptArena-Passwort zurückzusetzen.',
    'Über den folgenden Link kannst du ein neues Passwort vergeben:',
    '',
    resetUrl,
    '',
    'Der Link ist eine Stunde lang gültig und kann nur einmal verwendet werden.',
    'Falls du das nicht warst, kannst du diese E-Mail ignorieren — dein Passwort bleibt unverändert.',
    '',
    'Viele Grüße',
    'Dein PromptArena-Team',
  ].join('\n');

  await sendMail({ to, subject, text });
}
