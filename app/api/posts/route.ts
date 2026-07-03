import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postSchema, slugify } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const take = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 12)));
  const category = searchParams.get('category') || undefined;
  const where = category ? { category } : {};
  const [items, total] = await Promise.all([
    prisma.post.findMany({ where, skip: (page - 1) * take, take, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } }),
    prisma.post.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pages: Math.ceil(total / take) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const baseSlug = slugify(parsed.data.title);
  const duplicate = await prisma.post.findUnique({ where: { slug: baseSlug } });
  const slug = duplicate ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const post = await prisma.post.create({ data: { ...parsed.data, slug, authorId: user.id }, include: { author: { select: { username: true } } } });
  return NextResponse.json(post, { status: 201 });
}
