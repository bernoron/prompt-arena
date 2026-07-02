import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRateLimiter, getClientIp } from '../../../lib/rate-limit';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function reqWithHeaders(headers: Record<string, string>) {
  const map = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { headers: { get: (name: string) => map.get(name.toLowerCase()) ?? null } };
}

describe('getClientIp', () => {
  it('prefers the platform-set client IP header over x-forwarded-for', () => {
    const req = reqWithHeaders({
      'fly-client-ip': '203.0.113.7',
      'x-forwarded-for': 'spoofed, 203.0.113.7',
    });
    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip when no platform header exists', () => {
    const req = reqWithHeaders({ 'x-real-ip': '198.51.100.4' });
    expect(getClientIp(req)).toBe('198.51.100.4');
  });

  it('uses the RIGHTMOST x-forwarded-for hop (trusted proxy), not the spoofable leftmost', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': 'attacker-chosen, 10.0.0.1, 203.0.113.9' });
    expect(getClientIp(req)).toBe('203.0.113.9');
  });

  it("returns 'unknown' without any proxy headers", () => {
    expect(getClientIp(reqWithHeaders({}))).toBe('unknown');
  });
});

describe('createRateLimiter', () => {
  it('blocks after max requests within the window and recovers afterwards', () => {
    vi.stubEnv('CI', '');
    vi.useFakeTimers();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(limiter.check('ip1')).toBe(true);
  });

  it('tracks keys independently', () => {
    vi.stubEnv('CI', '');
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(false);
    expect(limiter.check('b')).toBe(true);
  });

  it('does not grow without bound when flooded with unique keys', () => {
    vi.stubEnv('CI', '');
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

    // Simulate an attacker rotating spoofed identifiers
    for (let i = 0; i < 25_000; i += 1) {
      limiter.check(`spoof-${i}`);
    }

    // Store is capped — a fresh legitimate key must still be tracked correctly
    for (let i = 0; i < 5; i += 1) expect(limiter.check('legit')).toBe(true);
    expect(limiter.check('legit')).toBe(false);
  });
});
