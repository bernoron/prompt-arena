-- CreateTable
CREATE TABLE "LearningModule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 15,
    CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningModule_slug_key" ON "LearningModule"("slug");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");
