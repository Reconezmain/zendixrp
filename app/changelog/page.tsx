import { Badge } from '@mantine/core';
import { IconCheck, IconGitCommit } from '@tabler/icons-react';
import { PageHero } from '@/components/PageHero';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Changelog' };

export default async function ChangelogPage() {
  const entries = await prisma.changelogEntry.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } });
  return <><PageHero eyebrow="Udviklingen" title="Changelog" text="Følg med i nye features, forbedringer og rettelser på ZendixRP-platformen."/><section className="contentSection"><div className="changelogTimeline">{entries.length ? entries.map((entry, index) => <article className="changelogEntry" key={entry.id}><div className="changelogRail"><span className="changelogDot"><IconGitCommit size={18}/></span>{index < entries.length - 1 && <span className="changelogLine"/>}</div><div className="changelogCard"><div className="changelogTop"><div><Badge variant="light" size="lg">Version {entry.version}</Badge><h2>{entry.title}</h2></div><time>{new Intl.DateTimeFormat('da-DK',{dateStyle:'long'}).format(entry.createdAt)}</time></div><p className="changelogSummary">{entry.summary}</p><ul>{(entry.changes as string[]).map((change) => <li key={change}><IconCheck size={17}/><span>{change}</span></li>)}</ul><div className="changelogAuthor">Udgivet af {entry.author.username}</div></div></article>) : <div className="emptyState">Der er ikke udgivet nogen changelog endnu.</div>}</div></section></>;
}
