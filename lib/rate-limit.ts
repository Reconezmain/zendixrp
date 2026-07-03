import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

type RateLimitTransaction = Pick<typeof prisma, 'rateLimit'>;

function requestFingerprint(request: Request) {
  const forwarded = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  return createHash('sha256').update(forwarded).digest('hex').slice(0, 24);
}

export async function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number, identity?: string) {
  const now = new Date();
  const key = `${scope}:${identity || requestFingerprint(request)}`;
  const resetAt = new Date(now.getTime() + windowMs);

  const result = await prisma.$transaction(async (tx: RateLimitTransaction) => {
    await tx.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
    const existing = await tx.rateLimit.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      return tx.rateLimit.upsert({ where: { key }, update: { count: 1, resetAt }, create: { key, count: 1, resetAt } });
    }
    return tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  });

  return {
    allowed: result.count <= limit,
    remaining: Math.max(0, limit - result.count),
    retryAfterSeconds: Math.max(1, Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000)),
  };
}
