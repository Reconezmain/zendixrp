import { Anchor, Badge } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, include: { author: { select: { username: true } } } });
  if (!post) notFound();
  return <section className="contentSection"><article className="articleWrap"><Anchor component={Link} href="/opslag" c="dimmed"><IconArrowLeft size={15} /> Tilbage til opslag</Anchor><header className="articleHeader"><Badge mt="xl" size="lg" variant="light">{post.category}</Badge><h1>{post.title}</h1><div className="articleMeta"><span>Af {post.author.username}</span><span>{new Intl.DateTimeFormat('da-DK',{dateStyle:'long'}).format(post.createdAt)}</span></div></header><div className="articleContent">{post.content}</div></article></section>;
}
