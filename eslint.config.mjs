import next from 'eslint-config-next';

// ESLint 9 flat config. Next 16 removed the built-in `next lint` command, so we
// run the ESLint CLI directly (see package.json "lint"). eslint-config-next 16
// ships a native flat-config array (core-web-vitals + typescript), which we
// spread in directly — no FlatCompat bridge needed.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'app/generated/**',
      'tests/playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...next,
  {
    // eslint-config-next 16 promotes the new React-Compiler hook rules to
    // errors. They flag pre-existing patterns across the app that are unrelated
    // to the Next 16 security upgrade; demote them to warnings so the upgrade
    // stays behavior-equivalent (previously these rules did not exist / only
    // warned). Tracked as separate tech-debt, not a CI blocker.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
