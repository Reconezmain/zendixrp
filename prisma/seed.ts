import { ApplicationStatus, PrismaClient, StaffGroup, UserRole } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseOfficialRules } from './rules-parser';

const prisma = new PrismaClient();

async function shouldSeedInitialContent() {
  const key = 'initial-content-seeded';
  const completed = await prisma.systemSetting.findUnique({ where: { key } });
  if (completed) return false;

  const counts = await Promise.all([
    prisma.post.count(),
    prisma.application.count(),
    prisma.staffMember.count(),
    prisma.applicationType.count(),
    prisma.ruleCategory.count(),
    prisma.mapLocation.count(),
    prisma.changelogEntry.count(),
  ]);
  return counts.every((count) => count === 0);
}

async function main() {
  // SQLite may backfill a newly added JSON column as an empty string during
  // db push. Normalize existing application types before Prisma parses them.
  await prisma.$executeRawUnsafe(
    `UPDATE ApplicationType SET reviewerRoleIds = '[]' WHERE reviewerRoleIds IS NULL OR reviewerRoleIds = ''`,
  );
  const seedInitialContent = await shouldSeedInitialContent();
  const seedDemoData = process.env.SEED_DEMO_DATA === 'true';
  const admin = seedInitialContent && seedDemoData ? await prisma.user.upsert({
    where: { discordId: 'seed-admin' },
    update: {},
    create: { discordId: 'seed-admin', username: 'Zendix Ledelsen', role: UserRole.ADMIN },
  }) : null;

  const posts = [
    {
      title: 'Velkommen til den nye ZendixRP-platform',
      slug: 'velkommen-til-zendixrp',
      category: 'Nyhed',
      excerpt: 'Et nyt samlingspunkt for ansøgninger, servernyt og alt fra ZendixRP.',
      content: 'Vi har samlet hele ZendixRP-oplevelsen ét sted. Her kan du følge de seneste opdateringer, søge whitelist og holde øje med din ansøgning. Vi glæder os til at skabe historier sammen med jer.',
    },
    {
      title: 'Whitelist åbner for nye karakterer',
      slug: 'whitelist-aabner',
      category: 'Community',
      excerpt: 'Har du en karakteridé, der kan skabe godt rollespil? Nu er tiden inde.',
      content: 'Whitelist er åben. Vi leder efter gennemtænkte karakterer, som både kan drive egne historier og give plads til andres. Læs reglerne, gør din karakter levende og send din ansøgning.',
    },
    {
      title: 'Økonomi 2.0 og nye civile jobs',
      slug: 'oekonomi-2-0',
      category: 'Opdatering',
      excerpt: 'En mere balanceret økonomi og flere måder at bygge et liv i byen på.',
      content: 'Vi har justeret priser, lønninger og progression på tværs af serveren. Samtidig introducerer vi nye civile jobs med mere interaktion og tydeligere karriereveje.',
    },
  ];

  if (seedInitialContent && seedDemoData && admin) {
    for (const post of posts) {
      await prisma.post.create({ data: { ...post, authorId: admin.id } });
    }
  }

  if (seedInitialContent && seedDemoData && admin) {
    await prisma.changelogEntry.createMany({ data: [
      { version: '1.2.0', title: 'Live kort og dynamiske ansøgninger', summary: 'En stor community-opdatering med flere værktøjer til både spillere og staff.', changes: ['Nyt interaktivt GTA-kort med atlas og satellit', 'Staff kan oprette jobansøgninger med egne spørgsmål', 'Discord-roller synkroniseres automatisk ved login', 'Staff-teamet er opdelt i tydelige kategorier'], authorId: admin.id, createdAt: new Date('2026-06-22T10:00:00Z') },
      { version: '1.1.0', title: 'Den nye ZendixRP-platform', summary: 'Første udgave af vores nye samlingspunkt for hele communityet.', changes: ['Discord OAuth og personligt dashboard', 'Nyheder og opslag', 'Whitelist- og jobansøgninger', 'Live serverstatus'], authorId: admin.id, createdAt: new Date('2026-06-20T10:00:00Z') },
    ] });
  }

  if (seedInitialContent) {
    const ruleCategories = parseOfficialRules(await readFile(join(process.cwd(), 'prisma', 'official-rules.txt'), 'utf8'));
    for (const category of ruleCategories) {
      await prisma.ruleCategory.create({ data: { name: category.name, slug: category.slug, description: category.description, sortOrder: category.sortOrder, active: category.active, rules: { create: category.rules } } });
    }
  }

  const staff = [
    { name: 'Noah', rank: 'Server Owner', group: StaffGroup.OWNER, discordTag: 'noah.zdx', description: 'Holder retningen, samler teamet og passer på ZendixRP-visionen.', sortOrder: 1 },
    { name: 'Freja', rank: 'Community Manager', group: StaffGroup.MANAGEMENT, discordTag: 'freja.rp', description: 'Binder community og staff sammen — altid klar på feedback og gode idéer.', sortOrder: 2 },
    { name: 'Malthe', rank: 'Head Administrator', group: StaffGroup.ADMINISTRATOR, discordTag: 'malthe.admin', description: 'Sikrer fair sagsbehandling og hjælper teamet med de svære beslutninger.', sortOrder: 3 },
    { name: 'Alma', rank: 'Developer', group: StaffGroup.DEVELOPER, discordTag: 'alma.dev', description: 'Bygger de systemer og små detaljer, der gør byen levende.', sortOrder: 4 },
  ];

  if (seedInitialContent && seedDemoData) {
    await prisma.staffMember.createMany({ data: staff });
  }

  const applicationTypes = [
    {
      name: 'Whitelist', slug: 'whitelist', category: 'Adgang', sortOrder: 1,
      description: 'Din adgang til byen og de første historier.',
      questions: [
        { id: 'characterName', label: 'Karakterens navn', type: 'text', required: true, minLength: 2 },
        { id: 'age', label: 'Din alder', type: 'text', required: true, minLength: 2 },
        { id: 'experience', label: 'Din RP-erfaring', type: 'textarea', required: true, minLength: 30 },
        { id: 'motivation', label: 'Hvorfor vil du spille på ZendixRP?', type: 'textarea', required: true, minLength: 60 },
        { id: 'scenario', label: 'Beskriv et RP-scenarie hvor din plan går skævt', type: 'textarea', required: true, minLength: 60 },
      ],
    },
    {
      name: 'Politi', slug: 'politi', category: 'Job', sortOrder: 2,
      description: 'Skab tryghed, konflikter og stærkt myndigheds-RP.',
      questions: [
        { id: 'characterName', label: 'Karakterens navn', type: 'text', required: true, minLength: 2 },
        { id: 'experience', label: 'Relevant RP-erfaring', type: 'textarea', required: true, minLength: 30 },
        { id: 'motivation', label: 'Hvorfor søger du politiet?', type: 'textarea', required: true, minLength: 60 },
        { id: 'scenario', label: 'Hvordan håndterer du en ophedet trafikstop-scene?', type: 'textarea', required: true, minLength: 60 },
      ],
    },
    {
      name: 'EMS', slug: 'ems', category: 'Job', sortOrder: 3,
      description: 'Vær byens rolige hånd, når det hele brænder på.',
      questions: [
        { id: 'characterName', label: 'Karakterens navn', type: 'text', required: true, minLength: 2 },
        { id: 'experience', label: 'Relevant RP-erfaring', type: 'textarea', required: true, minLength: 30 },
        { id: 'motivation', label: 'Hvorfor søger du EMS?', type: 'textarea', required: true, minLength: 60 },
        { id: 'scenario', label: 'Hvordan skaber du RP omkring en alvorligt såret spiller?', type: 'textarea', required: true, minLength: 60 },
      ],
    },
    {
      name: 'Staff', slug: 'staff', category: 'Team', sortOrder: 4,
      description: 'Bliv en del af holdet bag communityet.',
      questions: [
        { id: 'age', label: 'Din alder', type: 'text', required: true, minLength: 2 },
        { id: 'experience', label: 'Tidligere erfaring med communities eller staff', type: 'textarea', required: true, minLength: 40 },
        { id: 'motivation', label: 'Hvorfor vil du være staff?', type: 'textarea', required: true, minLength: 80 },
        { id: 'scenario', label: 'Hvordan håndterer du en konflikt mellem to spillere?', type: 'textarea', required: true, minLength: 80 },
      ],
    },
  ];

  if (seedInitialContent) {
    for (const type of applicationTypes) {
      await prisma.applicationType.create({ data: type });
    }
  }

  if (seedInitialContent && seedDemoData) {
    await prisma.mapLocation.createMany({ data: [
      { title: 'Mission Row Police Department', description: 'Politiets hovedstation og offentlig reception.', category: 'Myndighed', icon: 'shield', color: '#4dabf7', x: 441.2, y: -981.9, sortOrder: 1 },
      { title: 'Pillbox Medical Center', description: 'Akutmodtagelse, behandling og EMS-hovedkvarter.', category: 'Sundhed', icon: 'medical', color: '#ff6b6b', x: 306.7, y: -595.1, sortOrder: 2 },
      { title: 'Legion Square', description: 'Centralt mødested midt i Los Santos.', category: 'Mødested', icon: 'star', color: '#2fdf82', x: 215.8, y: -920.4, sortOrder: 3 },
      { title: 'Benny’s Motorworks', description: 'Værksted, tuning og mekaniker-RP.', category: 'Virksomhed', icon: 'wrench', color: '#fcc419', x: -205.6, y: -1312.8, sortOrder: 4 },
    ] });
  }

  if (seedInitialContent && seedDemoData) {
    const demo = await prisma.user.create({
      data: { discordId: 'seed-user', username: 'Demo Borger' },
    });
    await prisma.application.create({
      data: {
        userId: demo.id,
        type: 'Whitelist',
        status: ApplicationStatus.IN_REVIEW,
        answers: { characterName: 'Oliver Storm', age: '24', motivation: 'Jeg vil skabe langsigtede historier med andre spillere.' },
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: 'initial-content-seeded' },
    update: {},
    create: { key: 'initial-content-seeded', value: new Date().toISOString() },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
