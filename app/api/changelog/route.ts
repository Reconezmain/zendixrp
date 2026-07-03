import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { changelogSchema } from '@/lib/validation';

export async function GET() {
  const entries = await prisma.changelogEntry.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = changelogSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const entry = await prisma.changelogEntry.create({ data: { ...parsed.data, authorId: user.id }, include: { author: { select: { username: true } } } });
  return NextResponse.json(entry, { status: 201 });
}
