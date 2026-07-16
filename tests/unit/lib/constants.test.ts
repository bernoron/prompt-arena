import { describe, it, expect } from 'vitest';
import { getRarity, ONBOARDING_STEPS, RECENT_FEATURES } from '../../../lib/constants';

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

// @spec AC-13-008 (CR-006)
describe('RECENT_FEATURES', () => {
  it('has at most 10 entries', () => {
    expect(RECENT_FEATURES.length).toBeLessThanOrEqual(10);
  });

  it('is sorted newest first', () => {
    const dates = RECENT_FEATURES.map((f) => f.date);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it('every entry has a non-empty icon, title, and description, and a valid ISO date', () => {
    for (const f of RECENT_FEATURES) {
      expect(f.icon.length).toBeGreaterThan(0);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(f.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('contains no raw commit-message artifacts (CR-006: curated German text, not CHANGELOG.md)', () => {
    for (const f of RECENT_FEATURES) {
      expect(f.title).not.toMatch(/\bCR-\d{3}\b.*:/); // no "scope:" commit-style prefix
      expect(f.description).not.toMatch(/\(\[.*\]\(https?:\/\//); // no markdown commit links
    }
  });
});
