import { IconBrandDiscord, IconHeartFilled } from '@tabler/icons-react';
import Link from 'next/link';
import { DISCORD_INVITE } from '@/lib/constants';
import { Brand } from './Brand';

export function Footer() {
  return <footer className="footer">
    <div className="footerGrid">
      <div><Brand /><p>Dansk FiveM roleplay med plads til store idéer, stærke karakterer og historier, der varer ved.</p></div>
      <div><h4>Udforsk</h4><Link href="/opslag">Opslag</Link><Link href="/changelog">Changelog</Link><Link href="/regler">Regler</Link><Link href="/ansogninger">Ansøgninger</Link></div>
      <div><h4>Community</h4><Link href="/staff">Mød staff</Link><Link href="/status">Server status</Link><Link href="/kort">Live kort</Link><Link href="/privatliv">Privatliv</Link><a href={DISCORD_INVITE} target="_blank" rel="noreferrer"><IconBrandDiscord size={16} /> Discord</a></div>
    </div>
    <div className="footerBottom"><span>© {new Date().getFullYear()} ZendixRP</span><span>Lavet med <IconHeartFilled size={14} /> til ZyndixRP af recon_ez</span></div>
  </footer>;
}
