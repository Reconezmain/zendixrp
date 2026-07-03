import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected', version: process.env.npm_package_version || '1.0.0' });
  } catch {
    return NextResponse.json({ status: 'unavailable', database: 'disconnected' }, { status: 503 });
  }
}
