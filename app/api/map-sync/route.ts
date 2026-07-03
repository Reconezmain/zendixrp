import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mapSyncSchema } from '@/lib/validation';

type MapSyncTransaction = Pick<typeof prisma, 'mapLocation'>;

export async function POST(request: Request) {
  const secret = process.env.MAP_SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: 'MAP_SYNC_SECRET er ikke konfigureret' }, { status: 503 });
  const authorization = request.headers.get('authorization') || '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!provided || !safeEqual(provided, secret)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 401 });

  const parsed = mapSyncSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige kortdata' }, { status: 400 });
  const externalIds = parsed.data.locations.map((location) => location.externalId);

  await prisma.$transaction(async (tx: MapSyncTransaction) => {
    if (parsed.data.replace) {
      await tx.mapLocation.updateMany({ where: { externalId: { not: null }, NOT: { externalId: { in: externalIds } } }, data: { active: false } });
    }
    for (const location of parsed.data.locations) {
      const { externalId, ...data } = location;
      await tx.mapLocation.upsert({ where: { externalId }, update: data, create: { externalId, ...data } });
    }
  });

  return NextResponse.json({ ok: true, synced: parsed.data.locations.length, replaced: parsed.data.replace });
}
