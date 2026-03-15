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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
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

    logger.error('health check failed', { dbMs, error: message });

    return NextResponse.json(
      {
        status: 'error',
        error:  message,
        ts:     new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
