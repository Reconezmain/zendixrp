import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { canReviewApplication } from '@/lib/application-permissions';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applicationUpdateSchema } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const { id } = await params;
  if (!await canReviewApplication(user, id)) return NextResponse.json({ error: 'Du må ikke behandle denne ansøgningstype' }, { status: 403 });
  const parsed = applicationUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const application = await prisma.application.update({
    where: { id },
    data: parsed.data,
    include: { user: { select: { id: true, username: true, avatar: true, discordId: true } }, applicationType: { select: { questions: true } } },
  }).catch(() => null);
  if (!application) return NextResponse.json({ error: 'Ansøgningen findes ikke' }, { status: 404 });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return NextResponse.json(application);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });
  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!application) return NextResponse.json({ error: 'Ansøgningen findes ikke' }, { status: 404 });
  const reviewerAccess = await canReviewApplication(user, id);
  const ownerCanDelete = application.userId === user.id && (application.status === 'APPROVED' || application.status === 'REJECTED');
  if (!reviewerAccess && !ownerCanDelete) return NextResponse.json({ error: 'Ingen adgang til at slette ansøgningen' }, { status: 403 });
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return NextResponse.json({ ok: true });
}
