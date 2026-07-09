# Changelog

## [8.3.0](https://github.com/bernoron/prompt-arena/compare/v8.2.2...v8.3.0) (2026-07-07)


### Features

* **onboarding:** add User.onboardingCompletedAt column ([815d03a](https://github.com/bernoron/prompt-arena/commit/815d03a27b39472b550685dc53c2a87809ef45b8))
* **onboarding:** implement first-login onboarding funnel ([58001d5](https://github.com/bernoron/prompt-arena/commit/58001d50357e0e2bc0cace118f279eb40775bb0f))


### Bug Fixes

* **auth:** handle empty ADMIN_PATH/USER_SECRET as unconfigured, not as a value ([c713adc](https://github.com/bernoron/prompt-arena/commit/c713adc55ab758368a882893d7472f16b669ab1e))
* **ci:** copy .next/static into the standalone build before E2E tests ([2496ef2](https://github.com/bernoron/prompt-arena/commit/2496ef28ae9929f95ddcf7b3f6f602a5ff5aeab3))

## [8.2.2](https://github.com/bernoron/prompt-arena/compare/v8.2.1...v8.2.2) (2026-07-07)


### Bug Fixes

* **docker:** install prisma CLI standalone instead of hand-copying its deps ([#47](https://github.com/bernoron/prompt-arena/issues/47)) ([22d94b0](https://github.com/bernoron/prompt-arena/commit/22d94b095366e85d91ce08d0073065449d46a0cf))

## [8.2.1](https://github.com/bernoron/prompt-arena/compare/v8.2.0...v8.2.1) (2026-07-07)


### Performance Improvements

* server-render page data + tune SQLite/deploy to kill the client waterfall ([70f5990](https://github.com/bernoron/prompt-arena/commit/70f599063b42da40e291e4fd79a36dca3609ef10))

## [8.2.0](https://github.com/bernoron/prompt-arena/compare/v8.1.3...v8.2.0) (2026-07-07)


### Features

* **landing:** add public landing page with anonymized prompt showcase ([a984a99](https://github.com/bernoron/prompt-arena/commit/a984a9947a9156f458dbac3ef5cb9600f2fa5a47))


### Bug Fixes

* **hooks:** stop double-managing the e2e dev server in pre-push ([291db51](https://github.com/bernoron/prompt-arena/commit/291db511b6e9381237ff639811ddef6e1bbd5393))
* **test:** bypass authLimiter during local e2e runs to unblock pre-push ([7e2d7c9](https://github.com/bernoron/prompt-arena/commit/7e2d7c9cdbfb780044be1272982eab7ea0dd1517))

## [8.1.3](https://github.com/bernoron/prompt-arena/compare/v8.1.2...v8.1.3) (2026-07-06)


### Bug Fixes

* **docker:** remove redundant prisma generate that broke the real build ([9c0b21b](https://github.com/bernoron/prompt-arena/commit/9c0b21ba4accfcfb432dd6333215f23d48d7922d))

## [8.1.2](https://github.com/bernoron/prompt-arena/compare/v8.1.1...v8.1.2) (2026-07-06)


### Bug Fixes

* **ci:** fix DATABASE_URL path resolution for Prisma 7 + standalone server ([3db846d](https://github.com/bernoron/prompt-arena/commit/3db846de05d5c96eb077fe454f737c66f90212a9))
* **ci:** remove redundant Generate Prisma client steps ([746d67f](https://github.com/bernoron/prompt-arena/commit/746d67fe78d8f14e52042e695f583d2e2ebc165c))
* **ci:** set DATABASE_URL for npm ci so Prisma 7's postinstall works ([dc568b2](https://github.com/bernoron/prompt-arena/commit/dc568b2074544f8389e544bda9094957db3d87b7))

## [8.1.1](https://github.com/bernoron/prompt-arena/compare/v8.1.0...v8.1.1) (2026-07-04)


### Bug Fixes

* **docker:** copy lib/ into runtime image so prisma/seed.ts can run ([e2eb6fa](https://github.com/bernoron/prompt-arena/commit/e2eb6fac3d6b2a207101b60deacb73251f62809d))
* **docker:** resolve three pre-existing build failures blocking deploy ([abb61b6](https://github.com/bernoron/prompt-arena/commit/abb61b69c9a64b7696d3e4eb3da3f52649b284ec))
* **mobile:** make admin panel responsive and prevent horizontal overflow ([5f7c044](https://github.com/bernoron/prompt-arena/commit/5f7c044fd1f25ee66a427b1a5be28ce8a700a45b))

## [8.1.0](https://github.com/bernoron/prompt-arena/compare/v8.0.0...v8.1.0) (2026-07-03)


### Features

* add PointsLedger to close a vote-award race condition ([b46a571](https://github.com/bernoron/prompt-arena/commit/b46a571478843e477b1431ca21ff91f08c0cfa0d))
* add SEO-indexable prompt detail pages ([e5a159d](https://github.com/bernoron/prompt-arena/commit/e5a159d18bf15aa61181eb1f490315e9e7819c40))


### Bug Fixes

* **security:** upgrade Next 14→16, nonce-based CSP, harden admin sess… ([8745ef6](https://github.com/bernoron/prompt-arena/commit/8745ef6ca2e5e1f06e1fea40eb6b08a816fa2dfc))
* **security:** upgrade Next 14→16, nonce-based CSP, harden admin sessions ([82c4cf3](https://github.com/bernoron/prompt-arena/commit/82c4cf341c2c4a06d7bc08c5e59e5f5ecd8cdb88))

## [8.0.0](https://github.com/bernoron/prompt-arena/compare/v7.1.1...v8.0.0) (2026-07-02)


### ⚠ BREAKING CHANGES

* API responses for users and prompt authors no longer include a `department` field.

### Features

* reposition PromptArena as a public platform, drop department field ([3fb875d](https://github.com/bernoron/prompt-arena/commit/3fb875d93331fc44163a55449acd5702dea3f396))

## [7.1.1](https://github.com/bernoron/prompt-arena/compare/v7.1.0...v7.1.1) (2026-07-02)


### Bug Fixes

* harden user and admin security boundaries ([18702e9](https://github.com/bernoron/prompt-arena/commit/18702e98977be2d421160f41f2a51247de54aac8))
* harden user and admin security boundaries ([7497ccf](https://github.com/bernoron/prompt-arena/commit/7497ccf1b4e2e4a1d577ddd2ea5e95a7a4be00f1))
* harden user and admin security boundaries ([87ae6d7](https://github.com/bernoron/prompt-arena/commit/87ae6d798d8643391321847b4fb66c11a2c59e5a))
* **security:** harden app for public internet exposure (audit 2026-07) ([b47aeaa](https://github.com/bernoron/prompt-arena/commit/b47aeaafcbf3cab91b031dd27f5c98223d4c0721))

## [7.1.0](https://github.com/bernoron/prompt-arena/compare/v7.0.0...v7.1.0) (2026-06-28)


### Features

* **seed+admin:** system user prompts, hidden admin URL, remove admin nav link ([a35a5ce](https://github.com/bernoron/prompt-arena/commit/a35a5ce7ade49c289f151e0aa375c664c47f893e))


### Bug Fixes

* **ci:** bypass rate limiter in CI (GitHub Actions sets CI=true) ([47d2127](https://github.com/bernoron/prompt-arena/commit/47d2127e2b5751af0a189ec79075826415e8b47e))
* **ci:** ESLint errors + add EMAIL_SECRET to E2E CI job ([bb22963](https://github.com/bernoron/prompt-arena/commit/bb22963ad0d5a94acdfbfdae237cf4545ad41999))

## [7.0.0](https://github.com/bernoron/prompt-arena/compare/v6.0.0...v7.0.0) (2026-06-28)


### ⚠ BREAKING CHANGES

* login identifier changed from username to email address. Includes Feature 12 (AES-256-GCM encrypted email at rest), security hardening (HSTS, auth rate-limiting, XSS validation), and user feedback system (Feature 11). All existing username-only accounts cannot log in and must re-register with an email address.

### Features

* **auth:** email-based login — alias replaces username as display name ([3882fc8](https://github.com/bernoron/prompt-arena/commit/3882fc8b7728f622ccec6204002e237e64cde93c))
* **auth:** Feature 12 — encrypted email at registration ([21a9dad](https://github.com/bernoron/prompt-arena/commit/21a9dad65eedfd2d8384c84e9493bfdb8606b128))
* **auth:** username+password login, self-registration, middleware route guard ([bc031b6](https://github.com/bernoron/prompt-arena/commit/bc031b625629d05e2355327a5a720f1af19efb75))
* **feedback:** add user feedback system (Feature 11) ([9c60528](https://github.com/bernoron/prompt-arena/commit/9c6052808cde7be083d9b88405c33f4e6262aace))
* **mobile:** mobile-first refactoring across all user pages ([da5e173](https://github.com/bernoron/prompt-arena/commit/da5e17307d6bac7d05ee9a58cc2ef770c004096b))


### Bug Fixes

* **auth:** apply hook improvements + restore spec annotation ([8f082df](https://github.com/bernoron/prompt-arena/commit/8f082df6eb99f527fd75d00aef9c31b968ea7c61))
* **auth:** defence-in-depth hardening + spec annotation ([c3afb98](https://github.com/bernoron/prompt-arena/commit/c3afb98b266fe62ed0389d0929427a653a732d9f))
* **ci:** bypass rate limiter in CI (GitHub Actions sets CI=true) ([47d2127](https://github.com/bernoron/prompt-arena/commit/47d2127e2b5751af0a189ec79075826415e8b47e))
* **ci:** ESLint errors + add EMAIL_SECRET to E2E CI job ([bb22963](https://github.com/bernoron/prompt-arena/commit/bb22963ad0d5a94acdfbfdae237cf4545ad41999))
* **crypto:** correct AES-GCM IV to 12 bytes + fix USER_COOKIE import ([ea8f0e3](https://github.com/bernoron/prompt-arena/commit/ea8f0e3d1a47a567308c162fc0f9b79e982ccf85))
* **security:** code review ultra — critical & high findings ([792026a](https://github.com/bernoron/prompt-arena/commit/792026a1b60e7ec836a1e3b73ffde679ac7a4861))
* **security:** internet-exposure hardening ([0d5ab95](https://github.com/bernoron/prompt-arena/commit/0d5ab956f4f2625ae59f1d2203ad7ed8548da2c6))


### Miscellaneous Chores

* release v7.0.0 ([8b26cc8](https://github.com/bernoron/prompt-arena/commit/8b26cc83de4702575f256cd1e2bcdb74e7228a24))

## [6.0.0](https://github.com/bernoron/prompt-arena/compare/v5.4.0...v6.0.0) (2026-06-28)


### ⚠ BREAKING CHANGES

* login identifier changed from username to email address. Includes Feature 12 (AES-256-GCM encrypted email at rest), security hardening (HSTS, auth rate-limiting, XSS validation), and user feedback system (Feature 11). All existing username-only accounts cannot log in and must re-register with an email address.

### Features

* **auth:** email-based login — alias replaces username as display name ([3882fc8](https://github.com/bernoron/prompt-arena/commit/3882fc8b7728f622ccec6204002e237e64cde93c))
* **auth:** Feature 12 — encrypted email at registration ([21a9dad](https://github.com/bernoron/prompt-arena/commit/21a9dad65eedfd2d8384c84e9493bfdb8606b128))
* **auth:** username+password login, self-registration, middleware route guard ([bc031b6](https://github.com/bernoron/prompt-arena/commit/bc031b625629d05e2355327a5a720f1af19efb75))
* **mobile:** mobile-first refactoring across all user pages ([da5e173](https://github.com/bernoron/prompt-arena/commit/da5e17307d6bac7d05ee9a58cc2ef770c004096b))


### Bug Fixes

* **auth:** apply hook improvements + restore spec annotation ([8f082df](https://github.com/bernoron/prompt-arena/commit/8f082df6eb99f527fd75d00aef9c31b968ea7c61))
* **auth:** defence-in-depth hardening + spec annotation ([c3afb98](https://github.com/bernoron/prompt-arena/commit/c3afb98b266fe62ed0389d0929427a653a732d9f))
* **crypto:** correct AES-GCM IV to 12 bytes + fix USER_COOKIE import ([ea8f0e3](https://github.com/bernoron/prompt-arena/commit/ea8f0e3d1a47a567308c162fc0f9b79e982ccf85))
* **security:** code review ultra — critical & high findings ([792026a](https://github.com/bernoron/prompt-arena/commit/792026a1b60e7ec836a1e3b73ffde679ac7a4861))
* **security:** internet-exposure hardening ([0d5ab95](https://github.com/bernoron/prompt-arena/commit/0d5ab956f4f2625ae59f1d2203ad7ed8548da2c6))


### Miscellaneous Chores

* release v7.0.0 ([8b26cc8](https://github.com/bernoron/prompt-arena/commit/8b26cc83de4702575f256cd1e2bcdb74e7228a24))

## [5.4.0](https://github.com/bernoron/prompt-arena/compare/v5.3.1...v5.4.0) (2026-06-28)


### Features

* **feedback:** add user feedback system (Feature 11) ([9c60528](https://github.com/bernoron/prompt-arena/commit/9c6052808cde7be083d9b88405c33f4e6262aace))

## [5.3.1](https://github.com/bernoron/prompt-arena/compare/v5.3.0...v5.3.1) (2026-06-28)


### Bug Fixes

* security leak-audit hardening and WAL pragma fix ([25d0f5e](https://github.com/bernoron/prompt-arena/commit/25d0f5e47d58f4c7f0db3f0afa658d0f5a60fe91))

## [5.3.0](https://github.com/bernoron/prompt-arena/compare/v5.2.0...v5.3.0) (2026-06-27)


### Features

* close spec/implementation gaps and harden review findings ([0832ed3](https://github.com/bernoron/prompt-arena/commit/0832ed3ced59c74d7a649a94a59b5aadf353c4ec))
* production hardening and deployment setup for go-live ([a781c9b](https://github.com/bernoron/prompt-arena/commit/a781c9b201e757c0d9a150738704f8420f8c93e4))


### Bug Fixes

* security leak-audit hardening and WAL pragma fix ([25d0f5e](https://github.com/bernoron/prompt-arena/commit/25d0f5e47d58f4c7f0db3f0afa658d0f5a60fe91))

## [5.2.0](https://github.com/bernoron/prompt-arena/compare/v5.1.1...v5.2.0) (2026-06-27)


### Features

* harden and complete review findings (security, UX, perf, quality) ([7ad063f](https://github.com/bernoron/prompt-arena/commit/7ad063fd3b3aa43ed3d75a2937cf763834584ac6))


### Bug Fixes

* extract items array from API response in dashboard ([e3307a1](https://github.com/bernoron/prompt-arena/commit/e3307a1240f9a8aad16130eccbbd7635d3a2a777))
* remove debug logs from library page and API ([16eefea](https://github.com/bernoron/prompt-arena/commit/16eefea25a57e7a46e8ae7735251d350b4edccf3))

## [5.1.1](https://github.com/bernoron/prompt-arena/compare/v5.1.0...v5.1.1) (2026-06-27)


### Bug Fixes

* align ci auth test environment ([94fc37f](https://github.com/bernoron/prompt-arena/commit/94fc37f8a5a11b7ac1e1c2944f43d9e49693aad8))
* harden prompt arena review findings ([98c6ac7](https://github.com/bernoron/prompt-arena/commit/98c6ac791dc8ed4ef73fef832b85e0290139af3a))

## [5.1.0](https://github.com/bernoron/prompt-arena/compare/v5.0.0...v5.1.0) (2026-06-27)


### Features

* automate releases and simplify spec contract tests ([91c40e9](https://github.com/bernoron/prompt-arena/commit/91c40e91fd93f129d40eff66ea956481a9fe970e))
