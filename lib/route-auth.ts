import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthorised } from '@/lib/admin-auth';
import { USER_COOKIE, verifyUserCookie } from '@/lib/user-session';

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
  const userSecretConfigured = Boolean(process.env.USER_SECRET);

  if (!userSecretConfigured) {
    if (process.env.NODE_ENV === 'production') {
      return {
        response: NextResponse.json(
          { error: 'User authentication is not configured on this server' },
          { status: 503 },
        ),
      };
    }

    if (requestedUserId && requestedUserId > 0) {
      return { userId: requestedUserId };
    }

    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const sessionUserId = await verifyUserCookie(req.cookies.get(USER_COOKIE)?.value);
  if (!sessionUserId) {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

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

export async function optionalUser(
  req: NextRequest,
  requestedUserId?: number | null,
): Promise<OptionalUserAuthResult> {
  if (!process.env.USER_SECRET) {
    if (process.env.NODE_ENV === 'production' && requestedUserId) {
      return {
        response: NextResponse.json(
          { error: 'User authentication is not configured on this server' },
          { status: 503 },
        ),
      };
    }

    return { userId: requestedUserId ?? null };
  }

  const sessionUserId = await verifyUserCookie(req.cookies.get(USER_COOKIE)?.value);

  if (requestedUserId) {
    if (!sessionUserId) {
      return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
    }

    if (sessionUserId !== requestedUserId) {
      return {
        response: NextResponse.json(
          { error: 'Forbidden - userId does not match your session' },
          { status: 403 },
        ),
      };
    }
  }

  return { userId: sessionUserId ?? null };
}
