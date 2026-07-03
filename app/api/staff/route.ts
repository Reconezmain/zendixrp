import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { staffSchema } from '@/lib/validation';

export async function GET() {
  const staff = await prisma.staffMember.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  const parsed = staffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const staff = await prisma.staffMember.create({ data: { ...parsed.data, avatar: parsed.data.avatar || null } });
  return NextResponse.json(staff, { status: 201 });
}
