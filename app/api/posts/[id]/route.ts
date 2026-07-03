import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postSchema, slugify } from '@/lib/validation';

async function authorize() {
  const user = await getCurrentUser();
  return user && isStaff(user.role) ? user : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authorize();
  if (!user) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Opslaget findes ikke' }, { status: 404 });
  let slug = existing.slug;
  if (existing.title !== parsed.data.title) {
    const candidate = slugify(parsed.data.title);
    const conflict = await prisma.post.findFirst({ where: { slug: candidate, NOT: { id } } });
    slug = conflict ? `${candidate}-${Date.now().toString(36)}` : candidate;
  }
  const post = await prisma.post.update({ where: { id }, data: { ...parsed.data, slug }, include: { author: { select: { username: true } } } });
  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorize()) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return NextResponse.json({ error: 'Opslaget findes ikke' }, { status: 404 });
  await prisma.post.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/opslag');
  revalidatePath(`/opslag/${existing.slug}`);
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}
