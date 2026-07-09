import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthorised } from '@/lib/admin-auth';
import { USER_COOKIE, verifyUserCookie, isUserSecretConfigured } from '@/lib/user-session';

type UserAuthResult =
  | { userId: number }
  | { response: NextResponse };

type OptionalUserAuthResult =
  | { userId: number | null }
  | { response: NextResponse };

export function parseOptionalPositiveInt(
  value: string | null,
  field: string,
): number | NextResponse | null {
  if (!value || value === '0') return null;
  if (!/^\d+$/.test(value)) {
    return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
  }

  return parsed;
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authorised = await isAdminAuthorised(req.cookies.get(ADMIN_COOKIE)?.value);
  return authorised
    ? null
    : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function requireUser(
  req: NextRequest,
  requestedUserId?: number | null,
): Promise<UserAuthResult> {
  const userSecretConfigured = isUserSecretConfigured();

  if (!userSecretConfigured && process.env.NODE_ENV === 'production') {
    return {
      response: NextResponse.json(
        { error: 'User authentication is not configured on this server' },
        { status: 503 },
      ),
    };
  }

  // verifyUserCookie() signs/verifies with a dev-only fallback secret when
  // USER_SECRET is unset (never in production, guarded above), so a real
  // session cookie from register/login already works here without it.
  const sessionUserId = await verifyUserCookie(req.cookies.get(USER_COOKIE)?.value);
  if (sessionUserId) {
    if (requestedUserId && sessionUserId !== requestedUserId) {
      return {
        response: NextResponse.json(
          { error: 'Forbidden - userId does not match your session' },
          { status: 403 },
        ),
      };
    }
    return { userId: sessionUserId };
  }

  // Dev-only convenience for callers with no session cookie at all (e.g. quick
  // manual testing against a fresh checkout): trust an explicit body userId.
  if (!userSecretConfigured && requestedUserId && requestedUserId > 0) {
    return { userId: requestedUserId };
  }

  return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
}

export async function optionalUser(
  req: NextRequest,
  requestedUserId?: number | null,
): Promise<OptionalUserAuthResult> {
  const userSecretConfigured = isUserSecretConfigured();

  if (!userSecretConfigured && process.env.NODE_ENV === 'production' && requestedUserId) {
    return {
      response: NextResponse.json(
        { error: 'User authentication is not configured on this server' },
        { status: 503 },
      ),
    };
  }

  // verifyUserCookie() falls back to a dev-only secret when USER_SECRET is
  // unset (never in production, guarded above), so prefer it over trusting
  // a client-supplied userId whenever a real session cookie is present.
  const sessionUserId = await verifyUserCookie(req.cookies.get(USER_COOKIE)?.value);
  const effectiveUserId = sessionUserId ?? (userSecretConfigured ? null : (requestedUserId ?? null));

  if (requestedUserId) {
    if (!effectiveUserId) {
      return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
    }

    if (effectiveUserId !== requestedUserId) {
      return {
        response: NextResponse.json(
          { error: 'Forbidden - userId does not match your session' },
          { status: 403 },
        ),
      };
    }
  }

  return { userId: effectiveUserId };
}
