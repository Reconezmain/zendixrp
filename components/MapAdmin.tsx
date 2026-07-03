'use client';

import { Badge, Button, Checkbox, ColorInput, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconMapPin, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { MAP_CATEGORIES } from '@/lib/constants';
import type { MapLocationData } from '@/lib/map';

export function MapAdmin({ initialLocations }: { initialLocations: MapLocationData[] }) {
  const [locations, setLocations] = useState(initialLocations);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<MapLocationData | null>(null);
  const [deleting, setDeleting] = useState<MapLocationData | null>(null);
  const form = useForm({ initialValues: { title: '', description: '', category: 'Andet', icon: 'pin', color: '#2fdf82', x: 0, y: 0, active: true, sortOrder: 0 }, validate: { title: (value) => value.trim().length < 2 ? 'Angiv et navn' : null, description: (value) => value.trim().length < 5 ? 'Skriv en kort beskrivelse' : null } });

  const open = (location?: MapLocationData) => {
    setEditing(location || null);
    form.setValues(location ? { title: location.title, description: location.description, category: location.category, icon: location.icon, color: location.color, x: location.x, y: location.y, active: location.active, sortOrder: location.sortOrder } : { title: '', description: '', category: 'Andet', icon: 'pin', color: '#2fdf82', x: 0, y: 0, active: true, sortOrder: 0 });
    form.clearErrors(); setOpened(true);
  };

  const save = form.onSubmit(async (values) => {
    const response = await fetch(editing ? `/api/map-locations/${editing.id}` : '/api/map-locations', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const data = await response.json();
    if (!response.ok) return notifications.show({ color: 'red', title: 'Kunne ikke gemme', message: data.error || 'Prøv igen.' });
    setLocations((current) => (editing ? current.map((item) => item.id === data.id ? data : item) : [...current, data]).sort((a, b) => a.sortOrder - b.sortOrder));
    setOpened(false); notifications.show({ color: 'zendix', title: 'Kortet er opdateret', message: `${data.title} er nu gemt.` });
  });

  const remove = async () => {
    if (!deleting) return;
    const response = await fetch(`/api/map-locations/${deleting.id}`, { method: 'DELETE' });
    if (!response.ok) return notifications.show({ color: 'red', title: 'Kunne ikke slette', message: 'Prøv igen.' });
    setLocations((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null);
  };

  return <>
    <div className="adminPanel"><div className="adminPanelTop"><div><h2>Kortlokationer</h2><small className="adminSubtitle">Brug X/Y direkte fra FiveM. Kortet opdateres automatisk for besøgende.</small></div><Button leftSection={<IconPlus size={16}/>} onClick={() => open()}>Ny lokation</Button></div><div className="adminList">{locations.map((location) => <div className="adminRow" key={location.id}><div className="adminRowTitle"><Group gap="sm"><span className="adminMapDot" style={{color:location.color,background:`${location.color}18`}}><IconMapPin size={16}/></span><div><strong>{location.title}</strong><span>X {location.x.toFixed(1)} · Y {location.y.toFixed(1)}</span></div></Group></div><Badge variant="light">{location.category}</Badge><Badge color={location.active ? 'green' : 'gray'} variant="light">{location.active ? 'Synlig' : 'Skjult'}</Badge><div className="adminActions"><Button aria-label="Rediger" size="xs" variant="subtle" onClick={() => open(location)}><IconEdit size={16}/></Button><Button aria-label="Slet" size="xs" variant="subtle" color="red" onClick={() => setDeleting(location)}><IconTrash size={16}/></Button></div></div>)}</div></div>

    <Modal opened={opened} onClose={() => setOpened(false)} title={editing ? 'Rediger kortlokation' : 'Tilføj kortlokation'} size="lg" centered><form onSubmit={save}><Stack><TextInput label="Navn" placeholder="Fx Mission Row PD" required {...form.getInputProps('title')}/><Textarea label="Beskrivelse" minRows={2} required {...form.getInputProps('description')}/><Group grow><Select label="Kategori" data={MAP_CATEGORIES} searchable allowDeselect={false} {...form.getInputProps('category')}/><Select label="Ikon" data={[{value:'pin',label:'Kortnål'},{value:'shield',label:'Myndighed'},{value:'medical',label:'Hospital'},{value:'star',label:'Stjerne'},{value:'wrench',label:'Værksted'},{value:'briefcase',label:'Job'},{value:'garage',label:'Garage'},{value:'home',label:'Bolig'}]} {...form.getInputProps('icon')}/></Group><Group grow><NumberInput label="GTA X-koordinat" decimalScale={2} min={-10000} max={10000} required {...form.getInputProps('x')}/><NumberInput label="GTA Y-koordinat" decimalScale={2} min={-10000} max={12000} required {...form.getInputProps('y')}/></Group><Group align="end"><ColorInput label="Markørfarve" format="hex" {...form.getInputProps('color')}/><NumberInput label="Sortering" min={0} max={999} {...form.getInputProps('sortOrder')}/><Checkbox label="Vis på kortet" mb={10} {...form.getInputProps('active', { type: 'checkbox' })}/></Group><Group justify="flex-end"><Button variant="default" onClick={() => setOpened(false)}>Annuller</Button><Button type="submit" loading={form.submitting}>Gem lokation</Button></Group></Stack></form></Modal>

    <Modal opened={Boolean(deleting)} onClose={() => setDeleting(null)} title="Slet kortlokation" centered size="sm"><p>Vil du fjerne <strong>{deleting?.title}</strong> fra kortet?</p><Group justify="flex-end" mt="xl"><Button variant="default" onClick={() => setDeleting(null)}>Annuller</Button><Button color="red" onClick={remove}>Slet</Button></Group></Modal>
  </>;
}
