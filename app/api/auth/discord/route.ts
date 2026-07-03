import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/discord`;
  if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/ansogninger?authError=config', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }
  const rateLimit = await checkRateLimit(request, 'oauth-start', 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: 'For mange loginforsøg. Prøv igen senere.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });

  await prisma.oAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const state = randomBytes(24).toString('base64url');
  await prisma.oAuthState.create({ data: { id: state, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  (await cookies()).set('zendix_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/callback/discord',
    maxAge: 10 * 60,
  });
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', process.env.DISCORD_GUILD_ID ? 'identify guilds.members.read' : 'identify');
  url.searchParams.set('state', state);
  return NextResponse.redirect(url);
}
