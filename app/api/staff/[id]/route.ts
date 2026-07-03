import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { staffSchema } from '@/lib/validation';

async function authorized() {
  const user = await getCurrentUser();
  return Boolean(user && isStaff(user.role));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = staffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await params;
  const staff = await prisma.staffMember.update({ where: { id }, data: { ...parsed.data, avatar: parsed.data.avatar || null } }).catch(() => null);
  if (!staff) return NextResponse.json({ error: 'Staff-medlemmet findes ikke' }, { status: 404 });
  return NextResponse.json(staff);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const deleted = await prisma.staffMember.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'Staff-medlemmet findes ikke' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
