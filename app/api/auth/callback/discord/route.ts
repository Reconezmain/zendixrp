import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, discordAvatar, resolveConfiguredRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type DiscordUser = { id: string; username: string; global_name?: string | null; avatar: string | null };
type DiscordMember = { roles?: string[] };

async function resolveGuildRole(accessToken: string, discordId: string) {
  const forcedAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (forcedAdmins.includes(discordId)) return { role: UserRole.ADMIN, roles: [] as string[] };

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return { role: UserRole.USER, roles: [] as string[] };

  const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!memberResponse.ok) return { role: UserRole.USER, roles: [] as string[] };

  const member = await memberResponse.json() as DiscordMember;
  const roles = member.roles || [];
  return { role: resolveConfiguredRole(discordId, roles), roles };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const cookieStore = await cookies();
  const cookieState = cookieStore.get('zendix_oauth_state')?.value;
  cookieStore.set('zendix_oauth_state', '', { path: '/api/auth/callback/discord', maxAge: 0 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!code || !state || !cookieState || cookieState !== state) return NextResponse.redirect(new URL('/ansogninger?authError=denied', appUrl));

  const validState = await prisma.oAuthState.findUnique({ where: { id: state } });
  if (!validState || validState.expiresAt < new Date()) return NextResponse.redirect(new URL('/ansogninger?authError=state', appUrl));
  await prisma.oAuthState.delete({ where: { id: state } });

  try {
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${appUrl}/api/auth/callback/discord`;
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      cache: 'no-store',
    });
    if (!tokenResponse.ok) throw new Error('Discord token exchange failed');
    const token = await tokenResponse.json();
    const profileResponse = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store' });
    if (!profileResponse.ok) throw new Error('Discord profile request failed');
    const profile = await profileResponse.json() as DiscordUser;
    const { role, roles } = await resolveGuildRole(token.access_token, profile.id);
    const user = await prisma.user.upsert({
      where: { discordId: profile.id },
      update: { username: profile.global_name || profile.username, avatar: discordAvatar(profile.id, profile.avatar), role, discordRoles: roles, roleSyncedAt: new Date() },
      create: { discordId: profile.id, username: profile.global_name || profile.username, avatar: discordAvatar(profile.id, profile.avatar), role, discordRoles: roles, roleSyncedAt: new Date() },
    });
    await createSession(user.id);
    return NextResponse.redirect(new URL('/ansogninger', appUrl));
  } catch (error) {
    console.error('Discord OAuth error', error);
    return NextResponse.redirect(new URL('/ansogninger?authError=discord', appUrl));
  }
}
