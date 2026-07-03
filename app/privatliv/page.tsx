import { PageHero } from '@/components/PageHero';

export const metadata = { title: 'Privatliv' };

export default function PrivacyPage() {
  return <>
    <PageHero eyebrow="Dine oplysninger" title="Privatliv på ZendixRP" text="Her kan du se, hvilke oplysninger platformen bruger, og hvorfor de er nødvendige." />
    <section className="contentSection"><article className="articleWrap articleContent">
      <h2>Oplysninger vi gemmer</h2>
      <p>Ved Discord-login gemmer vi dit Discord-ID, visningsnavn, avatar og de Discord-roller, der bruges til adgangskontrol. Når du sender en ansøgning, gemmer vi dine svar, ansøgningstype, status og eventuelle noter fra staff.</p>
      <h2>Formål og adgang</h2>
      <p>Oplysningerne bruges kun til login, adgangsstyring, behandling af ansøgninger og drift af ZendixRP. Almindelige brugere kan kun se egne ansøgninger. Ansvarlige Discord-roller kan kun se de ansøgningstyper, de er tilknyttet, mens administratorer har fuld adgang.</p>
      <h2>Cookies</h2>
      <p>Platformen bruger en nødvendig, HttpOnly login-cookie. Den kan ikke læses af JavaScript og bruges kun til at holde dig sikkert logget ind. Vi bruger ikke annoncerings- eller trackingcookies.</p>
      <h2>Sletning og spørgsmål</h2>
      <p>Afsluttede ansøgninger kan slettes fra Mit Dashboard, og staff kan slette ansøgninger administrativt. Hvis du ønsker hjælp til indsigt eller sletning af din konto, skal du kontakte ZendixRP-ledelsen via den officielle Discord.</p>
    </article></section>
  </>;
}
