-- CreateIndex
CREATE INDEX "ChallengeSubmission_challengeId_idx" ON "ChallengeSubmission"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_userId_idx" ON "ChallengeSubmission"("userId");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_promptId_idx" ON "ChallengeSubmission"("promptId");

-- CreateIndex
CREATE INDEX "Prompt_authorId_idx" ON "Prompt"("authorId");

-- CreateIndex
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");

-- CreateIndex
CREATE INDEX "Prompt_usageCount_idx" ON "Prompt"("usageCount");

-- CreateIndex
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");

-- CreateIndex
CREATE INDEX "User_totalPoints_idx" ON "User"("totalPoints");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");
