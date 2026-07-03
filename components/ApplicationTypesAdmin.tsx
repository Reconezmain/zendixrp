'use client';

import { ActionIcon, Badge, Button, Checkbox, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { ApplicationQuestion, PublicApplicationType } from '@/lib/constants';

const newQuestion = (): ApplicationQuestion => ({
  id: `question_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  label: '',
  type: 'textarea',
  required: true,
  minLength: 30,
});

const emptyForm = () => ({
  name: '',
  description: '',
  category: 'Job',
  reviewerRoleIdsText: '',
  active: true,
  sortOrder: 0,
  questions: [newQuestion()],
});

export function ApplicationTypesAdmin({ initialTypes }: { initialTypes: PublicApplicationType[] }) {
  const [types, setTypes] = useState(initialTypes);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<PublicApplicationType | null>(null);
  const [deleting, setDeleting] = useState<PublicApplicationType | null>(null);
  const form = useForm({
    initialValues: emptyForm(),
    validate: {
      name: (value) => value.trim().length < 2 ? 'Angiv et navn' : null,
      description: (value) => value.trim().length < 10 ? 'Skriv mindst 10 tegn' : null,
    },
  });

  const open = (type?: PublicApplicationType) => {
    setEditing(type || null);
    form.setValues(type ? {
      name: type.name,
      description: type.description,
      category: type.category,
      reviewerRoleIdsText: type.reviewerRoleIds.join(', '),
      active: type.active,
      sortOrder: type.sortOrder,
      questions: type.questions,
    } : emptyForm());
    form.clearErrors();
    setOpened(true);
  };

  const save = form.onSubmit(async (values) => {
    if (values.questions.some((question) => question.label.trim().length < 3)) {
      return notifications.show({ color: 'red', title: 'Spørgsmål mangler', message: 'Alle spørgsmål skal have en tydelig tekst.' });
    }
    const { reviewerRoleIdsText, ...applicationType } = values;
    const reviewerRoleIds = reviewerRoleIdsText.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean);
    const response = await fetch(editing ? `/api/application-types/${editing.id}` : '/api/application-types', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...applicationType, reviewerRoleIds }),
    });
    const data = await response.json();
    if (!response.ok) return notifications.show({ color: 'red', title: 'Kunne ikke gemme', message: data.error || 'Prøv igen.' });
    setTypes((current) => (editing ? current.map((item) => item.id === data.id ? data : item) : [...current, data]).sort((a, b) => a.sortOrder - b.sortOrder));
    setOpened(false);
    notifications.show({ color: 'zendix', title: 'Ansøgningstype gemt', message: `${data.name} kan nu bruges på ansøgningssiden.` });
  });

  const remove = async () => {
    if (!deleting) return;
    const response = await fetch(`/api/application-types/${deleting.id}`, { method: 'DELETE' });
    if (!response.ok) return notifications.show({ color: 'red', title: 'Kunne ikke slette', message: 'Prøv igen.' });
    setTypes((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
  };

  return <>
    <div className="adminPanel">
      <div className="adminPanelTop">
        <div><h2>Ansøgningstyper</h2><small className="adminSubtitle">Opret jobs, spørgsmål og ansvarlige Discord-roller.</small></div>
        <Button leftSection={<IconPlus size={16}/>} onClick={() => open()}>Ny ansøgningstype</Button>
      </div>
      <div className="adminList">
        {types.map((type) => <div className="adminRow" key={type.id}>
          <div className="adminRowTitle"><strong>{type.name}</strong><span>{type.questions.length} spørgsmål · {type.category}</span></div>
          <Badge variant="light">{type.category}</Badge>
          <Badge color={type.reviewerRoleIds.length ? 'blue' : 'gray'} variant="light">{type.reviewerRoleIds.length} reviewer-roller</Badge>
          <Badge color={type.active ? 'green' : 'gray'} variant="light">{type.active ? 'Åben' : 'Lukket'}</Badge>
          <div className="adminActions">
            <Button aria-label="Rediger" size="xs" variant="subtle" onClick={() => open(type)}><IconEdit size={16}/></Button>
            <Button aria-label="Slet" size="xs" variant="subtle" color="red" onClick={() => setDeleting(type)}><IconTrash size={16}/></Button>
          </div>
        </div>)}
      </div>
    </div>

    <Modal opened={opened} onClose={() => setOpened(false)} title={editing ? 'Rediger ansøgningstype' : 'Opret ansøgningstype'} size="xl" centered>
      <form onSubmit={save}><Stack>
        <Group grow><TextInput label="Navn" placeholder="Fx Politi" required {...form.getInputProps('name')}/><TextInput label="Kategori" placeholder="Fx Job" required {...form.getInputProps('category')}/></Group>
        <Textarea label="Beskrivelse" minRows={2} required {...form.getInputProps('description')}/>
        <Textarea
          label="Discord-roller der må behandle ansøgninger"
          description="Indsæt rolle-ID’er adskilt med komma eller mellemrum. ADMIN har altid adgang."
          placeholder="123456789012345678, 987654321098765432"
          minRows={2}
          {...form.getInputProps('reviewerRoleIdsText')}
        />
        <Group align="end"><NumberInput label="Sortering" min={0} max={999} {...form.getInputProps('sortOrder')}/><Checkbox label="Åben for ansøgninger" mb={10} {...form.getInputProps('active', { type: 'checkbox' })}/></Group>
        <div className="questionBuilder">
          <div className="questionBuilderHeader"><strong>Spørgsmål</strong><Button type="button" size="xs" variant="light" leftSection={<IconPlus size={14}/>} onClick={() => form.insertListItem('questions', newQuestion())}>Tilføj spørgsmål</Button></div>
          {form.values.questions.map((question, index) => <div className="questionRow" key={question.id}>
            <TextInput className="questionLabel" label={`Spørgsmål ${index + 1}`} placeholder="Hvad vil du gerne vide?" required {...form.getInputProps(`questions.${index}.label`)}/>
            <Select label="Felttype" data={[{ value: 'text', label: 'Kort tekst' }, { value: 'textarea', label: 'Lang tekst' }]} {...form.getInputProps(`questions.${index}.type`)}/>
            <NumberInput label="Min. tegn" min={0} max={1000} {...form.getInputProps(`questions.${index}.minLength`)}/>
            <Checkbox label="Påkrævet" mt={29} {...form.getInputProps(`questions.${index}.required`, { type: 'checkbox' })}/>
            <ActionIcon aria-label="Fjern spørgsmål" color="red" variant="subtle" mt={25} disabled={form.values.questions.length === 1} onClick={() => form.removeListItem('questions', index)}><IconTrash size={17}/></ActionIcon>
          </div>)}
        </div>
        <Group justify="flex-end"><Button variant="default" onClick={() => setOpened(false)}>Annuller</Button><Button type="submit" loading={form.submitting}>Gem ansøgningstype</Button></Group>
      </Stack></form>
    </Modal>

    <Modal opened={Boolean(deleting)} onClose={() => setDeleting(null)} title="Slet ansøgningstype" centered size="sm">
      <p>Vil du slette <strong>{deleting?.name}</strong>? Allerede indsendte ansøgninger bevares.</p>
      <Group justify="flex-end" mt="xl"><Button variant="default" onClick={() => setDeleting(null)}>Annuller</Button><Button color="red" onClick={remove}>Slet</Button></Group>
    </Modal>
  </>;
}
