import { Avatar, Button } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardApplications } from '@/components/DashboardApplications';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mit dashboard' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/ansogninger');
  const applications = await prisma.application.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return <section className="contentSection"><div className="sectionInner"><div className="dashboardHeader"><div className="profileLine"><Avatar src={user.avatar} size={64} color="zendix">{user.username[0]}</Avatar><div><h1>Hej, {user.username}</h1><div style={{color:'var(--muted)'}}>Her kan du følge dine ansøgninger.</div></div></div><Button component={Link} href="/ansogninger" rightSection={<IconArrowRight size={16} />}>Ny ansøgning</Button></div>
    <DashboardApplications initialApplications={applications.map((application)=>({id:application.id,type:application.type,status:application.status,adminNote:application.adminNote,createdAt:application.createdAt.toISOString()}))}/>
  </div></section>;
}
