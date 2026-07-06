/**
 * GET /api/learn?userId=<id>
 *
 * Returns all learning modules with lessons and per-user progress.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { optionalUser, parseOptionalPositiveInt } from '@/lib/route-auth';
import { getLearnModules } from '@/lib/services/learn-service';

// @spec AC-08-001
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const requestedUserId = parseOptionalPositiveInt(req.nextUrl.searchParams.get('userId'), 'userId');
  if (requestedUserId instanceof NextResponse) return requestedUserId;

  const auth = await optionalUser(req, requestedUserId);
  if ('response' in auth) return auth.response;
  const userId = auth.userId ?? 0;

  const result = await getLearnModules(userId);

  return NextResponse.json(result);
}
