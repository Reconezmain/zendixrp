import { PageHero } from '@/components/PageHero';
import { ServerStatus } from '@/components/ServerStatus';

export const metadata = { title: 'Server status' };

export default function StatusPage() {
  return <><PageHero eyebrow="Live fra byen" title="Server status" text="Se om byen er åben, hvem der er online, og hop direkte ind i ZendixRP." /><section className="contentSection"><div className="sectionInner"><ServerStatus /></div></section></>;
}
