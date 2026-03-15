import { describe, it, expect } from 'vitest';
import { getLevel, getLevelProgress } from '../../../lib/points';

describe('getLevel()', () => {
  it('returns Prompt-Lehrling for 0 pts', () => expect(getLevel(0)).toBe('Prompt-Lehrling'));
  it('returns Prompt-Lehrling for 99 pts', () => expect(getLevel(99)).toBe('Prompt-Lehrling'));
  it('returns Prompt-Handwerker for 100 pts', () => expect(getLevel(100)).toBe('Prompt-Handwerker'));
  it('returns Prompt-Handwerker for 299 pts', () => expect(getLevel(299)).toBe('Prompt-Handwerker'));
  it('returns Prompt-Schmied for 300 pts', () => expect(getLevel(300)).toBe('Prompt-Schmied'));
  it('returns Prompt-Schmied for 599 pts', () => expect(getLevel(599)).toBe('Prompt-Schmied'));
  it('returns KI-Botschafter for 600 pts', () => expect(getLevel(600)).toBe('KI-Botschafter'));
  it('returns KI-Botschafter for 9999 pts', () => expect(getLevel(9999)).toBe('KI-Botschafter'));
});

describe('getLevelProgress()', () => {
  it('has 0% progress at 0 pts', () => expect(getLevelProgress(0).percentage).toBe(0));
  it('has 50% progress at 50 pts (50/100 in first band)', () => expect(getLevelProgress(50).percentage).toBe(50));
  it('has correct current level at 150 pts', () => expect(getLevelProgress(150).level).toBe('Prompt-Handwerker'));
  it('returns null nextLevel at max level (600+ pts)', () => expect(getLevelProgress(600).nextLevel).toBeNull());
  it('returns nextLevel at non-max level', () => expect(getLevelProgress(0).nextLevel).toBe('Prompt-Handwerker'));
});
