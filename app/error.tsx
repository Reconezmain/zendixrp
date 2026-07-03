'use client';

import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Container size="sm" py={120}><Stack align="center" ta="center"><Text c="zendix" fw={700}>EN UVENTET FEJL</Text><Title>Byen ramte et bump</Title><Text c="dimmed">Prøv at indlæse siden igen. Hvis fejlen fortsætter, står staff klar på Discord.</Text><Button onClick={reset} leftSection={<IconRefresh size={17}/>}>Prøv igen</Button></Stack></Container>;
}
