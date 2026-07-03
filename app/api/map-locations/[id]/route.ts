import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mapLocationSchema } from '@/lib/validation';

async function authorized() {
  const user = await getCurrentUser();
  return Boolean(user && isStaff(user.role));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = mapLocationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const { id } = await params;
  const location = await prisma.mapLocation.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!location) return NextResponse.json({ error: 'Lokationen findes ikke' }, { status: 404 });
  return NextResponse.json(location);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const deleted = await prisma.mapLocation.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'Lokationen findes ikke' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
