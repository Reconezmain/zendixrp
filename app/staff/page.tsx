import { Avatar, Badge } from '@mantine/core';
import { IconBrandDiscord } from '@tabler/icons-react';
import { PageHero } from '@/components/PageHero';
import { prisma } from '@/lib/prisma';
import { STAFF_GROUPS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff' };

export default async function StaffPage() {
  const staff = await prisma.staffMember.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  return <><PageHero eyebrow="Holdet bag" title="Mød staff" text="Menneskene, der holder byen kørende, hjælper communityet og bygger næste kapitel." /><section className="contentSection"><div className="sectionInner">{staff.length ? <div className="staffGroups">{STAFF_GROUPS.map((group) => { const members = staff.filter((member) => member.group === group.value); if (!members.length) return null; return <section className="staffGroup" key={group.value}><div className="staffGroupHeading"><Badge color={group.color} variant="light">{group.label}</Badge><span>{members.length} {members.length === 1 ? 'medlem' : 'medlemmer'}</span></div><div className="staffGrid">{members.map((member) => <div className="staffCard" key={member.id}><div className="staffAvatarWrap"><Avatar src={member.avatar} size={92} color="zendix" name={member.name} /></div><Badge color={group.color} variant="light">{member.rank}</Badge><h3>{member.name}</h3><div className="staffTag"><IconBrandDiscord size={15} /> {member.discordTag}</div><p>{member.description}</p></div>)}</div></section>; })}</div> : <div className="emptyState">Staff-teamet bliver snart præsenteret her.</div>}</div></section></>;
}
