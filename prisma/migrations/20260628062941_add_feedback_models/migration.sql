-- CreateTable
CREATE TABLE "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "contextType" TEXT NOT NULL DEFAULT 'GENERAL',
    "contextId" INTEGER,
    "contextPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopicSuggestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prompt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prompt_category_fkey" FOREIGN KEY ("category") REFERENCES "PromptCategory" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("authorId", "category", "content", "contentEn", "createdAt", "difficulty", "id", "title", "titleEn", "usageCount") SELECT "authorId", "category", "content", "contentEn", "createdAt", "difficulty", "id", "title", "titleEn", "usageCount" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE INDEX "Prompt_authorId_idx" ON "Prompt"("authorId");
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");
CREATE INDEX "Prompt_usageCount_idx" ON "Prompt"("usageCount");
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_contextType_idx" ON "Feedback"("contextType");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "LessonFeedback_lessonId_idx" ON "LessonFeedback"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonFeedback_userId_lessonId_key" ON "LessonFeedback"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "TopicSuggestion_userId_idx" ON "TopicSuggestion"("userId");

-- CreateIndex
CREATE INDEX "TopicSuggestion_status_idx" ON "TopicSuggestion"("status");
