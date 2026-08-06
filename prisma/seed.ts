/**
 * Seeds sheet content from data/sheet.json. Idempotent — safe to re-run on every deploy.
 *
 * Never deletes: removing a Problem row would orphan (or cascade away) real progress.
 * Never renumbers: Problem.id is the legacy localStorage index.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sheet } from '../tools/extract-sheet';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prisma = new PrismaClient();

async function main() {
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

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
