# Changelog

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
