import { describe, it, expect } from 'vitest';
import { slugify } from '../../../lib/slug';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Marketing Texte')).toBe('marketing-texte');
  });
  it('collapses non-alphanumeric runs into a single hyphen', () => {
    expect(slugify('Coding & Debugging!!')).toBe('coding-debugging');
  });
  it('trims leading/trailing hyphens', () => {
    expect(slugify('  -Recherche-  ')).toBe('recherche');
  });
  it('returns an empty string for labels with no usable characters', () => {
    expect(slugify('???')).toBe('');
  });
  it('is stable for casing/whitespace variants of the same label', () => {
    expect(slugify('Coding')).toBe(slugify('  CODING  '));
  });
  it('truncates to 40 characters', () => {
    const long = 'a'.repeat(60);
    expect(slugify(long)).toHaveLength(40);
  });
});
