import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applicationTypeSchema, slugify } from '@/lib/validation';

async function authorized() {
  const user = await getCurrentUser();
  return Boolean(user && isStaff(user.role));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = applicationTypeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.applicationType.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Ansøgningstypen findes ikke' }, { status: 404 });
  let slug = existing.slug;
  if (existing.name !== parsed.data.name) {
    const candidate = slugify(parsed.data.name);
    slug = await prisma.applicationType.findFirst({ where: { slug: candidate, NOT: { id } } }) ? `${candidate}-${Date.now().toString(36)}` : candidate;
  }
  const type = await prisma.applicationType.update({ where: { id }, data: { ...parsed.data, slug } });
  return NextResponse.json(type);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const deleted = await prisma.applicationType.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'Ansøgningstypen findes ikke' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
