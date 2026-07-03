/**
 * Content-Security-Policy builder (Edge-safe — string building only).
 *
 * Production uses a per-request nonce + 'strict-dynamic' instead of
 * 'unsafe-inline' for scripts. Next.js automatically stamps the nonce onto its
 * own hydration/bootstrap scripts when it finds the nonce in the incoming
 * request's Content-Security-Policy header (set by middleware.ts). This closes
 * the inline-script XSS vector that 'unsafe-inline' leaves open.
 *
 * Notes:
 *   - script-src: DEV keeps 'unsafe-inline' 'unsafe-eval' because webpack HMR
 *     evaluates code strings at runtime; PROD uses nonce + 'strict-dynamic'.
 *   - style-src still needs 'unsafe-inline': Next.js and Tailwind inject inline
 *     <style>/style="" that cannot carry a nonce. Styles are a far weaker XSS
 *     sink than scripts, so this remains an accepted residual.
 */

export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const connectSrc = isDev
    ? "connect-src 'self' ws://localhost:* wss://localhost:*"
    : "connect-src 'self'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Block <object>/<embed> plugin content entirely — never used by the app.
    "object-src 'none'",
  ].join('; ');
}
