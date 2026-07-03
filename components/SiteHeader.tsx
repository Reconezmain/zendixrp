'use client';

import { Avatar, Badge, Burger, Button, Drawer, Group, Menu, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconLayoutDashboard, IconLogin2, IconLogout, IconShield } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from './Brand';

type HeaderUser = { username: string; avatar: string | null; role: 'USER' | 'STAFF' | 'ADMIN' } | null;

const links = [
  { href: '/', label: 'Hjem' },
  { href: '/opslag', label: 'Opslag' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/status', label: 'Server status' },
  { href: '/kort', label: 'Kort' },
  { href: '/regler', label: 'Regler' },
  { href: '/ansogninger', label: 'Ansøg' },
  { href: '/staff', label: 'Staff' },
];

export function SiteHeader({ user, canAccessAdmin = false }: { user: HeaderUser; canAccessAdmin?: boolean }) {
  const [opened, { open, close }] = useDisclosure(false);
  const pathname = usePathname();
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  };

  const nav = (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href} onClick={close} className={`navLink ${pathname === link.href ? 'active' : ''}`}>
          {link.label}
        </Link>
      ))}
      {canAccessAdmin && (
        <Link href="/admin" onClick={close} className={`navLink adminLink ${pathname.startsWith('/admin') ? 'active' : ''}`}>
          <IconShield size={15} /> Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Brand />
        <nav className="desktopNav" aria-label="Primær navigation">{nav}</nav>
        <Group gap="sm" visibleFrom="md">
          {user ? (
            <Menu width={220} position="bottom-end">
              <Menu.Target>
                <button className="userMenuButton">
                  <Avatar src={user.avatar} size={32} radius="xl" color="zendix">{user.username.slice(0, 1)}</Avatar>
                  <span>{user.username}</span>
                  <IconChevronDown size={14} />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label><Badge variant="light" color="zendix">{user.role}</Badge></Menu.Label>
                <Menu.Item component={Link} href="/dashboard" leftSection={<IconLayoutDashboard size={16} />}>Mit dashboard</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={logout} color="red" leftSection={<IconLogout size={16} />}>Log ud</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button component="a" href="/api/auth/discord" leftSection={<IconLogin2 size={17} />}>Discord login</Button>
          )}
        </Group>
        <Burger opened={opened} onClick={open} hiddenFrom="md" aria-label="Åbn navigation" />
      </div>
      <Drawer opened={opened} onClose={close} title={<Brand />} position="right" size="xs" hiddenFrom="md">
        <Stack gap="xs" className="mobileNav">
          {nav}
          <div className="mobileNavDivider" />
          {user ? (
            <>
              <Group><Avatar src={user.avatar} color="zendix" /><div><strong>{user.username}</strong><div className="mutedSmall">{user.role}</div></div></Group>
              <Button component={Link} href="/dashboard" onClick={close} variant="light">Mit dashboard</Button>
              <Button onClick={logout} color="red" variant="subtle">Log ud</Button>
            </>
          ) : <Button component="a" href="/api/auth/discord">Discord login</Button>}
        </Stack>
      </Drawer>
    </header>
  );
}
