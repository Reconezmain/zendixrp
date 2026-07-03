import { PageHero } from '@/components/PageHero';
import { GtaMap } from '@/components/GtaMap';
import { prisma } from '@/lib/prisma';
import type { MapLocationData } from '@/lib/map';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live kort' };

export default async function MapPage() {
  const locations: MapLocationData[] = await prisma.mapLocation.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }], select: { id: true, externalId: true, title: true, description: true, category: true, icon: true, color: true, x: true, y: true, active: true, sortOrder: true } });
  return <><PageHero eyebrow="Udforsk byen" title="ZendixRP live map" text="Find jobs, myndigheder, virksomheder og community-steder direkte på kortet. Nye lokationer dukker automatisk op."/><section className="mapSection"><GtaMap initialLocations={locations}/><p className="mapAttribution">Interaktivt kort bygget med Leaflet · GTA V-korttiles fra <a href="https://github.com/meesvrh/GTAV-Map-Tiles" target="_blank" rel="noreferrer">GTAV Map Tiles</a>. Grand Theft Auto er et varemærke tilhørende Rockstar Games.</p></section></>;
}
