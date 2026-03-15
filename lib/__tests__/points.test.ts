import { describe, it, expect } from 'vitest';
import { getLevel, getLevelProgress, POINTS } from '../points';

describe('getLevel', () => {
  it('returns Prompt-Lehrling for 0 points', () => {
    expect(getLevel(0)).toBe('Prompt-Lehrling');
  });
  it('returns Prompt-Lehrling for 99 points', () => {
    expect(getLevel(99)).toBe('Prompt-Lehrling');
  });
  it('returns Prompt-Handwerker at 100 points', () => {
    expect(getLevel(100)).toBe('Prompt-Handwerker');
  });
  it('returns Prompt-Schmied at 300 points', () => {
    expect(getLevel(300)).toBe('Prompt-Schmied');
  });
  it('returns KI-Botschafter at 600 points', () => {
    expect(getLevel(600)).toBe('KI-Botschafter');
  });
  it('returns KI-Botschafter for very high points', () => {
    expect(getLevel(9999)).toBe('KI-Botschafter');
  });
});

describe('getLevelProgress', () => {
  it('returns 0% at start of Lehrling band', () => {
    const p = getLevelProgress(0);
    expect(p.percentage).toBe(0);
    expect(p.level).toBe('Prompt-Lehrling');
  });
  it('returns 100% at max level', () => {
    const p = getLevelProgress(9999);
    expect(p.percentage).toBe(100);
    expect(p.nextLevel).toBeNull();
  });
  it('calculates percentage within Handwerker band', () => {
    // Band: 100-299, at 200 = 50%
    const p = getLevelProgress(200);
    expect(p.percentage).toBe(50);
  });
});

describe('POINTS constants', () => {
  it('has all required action keys', () => {
    expect(POINTS.SUBMIT_PROMPT).toBeGreaterThan(0);
    expect(POINTS.PROMPT_USED).toBeGreaterThan(0);
    expect(POINTS.VOTE_ON_PROMPT).toBeGreaterThan(0);
    expect(POINTS.CHALLENGE_SUBMIT).toBeGreaterThan(0);
    expect(POINTS.CHALLENGE_WIN).toBeGreaterThan(0);
  });
  it('CHALLENGE_WIN > CHALLENGE_SUBMIT (winning worth more)', () => {
    expect(POINTS.CHALLENGE_WIN).toBeGreaterThan(POINTS.CHALLENGE_SUBMIT);
  });
});
