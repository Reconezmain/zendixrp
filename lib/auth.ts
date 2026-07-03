import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE = 'zendix_session';
const SESSION_AGE = 60 * 60 * 24 * 30;
export type UserRoleName = 'USER' | 'STAFF' | 'ADMIN';

function hashToken(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error('AUTH_SECRET skal være mindst 32 tegn i produktion');
  }
  return createHash('sha256').update(`${token}:${secret || 'development-only-secret'}`).digest('hex');
}

function envIds(name: string) {
  return (process.env[name] || '').split(',').map((id) => id.trim()).filter(Boolean);
}

export function resolveConfiguredRole(discordId: string, discordRoles: unknown): UserRoleName {
  if (envIds('ADMIN_DISCORD_IDS').includes(discordId)) return 'ADMIN';

  // Never preserve an old database role when Discord role sync is not configured.
  if (!process.env.DISCORD_GUILD_ID) return 'USER';

  const roles = Array.isArray(discordRoles)
    ? discordRoles.filter((role): role is string => typeof role === 'string')
    : [];
  if (roles.some((role) => envIds('DISCORD_ADMIN_ROLE_IDS').includes(role))) return 'ADMIN';
  if (roles.some((role) => envIds('DISCORD_STAFF_ROLE_IDS').includes(role))) return 'STAFF';
  return 'USER';
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_AGE * 1000),
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  const configuredRole = resolveConfiguredRole(session.user.discordId, session.user.discordRoles);
  if (configuredRole !== session.user.role) {
    return prisma.user.update({
      where: { id: session.user.id },
      data: { role: configuredRole, roleSyncedAt: new Date() },
    });
  }
  return session.user;
}

export function isStaff(role?: string | null) {
  return role === 'ADMIN' || role === 'STAFF';
}

export function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function discordAvatar(discordId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordId.slice(-1) || 0) % 6}.png`;
  const extension = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
}
