/**
 * Non-destructive content refresh for the learning path.
 *
 * Unlike `prisma/seed.ts` (which wipes and recreates every table), this script
 * only upserts `LearningModule` / `Lesson` rows by their stable `slug` — it
 * never deletes anything and never touches `User`, `Prompt`, `LessonProgress`
 * or any other table. Existing users keep their accounts and their lesson
 * progress even if a lesson's text changes underneath them.
 *
 * Safe to run against production: `npx tsx scripts/update-learning-content.ts`
 * (or `npm run db:update-learning-content`). See DEPLOYMENT.md, section 4.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { learningModules } from '../prisma/learning-content';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Aktualisiere Lerninhalte (nicht-destruktiv)…');

  let modulesCreated = 0;
  let modulesUpdated = 0;
  let lessonsCreated = 0;
  let lessonsUpdated = 0;

  const knownModuleSlugs = new Set(learningModules.map((m) => m.slug));
  const existingModules = await prisma.learningModule.findMany({ select: { slug: true } });
  const orphanedModuleSlugs = existingModules
    .map((m) => m.slug)
    .filter((slug) => !knownModuleSlugs.has(slug));

  for (const mod of learningModules) {
    const existingModule = await prisma.learningModule.findUnique({ where: { slug: mod.slug } });

    const dbModule = await prisma.learningModule.upsert({
      where: { slug: mod.slug },
      update: { title: mod.title, description: mod.description, icon: mod.icon, order: mod.order },
      create: { slug: mod.slug, title: mod.title, description: mod.description, icon: mod.icon, order: mod.order },
    });
    if (existingModule) modulesUpdated++; else modulesCreated++;

    const knownLessonSlugs = new Set(mod.lessons.map((l) => l.slug));
    const existingLessons = await prisma.lesson.findMany({ where: { moduleId: dbModule.id }, select: { slug: true } });
    const orphanedLessonSlugs = existingLessons
      .map((l) => l.slug)
      .filter((slug) => !knownLessonSlugs.has(slug));

    for (const lesson of mod.lessons) {
      const existingLesson = await prisma.lesson.findUnique({
        where: { moduleId_slug: { moduleId: dbModule.id, slug: lesson.slug } },
      });

      await prisma.lesson.upsert({
        where: { moduleId_slug: { moduleId: dbModule.id, slug: lesson.slug } },
        update: { title: lesson.title, content: lesson.content, order: lesson.order, points: lesson.points },
        create: {
          moduleId: dbModule.id,
          slug: lesson.slug,
          title: lesson.title,
          content: lesson.content,
          order: lesson.order,
          points: lesson.points,
        },
      });
      if (existingLesson) lessonsUpdated++; else lessonsCreated++;
    }

    if (orphanedLessonSlugs.length > 0) {
      console.warn(`   ⚠️  Modul "${mod.slug}": Lektionen in der DB, die nicht mehr im Content vorkommen (nicht gelöscht): ${orphanedLessonSlugs.join(', ')}`);
    }

    console.log(`   📖 Modul "${dbModule.title}" (${mod.lessons.length} Lektionen)`);
  }

  if (orphanedModuleSlugs.length > 0) {
    console.warn(`   ⚠️  Module in der DB, die nicht mehr im Content vorkommen (nicht gelöscht): ${orphanedModuleSlugs.join(', ')}`);
  }

  console.log('✅ Lerninhalte aktualisiert!');
  console.log(`   🧠 Module: ${modulesCreated} neu, ${modulesUpdated} aktualisiert`);
  console.log(`   📝 Lektionen: ${lessonsCreated} neu, ${lessonsUpdated} aktualisiert`);
  console.log('   👥 User, Prompts, Fortschritt und alle anderen Daten wurden nicht verändert.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
