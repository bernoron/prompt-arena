/**
 * Next.js Edge Middleware – PromptArena
 *
 * Runs on every non-static request before it reaches a route handler.
 *
 * Responsibilities:
 *   1. Guard /admin/* and /api/admin/* behind an admin-session cookie.
 *      → /admin/login and /api/admin/login are exempt (the login flow itself).
 *      → Unauthorised page requests → redirect to /admin/login.
 *      → Unauthorised API requests  → 401 JSON.
 *
 *   2. Assign a unique `x-request-id` to every request.
 *      → Visible in browser DevTools (Response Headers tab).
 *      → API routes can read it with req.headers.get('x-request-id')
 *        to correlate their own log lines with the middleware entry.
 *
 *   3. Emit a single "→ METHOD /path" log line per request.
 *      → Skipped for static assets to keep the terminal clean.
 *      → Suppressed completely when LOG_LEVEL=error (production quiet mode).
 *
 * Note: Response timing (ms) cannot be measured here because middleware
 * completes before the route handler runs. Response-level timing is handled
 * inside individual route handlers via the `logger` utility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorised, ADMIN_COOKIE } from '@/lib/admin-auth';


/** Static-asset path prefixes that are too noisy to log. */
const SILENT: string[] = ['/_next/', '/favicon'];

// @spec AC-07-003
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ── 1. Admin guard ─────────────────────────────────────────────────────────
  //  All /admin/* and /api/admin/* paths require a valid admin_session cookie,
  //  except the login endpoints themselves.
  const isAdminPath =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLoginPath =
    pathname === '/admin/login' || pathname.startsWith('/api/admin/login');

  if (isAdminPath && !isLoginPath) {
    const cookieValue = req.cookies.get(ADMIN_COOKIE)?.value;
    const authorised  = await isAdminAuthorised(cookieValue);

    if (!authorised) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 2. Request ID ──────────────────────────────────────────────────────────
  //  Attach a unique trace identifier to the response so developers can
  //  correlate browser requests with server log entries.
  const reqId = crypto.randomUUID();
  const res   = NextResponse.next();
  res.headers.set('x-request-id', reqId);

  // ── 3. Request log ─────────────────────────────────────────────────────────
  const logLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  const isQuiet  = logLevel === 'error';
  const isStatic = SILENT.some((p) => pathname.startsWith(p));

  if (!isQuiet && !isStatic) {
    const ts    = new Date().toISOString();
    const isDev = process.env.NODE_ENV !== 'production';

    const line = isDev
      // Coloured dev output
      ? `\x1b[2m${ts}\x1b[0m \x1b[32mINFO \x1b[0m → ${req.method.padEnd(6)} ${pathname}  \x1b[2m[${reqId}]\x1b[0m`
      // JSON prod output
      : JSON.stringify({
          level: 'info', ts, msg: 'request',
          method: req.method, path: pathname, reqId,
        });

    console.log(line);
  }

  return res;
}

export const config = {
  // Match all paths except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
