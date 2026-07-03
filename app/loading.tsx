import { Container, Skeleton, Stack } from '@mantine/core';

export default function Loading() {
  return <Container size="lg" py={100}><Stack gap="lg"><Skeleton height={50} width="55%"/><Skeleton height={20} width="80%"/><Skeleton height={220} radius="lg"/></Stack></Container>;
}
