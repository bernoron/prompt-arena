-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT '',
    "avatarColor" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailHash" TEXT,
    "emailEncrypted" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Prompt-Lehrling',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarColor", "createdAt", "department", "id", "level", "name", "passwordHash", "totalPoints") SELECT "avatarColor", "createdAt", "department", "id", "level", "name", "passwordHash", "totalPoints" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
CREATE INDEX "User_totalPoints_idx" ON "User"("totalPoints");
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
