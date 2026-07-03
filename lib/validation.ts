import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().trim().min(5, 'Titlen skal være mindst 5 tegn').max(120),
  category: z.string().trim().min(2).max(40),
  excerpt: z.string().trim().min(20, 'Skriv en kort introduktion').max(240),
  content: z.string().trim().min(40, 'Opslaget skal være mindst 40 tegn').max(20_000),
});

export const changelogSchema = z.object({
  version: z.string().trim().min(1).max(30),
  title: z.string().trim().min(4).max(120),
  summary: z.string().trim().min(15).max(500),
  changes: z.array(z.string().trim().min(3).max(300)).min(1).max(30),
  published: z.boolean(),
});

export const ruleCategorySchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
  rules: z.array(z.object({
    id: z.string().optional(),
    code: z.string().trim().max(30).optional().nullable(),
    title: z.string().trim().min(2).max(100),
    content: z.string().trim().min(10).max(2000),
    sortOrder: z.coerce.number().int().min(0).max(999),
    active: z.boolean(),
  })).min(1).max(100),
});

export const applicationSubmissionSchema = z.object({
  typeId: z.string().cuid(),
  answers: z.record(z.string().max(5000)),
});

const applicationQuestionSchema = z.object({
  id: z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/, 'Spørgsmåls-ID må kun indeholde bogstaver, tal, _ og -'),
  label: z.string().trim().min(3).max(180),
  description: z.string().trim().max(300).optional(),
  type: z.enum(['text', 'textarea']),
  required: z.boolean(),
  minLength: z.coerce.number().int().min(0).max(1000),
});

export const applicationTypeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(500),
  category: z.string().trim().min(2).max(50),
  questions: z.array(applicationQuestionSchema).min(1, 'Tilføj mindst ét spørgsmål').max(20),
  reviewerRoleIds: z.array(
    z.string().trim().regex(/^\d{15,22}$/, 'Discord rolle-ID skal bestå af 15-22 tal'),
  ).max(20).transform((ids) => [...new Set(ids)]),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(['SENT', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
  adminNote: z.string().max(4000).optional().nullable(),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rank: z.string().trim().min(2).max(80),
  group: z.enum(['OWNER', 'MANAGEMENT', 'DEVELOPER', 'ADMINISTRATOR', 'MODERATOR', 'SUPPORT']),
  avatar: z.string().trim().url('Brug en gyldig billedadresse').or(z.literal('')).optional(),
  discordTag: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(500),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

export const mapLocationSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(600),
  category: z.string().trim().min(2).max(50),
  icon: z.enum(['pin', 'shield', 'medical', 'star', 'wrench', 'briefcase', 'garage', 'home']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Vælg en gyldig HEX-farve'),
  x: z.coerce.number().min(-10000).max(10000),
  y: z.coerce.number().min(-10000).max(12000),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const mapSyncSchema = z.object({
  replace: z.boolean().optional().default(false),
  locations: z.array(mapLocationSchema.extend({ externalId: z.string().trim().min(1).max(100) })).min(1).max(500),
});

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
