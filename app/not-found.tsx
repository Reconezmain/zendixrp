import { Button, Container, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

export default function NotFound() {
  return <Container size="sm" py={120}><Stack align="center" ta="center"><Text c="zendix" fw={800} fz={64}>404</Text><Title>Den vej findes ikke i byen</Title><Text c="dimmed">Siden er flyttet, slettet eller har aldrig eksisteret.</Text><Button component={Link} href="/">Tilbage til forsiden</Button></Stack></Container>;
}
