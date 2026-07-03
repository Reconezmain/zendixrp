import { Badge, Card } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { PageHero } from '@/components/PageHero';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Opslag' };

type PostListRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  createdAt: Date;
  author: { username: string };
};

type CategoryRow = {
  category: string;
};

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [posts, categoryRows] = await Promise.all([
    prisma.post.findMany({ where: category ? { category } : {}, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } }),
    prisma.post.findMany({ distinct: ['category'], select: { category: true } }),
  ]) as [PostListRow[], CategoryRow[]];
  const categories = categoryRows.map((row: CategoryRow) => row.category);
  return (
    <><PageHero eyebrow="Nyheder & opdateringer" title="Opslag fra byen" text="Følg med i udviklingen, events og de historier, der former ZendixRP." /><section className="contentSection"><div className="sectionInner">
      <div className="filterRow"><Badge component={Link} href="/opslag" size="lg" variant={!category ? 'filled' : 'light'}>Alle</Badge>{categories.map((item: string) => <Badge component={Link} href={`/opslag?category=${encodeURIComponent(item)}`} key={item} size="lg" variant={category === item ? 'filled' : 'light'}>{item}</Badge>)}</div>
      {posts.length ? <div className="postsGrid">{posts.map((post: PostListRow) => <Card component={Link} href={`/opslag/${post.slug}`} className="postCard" key={post.id}><Badge variant="light">{post.category}</Badge><h3>{post.title}</h3><p>{post.excerpt}</p><div className="postMeta"><span>{new Intl.DateTimeFormat('da-DK',{dateStyle:'medium'}).format(post.createdAt)} · {post.author.username}</span><IconArrowRight className="cardArrow" size={18} /></div></Card>)}</div> : <div className="emptyState">Ingen opslag i denne kategori endnu.</div>}
    </div></section></>
  );
}
