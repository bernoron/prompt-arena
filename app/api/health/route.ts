/**
 * GET /api/health
 *
 * Lightweight liveness / readiness probe.
 *
 * Returns:
 *   200  { status: "ok",   dbMs, ts }
 *   503  { status: "error", error, ts }
 *
 * `dbMs` is the round-trip time (in ms) for a simple Prisma ping query.
 * Use this endpoint from uptime monitors, Docker HEALTHCHECK, or k8s probes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Each health check hits the DB — rate-limit to prevent cheap DoS
  // amplification. 120/min per IP is far above any monitor's poll rate.
  if (!readLimiter.check(`health:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const start = Date.now();

  try {
    // Minimal DB round-trip — raw query works on any Prisma datasource
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Date.now() - start;

    const body = {
      status: 'ok',
      dbMs,
      ts:     new Date().toISOString(),
    };

    logger.debug('health check ok', { dbMs });
    return NextResponse.json(body);
  } catch (err) {
    const dbMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    // Log the real cause server-side; never echo internal error details to clients.
    logger.error('health check failed', { dbMs, error: message });

    return NextResponse.json(
      {
        status: 'error',
        ts:     new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
