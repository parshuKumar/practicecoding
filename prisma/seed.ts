/**
 * Seeds content from data/sheet.json (DSA) and data/system-design.json (System Design).
 * Idempotent — safe to re-run on every deploy.
 *
 * Never deletes: removing a Problem or SdArticle row would orphan (or cascade away) real
 * progress. Never renumbers: Problem.id is the legacy localStorage index, SdArticle.id is
 * the curriculum number.
 *
 *   npm run db:seed
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sheet } from '../tools/extract-sheet';
import type { SystemDesignData } from '../src/lib/system-design-data';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prisma = new PrismaClient();

async function seedDsa() {
  const sheet: Sheet = JSON.parse(readFileSync(resolve(root, 'data/sheet.json'), 'utf8'));

  if (sheet.problems.length !== 353) {
    throw new Error(`refusing to seed: expected 353 problems, data/sheet.json has ${sheet.problems.length}`);
  }

  for (const phase of sheet.phases) {
    await prisma.phase.upsert({ where: { id: phase.id }, create: phase, update: phase });
  }

  for (const pattern of sheet.patterns) {
    await prisma.pattern.upsert({ where: { id: pattern.id }, create: pattern, update: pattern });
  }

  // Chunked so a cold Neon connection isn't hit with 353 sequential round trips.
  const CHUNK = 25;
  for (let i = 0; i < sheet.problems.length; i += CHUNK) {
    await prisma.$transaction(
      sheet.problems.slice(i, i + CHUNK).map((problem) =>
        prisma.problem.upsert({ where: { id: problem.id }, create: problem, update: problem }),
      ),
    );
  }

  const [phases, patterns, problems] = await Promise.all([
    prisma.phase.count(),
    prisma.pattern.count(),
    prisma.problem.count(),
  ]);

  console.log(`✔ seeded — ${phases} phases · ${patterns} patterns · ${problems} problems`);

  if (problems !== 353) {
    throw new Error(`expected 353 problems in the database, found ${problems}`);
  }
}

async function seedSystemDesign() {
  const data: SystemDesignData = JSON.parse(
    readFileSync(resolve(root, 'data/system-design.json'), 'utf8'),
  );

  if (data.articles.length !== 140) {
    throw new Error(
      `refusing to seed: expected 140 articles, data/system-design.json has ${data.articles.length}`,
    );
  }

  for (const part of data.parts) {
    await prisma.sdPart.upsert({ where: { id: part.id }, create: part, update: part });
  }

  for (const group of data.groups) {
    await prisma.sdGroup.upsert({ where: { id: group.id }, create: group, update: group });
  }

  const CHUNK = 25;
  for (let i = 0; i < data.articles.length; i += CHUNK) {
    await prisma.$transaction(
      data.articles.slice(i, i + CHUNK).map((article) => {
        const row = { ...article, links: article.links as unknown as Prisma.InputJsonValue };
        return prisma.sdArticle.upsert({ where: { id: article.id }, create: row, update: row });
      }),
    );
  }

  const [parts, groups, articles] = await Promise.all([
    prisma.sdPart.count(),
    prisma.sdGroup.count(),
    prisma.sdArticle.count(),
  ]);

  console.log(`✔ seeded — ${parts} parts · ${groups} groups · ${articles} articles`);

  if (articles !== 140) {
    throw new Error(`expected 140 articles in the database, found ${articles}`);
  }
}

async function main() {
  await seedDsa();
  await seedSystemDesign();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
