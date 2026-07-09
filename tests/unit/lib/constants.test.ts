import { describe, it, expect } from 'vitest';
import { getRarity, ONBOARDING_STEPS } from '../../../lib/constants';

describe('getRarity()', () => {
  it('returns common for 0 uses', () => expect(getRarity(0)).toBe('common'));
  it('returns common for 9 uses', () => expect(getRarity(9)).toBe('common'));
  it('returns rare for 10 uses', () => expect(getRarity(10)).toBe('rare'));
  it('returns rare for 29 uses', () => expect(getRarity(29)).toBe('rare'));
  it('returns epic for 30 uses', () => expect(getRarity(30)).toBe('epic'));
  it('returns epic for 59 uses', () => expect(getRarity(59)).toBe('epic'));
  it('returns legendary for 60 uses', () => expect(getRarity(60)).toBe('legendary'));
  it('returns legendary for 1000 uses', () => expect(getRarity(1000)).toBe('legendary'));
});

// @spec AC-14-004
describe('ONBOARDING_STEPS', () => {
  it('has at least 5 steps', () => {
    expect(ONBOARDING_STEPS.length).toBeGreaterThanOrEqual(5);
  });

  it('every step has a non-empty icon, title, and body', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.icon.length).toBeGreaterThan(0);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
    }
  });
});
