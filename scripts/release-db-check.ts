import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const [rules, activeTypes, seedUsers, typesWithoutReviewers] = await Promise.all([
      prisma.rule.count({ where: { active: true, category: { active: true } } }),
      prisma.applicationType.count({ where: { active: true } }),
      prisma.user.count({ where: { discordId: { startsWith: 'seed-' } } }),
      prisma.applicationType.findMany({ where: { active: true }, select: { name: true, reviewerRoleIds: true } }),
    ]);
    if (!rules) errors.push('Databasen indeholder ingen aktive regler');
    if (!activeTypes) errors.push('Databasen indeholder ingen åbne ansøgningstyper');
    if (seedUsers) errors.push(`Databasen indeholder ${seedUsers} demo-bruger(e)`);
    const unassigned = typesWithoutReviewers.filter((type) => !Array.isArray(type.reviewerRoleIds) || !type.reviewerRoleIds.length).map((type) => type.name);
    if (unassigned.length) warnings.push(`Kun ADMIN kan behandle disse typer, indtil reviewer-roller tilføjes: ${unassigned.join(', ')}`);
  } catch {
    errors.push('Databasen kan ikke tilgås eller matcher ikke Prisma-schemaet');
  } finally {
    await prisma.$disconnect();
  }

  if (errors.length) {
    console.error('\nZendixRP database-check fejlede:\n');
    errors.forEach((error) => console.error(`  ✗ ${error}`));
    warnings.forEach((warning) => console.warn(`  ! ${warning}`));
    process.exit(1);
  }

  console.log('ZendixRP database-check: OK');
  warnings.forEach((warning) => console.warn(`  ! ${warning}`));
}

void main();
