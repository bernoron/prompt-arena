/**
 * GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user
 * POST /api/favorites               – Toggle a prompt as favorite (add / remove)
 *
 * POST body: { promptId: number } — the user comes from the session cookie.
 *
 * Idempotent point distribution:
 *   The FIRST time a user favorites a prompt the prompt author receives
 *   FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT
 *   award points again. We track this via the `pointsAwarded` flag on the
 *   Favorite row, which persists even after soft-deletion (isActive = false).
 *
 * Soft-delete pattern:
 *   Favorites are never hard-deleted. "Remove" sets isActive = false so the
 *   pointsAwarded history is preserved. "Add" sets isActive = true (upsert).
 */

import { NextRequest, NextResponse } from 'next/server';
import { FavoriteSchema, validationError } from '@/lib/validation';
import { writeLimiter, readLimiter, getClientIp } from '@/lib/rate-limit';
import { parseOptionalPositiveInt, requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';
import { listFavorites, toggleFavorite } from '@/lib/services/favorite-service';

// ─── GET /api/favorites ──────────────────────────────────────────────────────

// @spec AC-05-002
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'GET /api/favorites', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const requestedUserId = parseOptionalPositiveInt(
    new URL(req.url).searchParams.get('userId'),
    'userId',
  );
  if (requestedUserId instanceof NextResponse) return requestedUserId;

  const auth = await requireUser(req, requestedUserId);
  if ('response' in auth) return auth.response;
  const parsedUserId = auth.userId;

  try {
    const result = await listFavorites(parsedUserId);
    return NextResponse.json(result);
  } catch (err) {
    logger.error('failed to fetch favorites', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// ─── POST /api/favorites ─────────────────────────────────────────────────────

// @spec AC-05-001, AC-05-007
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/favorites', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = FavoriteSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const reqId = req.headers.get('x-request-id') ?? undefined;

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const { promptId } = result.data;
  const userId = auth.userId;

  try {
    const { favorited } = await toggleFavorite(promptId, userId);
    logger.info(favorited ? 'favorite added' : 'favorite removed', { promptId, userId, reqId });
    return NextResponse.json({ favorited });
  } catch (err) {
    logger.error('favorite toggle failed', { promptId, userId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
