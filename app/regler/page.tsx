import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { PageHero } from '@/components/PageHero';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Regler' };

export default async function RulesPage() {
  const categories = await prisma.ruleCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { rules: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
  });

  return <>
    <PageHero eyebrow="Fælles rammer" title="Regler" text="Klare rammer giver mere frihed i spillet. Læs dem, forstå intentionen og hjælp os med at passe på oplevelsen."/>
    <section className="contentSection"><div className="sectionInner">
      <Alert mb="xl" icon={<IconInfoCircle/>} color="zendix" variant="light" title="Reglerne er et fælles ansvar">Reglerne opdateres løbende af staff. Ved tvivl er du altid velkommen til at spørge på Discord.</Alert>
      {categories.length ? <div className="rulesLayout">
        <nav className="rulesNav">{categories.map((category) => <a key={category.id} href={`#${category.slug}`}>{category.name}</a>)}</nav>
        <div className="rulesContent">{categories.map((category) => <section className="ruleCategory" id={category.slug} key={category.id}>
          <h2>{category.name}</h2>
          {category.description && <p className="ruleCategoryDescription">{category.description}</p>}
          <div className="ruleList">{category.rules.map((rule,index) => <div className="ruleItem" key={rule.id}>
            <span className="ruleNumber">{rule.code || String(index+1).padStart(2,'0')}</span>
            <span><strong>{rule.title}</strong>{rule.content}</span>
          </div>)}</div>
        </section>)}</div>
      </div> : <div className="emptyState">Staff er ved at opdatere regelsættet.</div>}
    </div></section>
  </>;
}
