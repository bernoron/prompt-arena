/**
 * POST /api/auth/logout
 *
 * Clears the user session cookie.
 */
import { NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/user-auth';

// @spec AC-01-008
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE);
  return res;
}
