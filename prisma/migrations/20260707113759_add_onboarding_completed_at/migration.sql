-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" DATETIME;

-- Backfill: existing accounts are considered "done" immediately so the
-- onboarding funnel only ever triggers for accounts created after this
-- migration (BAC-14-006 / AC-14-001).
UPDATE "User" SET "onboardingCompletedAt" = "createdAt" WHERE "onboardingCompletedAt" IS NULL;
