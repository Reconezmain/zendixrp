import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import type { Metadata } from 'next';
import { ColorSchemeScript, Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { hasAnyReviewerAccess } from '@/lib/application-permissions';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  applicationName: 'ZendixRP',
  openGraph: { type: 'website', locale: 'da_DK', siteName: 'ZendixRP', title: 'ZendixRP — Dansk FiveM Roleplay', description: 'Det officielle community-site for ZendixRP.' },
  title: { default: 'ZendixRP — Dansk FiveM Roleplay', template: '%s · ZendixRP' },
  description: 'Et ambitiøst dansk FiveM roleplay-community med plads til historier, fællesskab og karakterer, der bliver husket.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/images/zendix-logo.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const canAccessAdmin = user ? (user.role === 'ADMIN' || user.role === 'STAFF' || await hasAnyReviewerAccess(user)) : false;
  return (
    <html lang="da" suppressHydrationWarning>
      <head><ColorSchemeScript defaultColorScheme="dark" /></head>
      <body>
        <Providers>
          <SiteHeader user={user ? { username: user.username, avatar: user.avatar, role: user.role } : null} canAccessAdmin={canAccessAdmin} />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
