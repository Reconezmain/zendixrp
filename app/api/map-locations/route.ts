import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mapLocationSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get('all') === '1';
  if (all) {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  }
  const locations = await prisma.mapLocation.findMany({ where: all ? {} : { active: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = mapLocationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  return NextResponse.json(await prisma.mapLocation.create({ data: parsed.data }), { status: 201 });
}
