import { Badge, Button, Card } from '@mantine/core';
import { IconArrowRight, IconBrandDiscord, IconCode, IconCoin, IconGauge, IconGavel, IconShieldCheck, IconUsersGroup } from '@tabler/icons-react';
import Link from 'next/link';
import { HomeHero } from '@/components/HomeHero';
import { ServerStatus } from '@/components/ServerStatus';
import { SectionHeading } from '@/components/SectionHeading';
import { prisma } from '@/lib/prisma';
import { DISCORD_INVITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const features = [
  { icon: IconShieldCheck, title: 'Aktiv staff', text: 'Et synligt og tilgængeligt team, der hjælper hurtigt og træffer beslutninger på et fair grundlag.' },
  { icon: IconCode, title: 'Custom scripts', text: 'Systemer bygget til vores verden — med fokus på rolleplay, dybde og naturlig interaktion.' },
  { icon: IconUsersGroup, title: 'Stærkt fællesskab', text: 'Et community hvor nye og erfarne spillere mødes om gode historier og respekt for hinanden.' },
  { icon: IconGauge, title: 'Optimeret server', text: 'Stabil performance, løbende vedligehold og mindre ventetid mellem dig og din karakter.' },
  { icon: IconCoin, title: 'Realistisk økonomi', text: 'En balanceret progression hvor valg, relationer og indsats betyder mere end ren grind.' },
  { icon: IconGavel, title: 'Fair regler', text: 'Tydelige rammer med plads til kreativitet — håndhævet ensartet og forklaret ordentligt.' },
];

export default async function Home() {
  const posts = await prisma.post.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } });
  return (
    <>
      <HomeHero />
      <div className="statusBand"><ServerStatus compact /></div>

      <section className="contentSection">
        <div className="sectionInner">
          <SectionHeading center eyebrow="Bygget til historier" title="Hvorfor vælge ZendixRP?" text="Vi har skruet ned for støjen og op for det, der gør roleplay værd at vende tilbage til." />
          <div className="featureGrid">{features.map(({ icon: Icon, title, text }) => <div className="featureCard" key={title}><div className="featureIcon"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p></div>)}</div>
        </div>
      </section>

      <section className="contentSection alt">
        <div className="sectionInner">
          <div className="sectionTopline"><SectionHeading eyebrow="Fra byen" title="Seneste opslag" text="Opdateringer, nyheder og glimt fra livet på ZendixRP." /><Button component={Link} href="/opslag" variant="subtle" rightSection={<IconArrowRight size={17} />}>Se alle opslag</Button></div>
          <div className="postsGrid">{posts.map((post) => <Card component={Link} href={`/opslag/${post.slug}`} className="postCard" key={post.id}><Badge variant="light">{post.category}</Badge><h3>{post.title}</h3><p>{post.excerpt}</p><div className="postMeta"><span>{new Intl.DateTimeFormat('da-DK',{dateStyle:'medium'}).format(post.createdAt)}</span><IconArrowRight className="cardArrow" size={18} /></div></Card>)}</div>
        </div>
      </section>

      <section className="contentSection">
        <div className="sectionInner">
          <SectionHeading center eyebrow="Tre enkle skridt" title="Sådan kommer du i gang" />
          <div className="stepsGrid"><div className="stepCard"><h3>Læs rammerne</h3><p>Lær vores regler og værdier at kende. De er fundamentet for alles oplevelse.</p></div><div className="stepCard"><h3>Skab din karakter</h3><p>Find en idé med fejl, ambitioner og plads til at udvikle sig sammen med andre.</p></div><div className="stepCard"><h3>Send din ansøgning</h3><p>Log ind med Discord, fortæl os om idéen og følg status direkte i dit dashboard.</p></div></div>
        </div>
      </section>

      <section className="contentSection compact"><div className="discordCta"><div><h2>Historien fortsætter på Discord</h2><p>Mød communityet, få hjælp og vær den første til at høre nyt fra byen.</p></div><Button component="a" href={DISCORD_INVITE} target="_blank" size="lg" color="indigo" leftSection={<IconBrandDiscord size={20} />}>Join ZendixRP</Button></div></section>
    </>
  );
}
