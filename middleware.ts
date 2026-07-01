/**
 * Next.js Edge Middleware – PromptArena
 *
 * Runs on every non-static request before it reaches a route handler.
 *
 * Responsibilities:
 *   1. Guard /admin/* and /api/admin/* behind an admin-session cookie.
 *      → /admin/login and /api/admin/login are exempt.
 *      → Unauthorised page requests → redirect to /admin/login.
 *      → Unauthorised API requests  → 401 JSON.
 *
 *   2. Guard all user-facing pages (not /login, /register) behind a
 *      valid user_session cookie.
 *      → Unauthenticated page requests → redirect to /login.
 *      → API routes handle their own auth via resolveUserId().
 *
 *   3. Assign a unique `x-request-id` to every request.
 *
 *   4. Emit a single "→ METHOD /path" log line per request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorised, ADMIN_COOKIE } from '@/lib/admin-auth';
import { verifyUserCookie, USER_COOKIE } from '@/lib/user-session';

const SILENT: string[] = ['/_next/', '/favicon'];

// Custom admin URL prefix — set ADMIN_PATH env var to hide /admin behind a secret path.
// Example: ADMIN_PATH=backstage → admin UI served at /backstage, direct /admin returns 404.
// Default: 'admin' (backward-compatible, no path rewriting).
const ADMIN_PREFIX = (process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '');
const CUSTOM_ADMIN = ADMIN_PREFIX !== 'admin';

/** Paths that do NOT require a user session. */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith(`/${ADMIN_PREFIX}`) ||
    pathname.startsWith('/api/')
  );
}

// @spec AC-07-003
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ── 1. Admin guard ─────────────────────────────────────────────────────────

  // Block direct /admin access when a custom path is configured
  if (CUSTOM_ADMIN && pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return new NextResponse(null, { status: 404 });
  }

  // Resolve effective admin path (custom prefix → /admin equivalent)
  const customAdminMatch = CUSTOM_ADMIN && pathname.startsWith(`/${ADMIN_PREFIX}`);
  const effectivePath = customAdminMatch
    ? '/admin' + pathname.slice(`/${ADMIN_PREFIX}`.length)
    : pathname;

  const isAdminPath = effectivePath.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLoginPath = effectivePath === '/admin/login' || pathname.startsWith('/api/admin/login');

  if (isAdminPath && !isLoginPath) {
    const cookieValue = req.cookies.get(ADMIN_COOKIE)?.value;
    const authorised  = await isAdminAuthorised(cookieValue);

    if (!authorised) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(`/${ADMIN_PREFIX}/login`, req.url));
    }
  }

  // Rewrite custom admin path to /admin so Next.js serves the right pages
  if (customAdminMatch) {
    const rewriteUrl = new URL(effectivePath, req.url);
    const rewritten  = NextResponse.rewrite(rewriteUrl);
    rewritten.headers.set('x-request-id', crypto.randomUUID());
    return rewritten;
  }

  // ── 2. User auth guard ─────────────────────────────────────────────────────
  if (!isPublicPath(pathname)) {
    const cookieValue = req.cookies.get(USER_COOKIE)?.value;
    const userId      = await verifyUserCookie(cookieValue);

    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 3. Request ID ──────────────────────────────────────────────────────────
  const reqId = crypto.randomUUID();
  const res   = NextResponse.next();
  res.headers.set('x-request-id', reqId);

  // ── 4. Request log ─────────────────────────────────────────────────────────
  const logLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  const isQuiet  = logLevel === 'error';
  const isStatic = SILENT.some((p) => pathname.startsWith(p));

  if (!isQuiet && !isStatic) {
    const ts    = new Date().toISOString();
    const isDev = process.env.NODE_ENV !== 'production';

    const line = isDev
      ? `\x1b[2m${ts}\x1b[0m \x1b[32mINFO \x1b[0m → ${req.method.padEnd(6)} ${pathname}  \x1b[2m[${reqId}]\x1b[0m`
      : JSON.stringify({ level: 'info', ts, msg: 'request', method: req.method, path: pathname, reqId });

    console.log(line);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
