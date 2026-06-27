-- Migration: add_prompt_category
-- Creates the PromptCategory table and seeds the 4 original hardcoded categories.
-- Existing Prompt.category values remain valid — the FK is optional (categoryRef).

CREATE TABLE "PromptCategory" (
    "id"    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug"  TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon"  TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX "PromptCategory_slug_key" ON "PromptCategory"("slug");
CREATE INDEX "PromptCategory_order_idx" ON "PromptCategory"("order");

-- Seed original categories
INSERT INTO "PromptCategory" ("slug", "label", "icon", "color", "order") VALUES
  ('Writing',  'Writing',  '✍️', 'teal',   1),
  ('Email',    'Email',    '📧', 'indigo', 2),
  ('Analysis', 'Analysis', '📊', 'orange', 3),
  ('Excel',    'Excel',    '📈', 'green',  4);
