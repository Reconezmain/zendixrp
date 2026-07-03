import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { getReviewableTypeIds } from '@/lib/application-permissions';
import { prisma } from '@/lib/prisma';
import type { ApplicationQuestion, PublicApplicationType } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/ansogninger');

  const reviewableTypeIds = await getReviewableTypeIds(user);
  const canReviewApplications = reviewableTypeIds === null || reviewableTypeIds.length > 0;
  const canManageContent = isStaff(user.role);
  if (!canManageContent && !canReviewApplications) redirect('/dashboard');

  const applicationWhere = reviewableTypeIds === null
    ? {}
    : { typeId: { in: reviewableTypeIds } };

  const [postsRaw, applicationsRaw, staff, typesRaw, locationsRaw, changelogRaw, rulesRaw] = await Promise.all([
    canManageContent ? prisma.post.findMany({ orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } }) : [],
    canReviewApplications ? prisma.application.findMany({ where: applicationWhere, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, username: true, avatar: true, discordId: true } }, applicationType: { select: { questions: true } } } }) : [],
    canManageContent ? prisma.staffMember.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }) : [],
    canManageContent ? prisma.applicationType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }) : [],
    canManageContent ? prisma.mapLocation.findMany({ orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] }) : [],
    canManageContent ? prisma.changelogEntry.findMany({ orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } }) : [],
    canManageContent ? prisma.ruleCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { rules: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } }) : [],
  ]);

  const posts = postsRaw.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() }));
  const applications = applicationsRaw.map((application) => ({
    ...application,
    answers: application.answers as Record<string, string>,
    applicationType: application.applicationType ? { questions: application.applicationType.questions as unknown as ApplicationQuestion[] } : null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));
  const types = typesRaw.map((type) => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    category: type.category,
    questions: type.questions,
    reviewerRoleIds: type.reviewerRoleIds,
    active: type.active,
    sortOrder: type.sortOrder,
  })) as unknown as PublicApplicationType[];
  const locations = locationsRaw.map((location) => ({ id: location.id, externalId: location.externalId, title: location.title, description: location.description, category: location.category, icon: location.icon, color: location.color, x: location.x, y: location.y, active: location.active, sortOrder: location.sortOrder }));
  const changelog = changelogRaw.map((entry) => ({ id: entry.id, version: entry.version, title: entry.title, summary: entry.summary, changes: entry.changes as string[], published: entry.published, createdAt: entry.createdAt.toISOString(), author: entry.author }));
  const rules = rulesRaw.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description, sortOrder: category.sortOrder, active: category.active, rules: category.rules.map((rule) => ({ id: rule.id, code: rule.code, title: rule.title, content: rule.content, sortOrder: rule.sortOrder, active: rule.active })) }));

  return <section className="adminShell">
    <div className="adminHeader"><div><h1>{canManageContent ? 'Admin dashboard' : 'Ansøgningspanel'}</h1><div style={{ color: 'var(--muted)' }}>Velkommen tilbage, {user.username}.</div></div></div>
    <AdminDashboard
      initialPosts={posts}
      initialApplications={applications}
      initialStaff={staff}
      initialTypes={types}
      initialLocations={locations}
      initialChangelog={changelog}
      initialRules={rules}
      canManageContent={canManageContent}
      canReviewApplications={canReviewApplications}
    />
  </section>;
}
