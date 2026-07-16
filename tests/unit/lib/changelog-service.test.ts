import { describe, it, expect } from 'vitest';
import { parseChangelogFeatures } from '../../../lib/services/changelog-service';

const SAMPLE = `# Changelog

## [8.3.0](https://github.com/x/y/compare/v8.2.2...v8.3.0) (2026-07-07)


### Features

* **onboarding:** add User.onboardingCompletedAt column ([815d03a](https://github.com/x/y/commit/815d03a))
* **onboarding:** implement first-login onboarding funnel ([58001d5](https://github.com/x/y/commit/58001d5))


### Bug Fixes

* **auth:** handle empty ADMIN_PATH/USER_SECRET as unconfigured, not as a value ([c713adc](https://github.com/x/y/commit/c713adc))

## [8.2.1](https://github.com/x/y/compare/v8.2.0...v8.2.1) (2026-07-07)


### Performance Improvements

* server-render page data + tune SQLite/deploy to kill the client waterfall ([70f5990](https://github.com/x/y/commit/70f5990))

## [8.2.0](https://github.com/x/y/compare/v8.1.3...v8.2.0) (2026-07-07)


### Features

* **landing:** add public landing page with anonymized prompt showcase ([a984a99](https://github.com/x/y/commit/a984a99))
`;

describe('parseChangelogFeatures', () => {
  it('extracts scoped feature entries in file order (newest release first)', () => {
    const result = parseChangelogFeatures(SAMPLE, 10);
    expect(result).toEqual([
      { version: '8.3.0', date: '2026-07-07', scope: 'onboarding', description: 'add User.onboardingCompletedAt column' },
      { version: '8.3.0', date: '2026-07-07', scope: 'onboarding', description: 'implement first-login onboarding funnel' },
      { version: '8.2.0', date: '2026-07-07', scope: 'landing', description: 'add public landing page with anonymized prompt showcase' },
    ]);
  });

  it('ignores Bug Fixes and Performance Improvements sections', () => {
    const result = parseChangelogFeatures(SAMPLE, 10);
    expect(result.some((f) => f.description.includes('ADMIN_PATH'))).toBe(false);
    expect(result.some((f) => f.description.includes('waterfall'))).toBe(false);
  });

  it('handles scopes with non-word characters, e.g. "seed+admin"', () => {
    const withSymbolScope = `## [7.1.0](https://x) (2026-06-28)

### Features

* **seed+admin:** system user prompts, hidden admin URL ([abc](https://x/commit/abc))
`;
    expect(parseChangelogFeatures(withSymbolScope, 10)).toEqual([
      { version: '7.1.0', date: '2026-06-28', scope: 'seed+admin', description: 'system user prompts, hidden admin URL' },
    ]);
  });

  it('handles unscoped feature bullets (no "**scope:**" prefix)', () => {
    const withUnscoped = `## [1.0.0](https://x) (2026-01-01)

### Features

* ship the whole app ([abc123](https://x/commit/abc123))
`;
    expect(parseChangelogFeatures(withUnscoped, 10)).toEqual([
      { version: '1.0.0', date: '2026-01-01', scope: null, description: 'ship the whole app' },
    ]);
  });

  it('stops once the limit is reached', () => {
    expect(parseChangelogFeatures(SAMPLE, 1)).toHaveLength(1);
  });

  it('handles CRLF line endings (Release Please writes CHANGELOG.md with \\r\\n on this repo)', () => {
    const crlf = SAMPLE.replace(/\n/g, '\r\n');
    expect(parseChangelogFeatures(crlf, 10)).toEqual(parseChangelogFeatures(SAMPLE, 10));
  });

  it('returns an empty list when there are no Features sections', () => {
    const noFeatures = `## [1.0.0](https://x) (2026-01-01)

### Bug Fixes

* **x:** fix something ([abc](https://x/commit/abc))
`;
    expect(parseChangelogFeatures(noFeatures, 10)).toEqual([]);
  });
});
