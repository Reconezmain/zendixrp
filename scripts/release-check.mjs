const errors = [];
const warnings = [];

const value = (name) => (process.env[name] || '').trim();
const requireValue = (name) => {
  if (!value(name)) errors.push(`${name} mangler`);
};
const isDiscordId = (input) => /^\d{15,22}$/.test(input);
const ids = (name) => value(name).split(',').map((id) => id.trim()).filter(Boolean);

[
  'DATABASE_URL',
  'AUTH_SECRET',
  'MAP_SYNC_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'DISCORD_GUILD_ID',
  'NEXT_PUBLIC_DISCORD_INVITE',
  'NEXT_PUBLIC_SERVER_CONNECT',
  'CFX_SERVER_API_URL',
].forEach(requireValue);

for (const name of ['AUTH_SECRET', 'MAP_SYNC_SECRET']) {
  const secret = value(name);
  if (secret && (secret.length < 32 || /replace|secret|password/i.test(secret))) errors.push(`${name} skal være en unik hemmelighed på mindst 32 tegn`);
}

let appUrl;
try {
  appUrl = new URL(value('NEXT_PUBLIC_APP_URL'));
  if (appUrl.protocol !== 'https:') errors.push('NEXT_PUBLIC_APP_URL skal bruge HTTPS');
  if (['localhost', '127.0.0.1', '::1'].includes(appUrl.hostname)) errors.push('NEXT_PUBLIC_APP_URL må ikke pege på localhost');
  if (appUrl.pathname !== '/' || appUrl.search || appUrl.hash) errors.push('NEXT_PUBLIC_APP_URL må kun indeholde origin/domæne');
} catch {
  errors.push('NEXT_PUBLIC_APP_URL er ikke en gyldig URL');
}

try {
  const redirect = new URL(value('DISCORD_REDIRECT_URI'));
  if (appUrl && redirect.href !== new URL('/api/auth/callback/discord', appUrl).href) errors.push('DISCORD_REDIRECT_URI matcher ikke det offentlige domæne');
} catch {
  errors.push('DISCORD_REDIRECT_URI er ikke en gyldig URL');
}

for (const name of ['DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID']) {
  if (value(name) && !isDiscordId(value(name))) errors.push(`${name} ligner ikke et gyldigt Discord ID`);
}
for (const name of ['DISCORD_STAFF_ROLE_IDS', 'DISCORD_ADMIN_ROLE_IDS', 'ADMIN_DISCORD_IDS']) {
  if (ids(name).some((id) => !isDiscordId(id))) errors.push(`${name} indeholder et ugyldigt Discord ID`);
}
if (!ids('DISCORD_ADMIN_ROLE_IDS').length && !ids('ADMIN_DISCORD_IDS').length) errors.push('Konfigurér mindst én adminrolle eller nød-admin');
if (value('SEED_DEMO_DATA').toLowerCase() === 'true') errors.push('SEED_DEMO_DATA må ikke være true i produktion');
if (value('DATABASE_URL').startsWith('file:')) {
  warnings.push('SQLite er egnet til én serverinstans; tag automatiske backups af prisma/dev.db');
  if (process.cwd().toLowerCase().includes('onedrive')) errors.push('Flyt produktionsprojektet/databasen ud af OneDrive for at undgå SQLite sync- og låsefejl');
}

if (errors.length) {
  console.error('\nZendixRP release-check fejlede:\n');
  errors.forEach((error) => console.error(`  ✗ ${error}`));
  warnings.forEach((warning) => console.warn(`  ! ${warning}`));
  process.exit(1);
}

console.log('ZendixRP release-check: OK');
warnings.forEach((warning) => console.warn(`  ! ${warning}`));
