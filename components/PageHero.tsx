import { Badge, Container, Text, Title } from '@mantine/core';

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="pageHero">
      <div className="heroGlow one" /><div className="heroGlow two" />
      <Container size="lg" className="pageHeroInner">
        <Badge variant="light" color="zendix" size="lg">{eyebrow}</Badge>
        <Title>{title}</Title>
        <Text>{text}</Text>
      </Container>
    </section>
  );
}
