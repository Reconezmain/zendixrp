import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const posts = await prisma.post.findMany({ select: { slug: true, updatedAt: true } });
  const staticPages = ['', '/opslag', '/changelog', '/status', '/kort', '/regler', '/ansogninger', '/staff', '/privatliv'];
  return [
    ...staticPages.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: path === '' ? 'daily' as const : 'weekly' as const })),
    ...posts.map((post) => ({ url: `${baseUrl}/opslag/${post.slug}`, lastModified: post.updatedAt, changeFrequency: 'monthly' as const })),
  ];
}
