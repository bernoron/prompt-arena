/**
 * Outbound e-mail (CR-003, @spec AC-01-015).
 *
 * The app previously never SENT mail (feature 12 only stored addresses encrypted).
 * This module introduces a minimal, pluggable transport so the password-reset
 * flow can be built and tested end-to-end today with a mock/log transport, and
 * a real provider (SMTP / Resend / Postmark / SES) can be wired in later purely
 * via configuration — no call-site changes.
 *
 * Transport selection:
 *   - Default: "log" transport — writes the message to the structured logger
 *     instead of a real inbox. Nothing external to provision.
 *   - Future: read process.env.MAIL_TRANSPORT and dispatch to a real provider.
 *
 * Callers depend only on `sendMail` / `sendPasswordResetEmail`, so swapping the
 * transport never touches the routes.
 */

import { logger } from './logger';

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
 * Resolve the active transport. Today always the log transport; the switch is
 * kept here so a real provider is a one-line addition guarded by env.
 */
export function getMailTransport(): MailTransport {
  // Example future wiring:
  //   if (process.env.MAIL_TRANSPORT === 'smtp') return createSmtpTransport();
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
