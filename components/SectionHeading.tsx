import { Badge, Text, Title } from '@mantine/core';

export function SectionHeading({ eyebrow, title, text, center = false }: { eyebrow: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`sectionHeading ${center ? 'center' : ''}`}>
      <Badge variant="light" color="zendix" size="lg">{eyebrow}</Badge>
      <Title order={2}>{title}</Title>
      {text && <Text c="dimmed" size="lg">{text}</Text>}
    </div>
  );
}
