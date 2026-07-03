import { Alert, Button } from '@mantine/core';
import { IconAlertCircle, IconBrandDiscord } from '@tabler/icons-react';
import { PageHero } from '@/components/PageHero';
import { ApplicationForm } from '@/components/ApplicationForm';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApplicationQuestion, PublicApplicationType } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ansøgninger' };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const [user, params, rawTypes] = await Promise.all([
    getCurrentUser(),
    searchParams,
    prisma.applicationType.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        questions: true,
        active: true,
        sortOrder: true,
      },
    }),
  ]);

  const types = rawTypes.map((type) => ({
    ...type,
    questions: type.questions as ApplicationQuestion[],
  })) as PublicApplicationType[];

  return (
    <>
      <PageHero
        eyebrow="Dit næste kapitel"
        title="Ansøg til ZendixRP"
        text="Fortæl os, hvem du vil være i byen. Gode idéer og lysten til at skabe med andre vægter højere end mange timers erfaring."
      />

      <section className="contentSection">
        <div className="sectionInner">
          {params.authError && (
            <Alert mb="xl" color="red" icon={<IconAlertCircle />} title="Discord-login kunne ikke gennemføres">
              {params.authError === 'config'
                ? 'Discord OAuth mangler at blive konfigureret. Se README og .env.example.'
                : 'Prøv login igen. Hvis problemet fortsætter, kan staff hjælpe på Discord.'}
            </Alert>
          )}

          {user ? (
            types.length ? (
              <ApplicationForm types={types} />
            ) : (
              <div className="emptyState">
                <h3>Ingen åbne ansøgninger</h3>
                <p>Staff har ikke åbnet nogen ansøgningstyper endnu.</p>
              </div>
            )
          ) : (
            <div className="authGate">
              <div className="authGateIcon">
                <IconBrandDiscord size={34} />
              </div>
              <h2>Log ind for at ansøge</h2>
              <p>
                Vi bruger Discord til at knytte ansøgningen sikkert til dig. Vi får kun adgang til dit ID, navn,
                profilbillede og dine roller på ZendixRP-serveren.
              </p>
              <Button component="a" href="/api/auth/discord" size="lg" color="indigo" leftSection={<IconBrandDiscord size={20} />}>
                Fortsæt med Discord
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
