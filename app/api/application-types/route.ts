import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applicationTypeSchema, slugify } from '@/lib/validation';

export async function GET() {
  const types = await prisma.applicationType.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, description: true, category: true, questions: true, active: true, sortOrder: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = applicationTypeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const baseSlug = slugify(parsed.data.name);
  const duplicate = await prisma.applicationType.findUnique({ where: { slug: baseSlug } });
  const slug = duplicate ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const type = await prisma.applicationType.create({ data: { ...parsed.data, slug } });
  return NextResponse.json(type, { status: 201 });
}
