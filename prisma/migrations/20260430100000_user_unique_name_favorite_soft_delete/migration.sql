-- Migration: user_unique_name_favorite_soft_delete
-- 1. Unique constraint on User.name to prevent duplicate usernames
-- 2. Soft-delete support for Favorite (isActive flag)
-- 3. Points idempotency for Favorite (pointsAwarded flag)

-- Add isActive column (soft-delete flag, default true = active)
ALTER TABLE "Favorite" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add pointsAwarded column (prevents re-awarding points on re-favorite)
ALTER TABLE "Favorite" ADD COLUMN "pointsAwarded" BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient lookup of active favorites per user
CREATE INDEX "Favorite_userId_isActive_idx" ON "Favorite"("userId", "isActive");

-- Unique constraint on User.name
-- Note: existing duplicates will cause this to fail; deduplicate first if needed
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
