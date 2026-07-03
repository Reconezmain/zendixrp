import { prisma } from '@/lib/prisma';
import type { UserRoleName } from '@/lib/auth';

type PermissionUser = {
  role: UserRoleName;
  discordRoles: unknown;
};

type ReviewableTypeRow = {
  id: string;
  reviewerRoleIds: unknown;
};

export function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function hasReviewerRole(user: PermissionUser, reviewerRoleIds: unknown) {
  if (user.role === 'ADMIN') return true;
  const userRoles = new Set(jsonStringArray(user.discordRoles));
  return jsonStringArray(reviewerRoleIds).some((roleId) => userRoles.has(roleId));
}

// null means unrestricted because ADMIN always overrides type-specific roles.
export async function getReviewableTypeIds(user: PermissionUser): Promise<string[] | null> {
  if (user.role === 'ADMIN') return null;
  const types: ReviewableTypeRow[] = await prisma.applicationType.findMany({
    select: { id: true, reviewerRoleIds: true },
  });
  return types.filter((type: ReviewableTypeRow) => hasReviewerRole(user, type.reviewerRoleIds)).map((type: ReviewableTypeRow) => type.id);
}

export async function canReviewApplication(user: PermissionUser, applicationId: string) {
  if (user.role === 'ADMIN') return true;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { applicationType: { select: { reviewerRoleIds: true } } },
  });
  return Boolean(application?.applicationType && hasReviewerRole(user, application.applicationType.reviewerRoleIds));
}

export async function hasAnyReviewerAccess(user: PermissionUser) {
  const typeIds = await getReviewableTypeIds(user);
  return typeIds === null || typeIds.length > 0;
}
