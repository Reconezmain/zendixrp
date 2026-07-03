import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReviewableTypeIds } from '@/lib/application-permissions';
import { prisma } from '@/lib/prisma';
import { applicationSubmissionSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ApplicationQuestion } from '@/lib/constants';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });

  const reviewableTypeIds = await getReviewableTypeIds(user);
  const reviewerView = reviewableTypeIds === null || reviewableTypeIds.length > 0;
  const applications = await prisma.application.findMany({
    where: reviewableTypeIds === null
      ? {}
      : reviewerView
        ? { typeId: { in: reviewableTypeIds } }
        : { userId: user.id },
    include: reviewerView
      ? { user: { select: { id: true, username: true, avatar: true, discordId: true } }, applicationType: { select: { questions: true } } }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Du skal være logget ind med Discord.' }, { status: 401 });
  const rateLimit = await checkRateLimit(request, 'application-submit', 10, 60 * 60 * 1000, user.id);
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Du har sendt for mange ansøgninger. Prøv igen senere.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
  const parsed = applicationSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ugyldige felter' }, { status: 400 });
  const type = await prisma.applicationType.findFirst({ where: { id: parsed.data.typeId, active: true } });
  if (!type) return NextResponse.json({ error: 'Ansøgningstypen er lukket eller findes ikke længere.' }, { status: 404 });
  const questions = type.questions as unknown as ApplicationQuestion[];
  const answers: Record<string, string> = {};
  for (const question of questions) {
    const value = (parsed.data.answers[question.id] || '').trim();
    if (question.required && value.length < question.minLength) {
      return NextResponse.json({ error: `${question.label} skal være mindst ${question.minLength} tegn.` }, { status: 400 });
    }
    answers[question.id] = value;
  }
  const recent = await prisma.application.findFirst({ where: { userId: user.id, typeId: type.id, createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } } });
  if (recent) return NextResponse.json({ error: 'Vent et øjeblik, før du sender samme ansøgningstype igen.' }, { status: 429 });
  const application = await prisma.application.create({ data: { userId: user.id, typeId: type.id, type: type.name, answers } });
  return NextResponse.json(application, { status: 201 });
}
