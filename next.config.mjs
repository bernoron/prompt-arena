/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  // Playwright's default baseURL (playwright.config.ts) is http://127.0.0.1:3000,
  // but `npm run dev` only recognizes http://localhost:3000 as same-origin by
  // default. Since Next.js 16, requests from an unrecognized dev origin get
  // silently dropped instead of served (HMR sockets, and apparently plain
  // fetch() calls to API routes too) — e2e runs against `npm run dev` (i.e.
  // every local `git push`, see .githooks/pre-push) would otherwise hang on
  // any fetch() from the page, even though the exact same app works fine in
  // production (this allowlist is dev-only; Next ignores it in prod builds).
  allowedDevOrigins: ['127.0.0.1'],

  // The app does not use next/image. Disabling the optimizer removes the
  // /_next/image endpoint as an attack surface (several known DoS advisories
  // target the Image Optimization API in self-hosted deployments).
  images: {
    unoptimized: true,
  },

  // Don't advertise the framework/version (reduces fingerprinting).
  poweredByHeader: false,

  // Never emit browser source maps in production (would expose app source).
  // instrumentation.ts (env/secret validation) runs automatically on server
  // startup since Next 15 — no experimental.instrumentationHook flag needed.
  productionBrowserSourceMaps: false,

  /**
   * HTTP security headers applied to every response.
   *
   * These defend against common browser-level attacks:
   *   - Clickjacking          → X-Frame-Options / frame-ancestors
   *   - MIME-sniffing         → X-Content-Type-Options
   *   - Referrer leakage      → Referrer-Policy
   *   - Dangerous APIs        → Permissions-Policy
   *
   * Content-Security-Policy is NOT set here — it carries a per-request nonce
   * and is therefore built and attached in middleware.ts (see lib/csp.ts).
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Force HTTPS for 2 years; include subdomains. Only effective once the
          // server is behind HTTPS — has no effect over plain HTTP.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',   value: 'off' },
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
