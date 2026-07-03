import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ruleCategorySchema, slugify } from '@/lib/validation';

async function authorized() {
  const user = await getCurrentUser();
  return Boolean(user && isStaff(user.role));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = ruleCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.ruleCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Regelkategorien findes ikke' }, { status: 404 });
  let slug = existing.slug;
  if (existing.name !== parsed.data.name) {
    const candidate = slugify(parsed.data.name);
    slug = await prisma.ruleCategory.findFirst({ where: { slug: candidate, NOT: { id } } }) ? `${candidate}-${Date.now().toString(36)}` : candidate;
  }
  const { rules, ...category } = parsed.data;
  const validIds = rules.flatMap((rule) => rule.id ? [rule.id] : []);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.ruleCategory.update({ where: { id }, data: { ...category, description: category.description || null, slug } });
    await tx.rule.deleteMany({ where: { categoryId: id, ...(validIds.length ? { id: { notIn: validIds } } : {}) } });
    for (const rule of rules) {
      const { id: ruleId, ...data } = rule;
      if (ruleId) await tx.rule.updateMany({ where: { id: ruleId, categoryId: id }, data });
      else await tx.rule.create({ data: { ...data, categoryId: id } });
    }
    return tx.ruleCategory.findUniqueOrThrow({ where: { id }, include: { rules: { orderBy: { sortOrder: 'asc' } } } });
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const deleted = await prisma.ruleCategory.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ error: 'Regelkategorien findes ikke' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
