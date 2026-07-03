import { Avatar, Button } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardApplications } from '@/components/DashboardApplications';
import type { STATUS_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mit dashboard' };

type DashboardApplicationRow = {
  id: string;
  type: string;
  status: keyof typeof STATUS_LABELS;
  adminNote: string | null;
  createdAt: Date;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/ansogninger');
  const applications: DashboardApplicationRow[] = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, status: true, adminNote: true, createdAt: true },
  });
  return <section className="contentSection"><div className="sectionInner"><div className="dashboardHeader"><div className="profileLine"><Avatar src={user.avatar} size={64} color="zendix">{user.username[0]}</Avatar><div><h1>Hej, {user.username}</h1><div style={{color:'var(--muted)'}}>Her kan du følge dine ansøgninger.</div></div></div><Button component={Link} href="/ansogninger" rightSection={<IconArrowRight size={16} />}>Ny ansøgning</Button></div>
    <DashboardApplications initialApplications={applications.map((application: DashboardApplicationRow)=>({id:application.id,type:application.type,status:application.status,adminNote:application.adminNote,createdAt:application.createdAt.toISOString()}))}/>
  </div></section>;
}
