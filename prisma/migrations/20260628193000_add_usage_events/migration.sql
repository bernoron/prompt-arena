-- Persist one usage event per user/prompt pair so "used this prompt" cannot
-- be spammed for unlimited usageCount increments and author points.
CREATE TABLE "UsageEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promptId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageEvent_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UsageEvent_promptId_userId_key" ON "UsageEvent"("promptId", "userId");
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");
