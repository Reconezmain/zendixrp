# ZendixRP

En komplet, responsiv community-platform til en dansk FiveM RP-server. Bygget med Next.js App Router, TypeScript, Mantine, Prisma og rigtig Discord OAuth.

## Funktioner

- Atmosfærisk forside med serverstatus, CTA'er, features, seneste opslag og onboarding
- Opslag med kategorier, detaljesider og admin-CRUD
- Live FiveM-status fra Cfx API med spillerantal, serverinfo og søgbar liste over aktive spillere
- Offentlig changelog med staff-CRUD, versioner og ændringspunkter
- Databasebaserede regelkategorier og regler, som staff kan oprette, redigere og slette
- Regelside, staff-side og Discord-community links
- Whitelist-, staff-, politi- og EMS-ansøgninger med validering
- Discord OAuth med sikre, HttpOnly database-sessioner
- Personligt dashboard, hvor brugeren kun kan se egne ansøgninger
- Rollebeskyttet admin-dashboard til opslag, ansøgninger og staff
- Dynamiske jobansøgninger, hvor staff selv opretter spørgsmål og åbner/lukker typer
- Staff opdelt i Ejer, Ledelse, Udvikling, Administratorer, Moderatorer og Support
- Interaktivt Leaflet GTA-kort med atlas/satellit, filtre og databasegemte GTA-koordinater
- FiveM map-sync API til automatisk opdatering af lokationer fra serverressourcer
- Statusflow: Sendt → Under behandling → Godkendt/Afvist
- Staff kan slette alle ansøgninger; brugere kan selv slette egne afsluttede ansøgninger
- Interne noter/begrundelser, filtre, modaler, bekræftelser og toast-notifikationer

## Lokal start

Krav: Node.js 20+ og npm.

```bash
npm install
copy .env.example .env
npm run setup
npm run dev
```

Åbn derefter [http://localhost:3000](http://localhost:3000).

`npm run setup` genererer Prisma-klienten, opretter databasen og indsætter de officielle regler samt standard-ansøgningstyper første gang. Demoindhold oprettes kun, hvis `SEED_DEMO_DATA="true"` er valgt udtrykkeligt i en lokal testdatabase.

## Discord OAuth

1. Opret en app på [Discord Developer Portal](https://discord.com/developers/applications).
2. Gå til **OAuth2** og tilføj redirect URL:
   `http://localhost:3000/api/auth/callback/discord`
3. Kopiér Client ID og Client Secret til `.env`.
4. Sæt en lang, tilfældig `AUTH_SECRET`.
5. Aktivér Developer Mode i Discord og kopier server-ID samt rolle-ID'er.
6. Udfyld `DISCORD_GUILD_ID`, `DISCORD_STAFF_ROLE_IDS` og `DISCORD_ADMIN_ROLE_IDS`.
7. Tilføj eventuelt dit eget Discord ID til `ADMIN_DISCORD_IDS` som nød-administrator.

Eksempel:

```env
DISCORD_CLIENT_ID="123..."
DISCORD_CLIENT_SECRET="secret..."
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/callback/discord"
AUTH_SECRET="mindst-32-tilfaeldige-tegn"
ADMIN_DISCORD_IDS="dit-discord-id,en-anden-admin-id"
DISCORD_GUILD_ID="serverens-discord-id"
DISCORD_STAFF_ROLE_IDS="staff-rolle-id,moderator-rolle-id"
DISCORD_ADMIN_ROLE_IDS="ejer-rolle-id,ledelse-rolle-id"
```

Når `DISCORD_GUILD_ID` er sat, beder OAuth om `guilds.members.read` og synkroniserer rollen ved hvert login. En bruger uden de konfigurerede roller bliver `USER`, og Admin-knappen forsvinder. API'et kontrollerer samme database-rolle server-side.

## FiveM-status

Sæt serverens HTTP-endpoint uden afsluttende skråstreg:

```env
CFX_SERVER_API_URL="https://frontend.cfx-services.net/api/servers/single/ler3lr5"
NEXT_PUBLIC_SERVER_CONNECT="cfx.re/join/ler3lr5"
```

Serverstatus hentes fra Cfx serverlisten og cachelagres i 30 sekunder. Ved netværksfejl viser brugerfladen en kontrolleret offline-status.

## Database

Udvikling bruger SQLite for nul opsætning. Modellerne ligger i `prisma/schema.prisma`:

- `User` — Discord-identitet og rolle
- `Session` / `OAuthState` — sikre login-sessioner og CSRF state
- `Post` — opslag og forfatterrelation
- `ChangelogEntry` — versioner, ændringspunkter og publiceringsstatus
- `RuleCategory` / `Rule` — redigerbare regler, kategorier og sortering
- `Application` — JSON-svar, status og staff-note
- `ApplicationType` — staff-oprettede jobtyper og dynamiske spørgsmål
- `StaffMember` — visning, sortering og aktiv-status
- `MapLocation` — GTA-koordinater, kategori, ikon og synlighed

Til produktion anbefales PostgreSQL. Skift `provider` til `postgresql`, sæt `DATABASE_URL` til din database og kør:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### MySQL via XAMPP

SQLite er allerede vedvarende og kræver ingen server. Hvis I vil bruge XAMPP/MySQL, opret databasen `zendixrp`, skift `provider` i `prisma/schema.prisma` til `mysql`, og brug:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/zendixrp"
```

Kør derefter `npm run db:push` og `npm run db:seed`. Brug aldrig XAMPP-standardopsætningen offentligt uden password og netværksbegrænsning.

## Live GTA-kort og FiveM-sync

Staff kan oprette lokationer under **Admin → Kort** med X/Y-koordinater fra FiveM. Det offentlige kort opdaterer automatisk hvert 30. sekund.

Sæt `MAP_SYNC_SECRET` for at synkronisere en hel serverkonfiguration. Endpointet er `POST /api/map-sync` med headeren `Authorization: Bearer <secret>`:

```json
{
  "replace": true,
  "locations": [
    {
      "externalId": "police_missionrow",
      "title": "Mission Row Police Department",
      "description": "Politiets hovedstation",
      "category": "Myndighed",
      "icon": "shield",
      "color": "#4dabf7",
      "x": 441.2,
      "y": -981.9,
      "active": true,
      "sortOrder": 1
    }
  ]
}
```

Minimal FiveM/Lua-synkronisering:

```lua
PerformHttpRequest('https://jeres-domæne.dk/api/map-sync', function(status)
  print(('Zendix map sync: %s'):format(status))
end, 'POST', json.encode({ replace = true, locations = Config.WebMapLocations }), {
  ['Content-Type'] = 'application/json',
  ['Authorization'] = 'Bearer JERES_MAP_SYNC_SECRET'
})
```

Standardtiles kommer fra det konfigurerbare community-tile-sæt `meesvrh/GTAV-Map-Tiles`. Til drift med høj trafik bør I hoste tiles selv og sætte `NEXT_PUBLIC_GTA_ATLAS_TILES` / `NEXT_PUBLIC_GTA_SATELLITE_TILES`.

## Vigtige scripts

```bash
npm run dev         # udviklingsserver
npm run build       # produktionsbuild
npm run start       # start produktionsbuild
npm run lint        # lint hele projektet
npm run db:push     # synkroniser schema uden migration
npm run db:seed     # eksempeldata
npm run db:studio   # vis/rediger data
```

## Produktionsnoter

- Brug HTTPS, en stærk `AUTH_SECRET` og PostgreSQL.
- Sæt `NEXT_PUBLIC_APP_URL` og Discord redirect URI til det rigtige domæne.
- Begræns databasens netværksadgang og tag backups.
- FiveM-status cachelagres i 30 sekunder og har timeout, så en nede server ikke blokerer websitet.
- API-ruter kontrollerer roller server-side; skjulte UI-knapper er ikke eneste adgangskontrol.

## Officiel lancering

Produktionsstart er bevidst låst, indtil alle kritiske miljøvariabler er korrekte. Kontrollér opsætningen med:

```bash
npm run release:check
```

Før lancering skal `.env` mindst have:

- et offentligt HTTPS-domæne i `NEXT_PUBLIC_APP_URL`;
- samme domæne plus `/api/auth/callback/discord` i `DISCORD_REDIRECT_URI`;
- unikke `AUTH_SECRET` og `MAP_SYNC_SECRET` på mindst 32 tegn;
- Discord server-ID, client-oplysninger og mindst én adminrolle eller nød-admin;
- `SEED_DEMO_DATA="false"`.

Byg og klargør den officielle installation:

```bash
npm ci
npm run release:build
npm start
```

`npm start` kører release-check automatisk og nægter at starte med localhost, korte secrets eller manglende Discord-konfiguration. Driftstjek findes på `/api/health`.

Ved SQLite-drift skal der kun køre én webserverinstans. Opret en konsistent backup med:

```bash
npm run db:backup
```

Gem backupmappen på et separat drev eller backupmål, og planlæg kommandoen dagligt via Windows Opgavestyring. Ved flere webserverinstanser skal databasen flyttes til PostgreSQL/MySQL og administreres med rigtige migrationer og databaseudbyderens backupværktøj.

Discord reviewer-roller konfigureres under **Admin → Ansøgningstyper**. En reviewer ser kun de tilknyttede typer; `ADMIN` kan altid behandle alle ansøgninger. Brugere skal logge ud og ind igen efter en Discord-rolleændring.
