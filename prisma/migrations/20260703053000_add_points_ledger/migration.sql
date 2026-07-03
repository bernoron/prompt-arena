-- Migration: add_points_ledger
-- Additive-only: new table for idempotent one-time point awards (vote,
-- favorite, lesson completion). No existing tables are touched.

CREATE TABLE "PointsLedger" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId"    INTEGER NOT NULL,
    "action"    TEXT NOT NULL,
    "refId"     INTEGER NOT NULL,
    "delta"     INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointsLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PointsLedger_userId_action_refId_key" ON "PointsLedger"("userId", "action", "refId");
CREATE INDEX "PointsLedger_userId_idx" ON "PointsLedger"("userId");
