import { Button } from '@mantine/core';
import { IconArrowRight, IconBook2, IconBrandDiscord, IconShieldCheck, IconUsersGroup } from '@tabler/icons-react';
import Link from 'next/link';
import { DISCORD_INVITE } from '@/lib/constants';

export function HomeHero() {
  return (
    <section className="hero">
      <div className="heroInner">
        <div className="heroCopy">
          <div className="livePill"><span className="liveDot" /> Dansk FiveM roleplay · Ansøgninger åbne</div>
          <h1 className="heroTitle">Skriv din <span className="outline">historie<span className="accent">.</span></span></h1>
          <p className="heroLead">ZendixRP er et ambitiøst dansk roleplay-community, hvor stærke karakterer, fair spilleregler og fælles historier kommer før alt andet.</p>
          <div className="heroActions">
            <Button component={Link} href="/ansogninger" size="lg" rightSection={<IconArrowRight size={18} />}>Ansøg nu</Button>
            <Button component={Link} href="/regler" size="lg" variant="default" leftSection={<IconBook2 size={18} />}>Læs regler</Button>
            <Button component="a" href={DISCORD_INVITE} target="_blank" size="lg" variant="subtle" color="gray" leftSection={<IconBrandDiscord size={19} />}>Join Discord</Button>
          </div>
          <div className="heroMeta">
            <div className="heroMetaItem"><span className="heroMetaIcon"><IconShieldCheck size={18} /></span><span>Aktiv moderation<br /><strong>Fair & gennemsigtigt</strong></span></div>
            <div className="heroMetaItem"><span className="heroMetaIcon"><IconUsersGroup size={18} /></span><span>Community først<br /><strong>Din historie tæller</strong></span></div>
          </div>
        </div>
      </div>
      <div className="scrollCue"><span>Udforsk</span><span className="scrollLine" /></div>
    </section>
  );
}
