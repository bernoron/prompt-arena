// Prisma 7 moved the connection URL for the CLI (migrate, studio, db push)
// out of schema.prisma and into this file. The runtime PrismaClient gets its
// own connection separately via a driver adapter (see lib/prisma.ts).
//
// The Next.js dev/build process loads .env on its own, but the Prisma CLI
// runs standalone and needs it populated itself. Node's built-in
// loadEnvFile (no extra dependency, unlike the dotenv package that Prisma's
// own docs example uses) covers local dev; in Docker/CI there's no .env
// file at all and the platform already sets these vars directly, so a
// missing file here is expected and safely ignored.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file — running in Docker/CI where env vars are set directly.
}

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
