import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ruleCategorySchema, slugify } from '@/lib/validation';

export async function GET() {
  const categories = await prisma.ruleCategory.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { rules: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = ruleCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const baseSlug = slugify(parsed.data.name);
  const slug = await prisma.ruleCategory.findUnique({ where: { slug: baseSlug } }) ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const { rules, ...category } = parsed.data;
  const created = await prisma.ruleCategory.create({ data: { ...category, description: category.description || null, slug, rules: { create: rules.map((rule) => ({ code: rule.code || null, title: rule.title, content: rule.content, sortOrder: rule.sortOrder, active: rule.active })) } }, include: { rules: { orderBy: { sortOrder: 'asc' } } } });
  return NextResponse.json(created, { status: 201 });
}
