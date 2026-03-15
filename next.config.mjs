/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy
 *
 * Development vs. Production differ in one directive:
 *   script-src in DEV needs 'unsafe-eval' because Next.js HMR (webpack)
 *   evaluates code strings at runtime for hot-reloading.
 *   In production that is never needed and would be a security risk.
 *
 * All other headers are identical in both environments.
 */
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' only in dev (HMR / webpack); removed in production builds.
  // 'unsafe-inline' is required for Next.js inline script hydration chunks
  // (the __NEXT_DATA__ bootstrap). Nonce-based CSP would remove this need
  // but requires a custom middleware layer not yet implemented here.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  // Allow WebSocket connections in dev (Next.js HMR uses ws://)
  isDev
    ? "connect-src 'self' ws://localhost:* wss://localhost:*"
    : "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig = {
  /**
   * HTTP security headers applied to every response.
   *
   * These defend against common browser-level attacks:
   *   - Clickjacking          → X-Frame-Options / frame-ancestors
   *   - MIME-sniffing         → X-Content-Type-Options
   *   - Referrer leakage      → Referrer-Policy
   *   - Dangerous APIs        → Permissions-Policy
   *   - XSS / injection       → Content-Security-Policy
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',   value: 'off' },
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key:   'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
