import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { changelogSchema } from '@/lib/validation';

async function authorized() {
  const user = await getCurrentUser();
  return Boolean(user && isStaff(user.role));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = changelogSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const { id } = await params;
  const entry = await prisma.changelogEntry.update({ where: { id }, data: parsed.data, include: { author: { select: { username: true } } } }).catch(() => null);
  if (!entry) return NextResponse.json({ error: 'Changelog-posten findes ikke' }, { status: 404 });
  return NextResponse.json(entry);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const deleted = await prisma.changelogEntry.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'Changelog-posten findes ikke' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
