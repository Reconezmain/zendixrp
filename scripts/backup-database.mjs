import { mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.startsWith('file:')) {
  console.error('db:backup understøtter projektets SQLite-drift. Brug databaseudbyderens backupværktøj til en ekstern database.');
  process.exit(1);
}

const backupDirectory = resolve('backups');
if (!backupDirectory.startsWith(resolve('.') + sep)) throw new Error('Ugyldig backupsti');
await mkdir(backupDirectory, { recursive: true });

const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destination = resolve(backupDirectory, `zendixrp-${timestamp}.sqlite`);
const escapedDestination = destination.replaceAll("'", "''").replaceAll('\\', '/');
const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedDestination}'`);
  console.log(`Databasebackup oprettet: ${destination}`);
} finally {
  await prisma.$disconnect();
}
