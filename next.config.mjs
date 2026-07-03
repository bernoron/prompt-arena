/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

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
