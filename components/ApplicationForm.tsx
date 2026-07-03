'use client';

import { Alert, Badge, Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconArrowRight, IconSend } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { PublicApplicationType } from '@/lib/constants';

function emptyAnswers(type: PublicApplicationType) {
  return Object.fromEntries(type.questions.map((question) => [question.id, '']));
}

export function ApplicationForm({ types }: { types: PublicApplicationType[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const firstType = types[0];
  const form = useForm({ initialValues: { typeId: firstType.id, answers: emptyAnswers(firstType) } });
  const selectedType = useMemo(() => types.find((item) => item.id === form.values.typeId) || firstType, [types, form.values.typeId, firstType]);

  const chooseType = (type: PublicApplicationType) => {
    form.setValues({ typeId: type.id, answers: emptyAnswers(type) });
    form.clearErrors();
    setError('');
  };

  const submit = form.onSubmit(async (values) => {
    const errors: Record<string, string> = {};
    for (const question of selectedType.questions) {
      const value = values.answers[question.id]?.trim() || '';
      if (question.required && value.length < question.minLength) errors[`answers.${question.id}`] = `Skriv mindst ${question.minLength} tegn`;
    }
    if (Object.keys(errors).length) { form.setErrors(errors); return; }

    setError('');
    const response = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || 'Ansøgningen kunne ikke sendes. Prøv igen.'); return; }
    notifications.show({ title: 'Ansøgning sendt', message: 'Du kan nu følge den i dit dashboard.', color: 'zendix', icon: <IconSend size={18} /> });
    router.push('/dashboard?sent=1');
    router.refresh();
  });

  return <div className="applicationLayout">
    <div className="typeList">{types.map((item) => <button type="button" onClick={() => chooseType(item)} key={item.id} className={`typeOption ${selectedType.id === item.id ? 'active' : ''}`}><Badge size="xs" variant="light" mb={7}>{item.category}</Badge><strong>{item.name}</strong><span>{item.description}</span></button>)}</div>
    <form className="formCard" onSubmit={submit}>
      <div className="formCardHeader"><Badge variant="light" mb="sm">{selectedType.category}</Badge><h2>{selectedType.name}-ansøgning</h2><p>{selectedType.description}</p></div>
      <Stack gap="lg">
        {error && <Alert color="red" icon={<IconAlertCircle />} title="Noget gik galt">{error}</Alert>}
        {selectedType.questions.map((question) => question.type === 'textarea' ? <Textarea key={question.id} label={question.label} description={question.description} minRows={4} autosize required={question.required} {...form.getInputProps(`answers.${question.id}`)} /> : <TextInput key={question.id} label={question.label} description={question.description} required={question.required} {...form.getInputProps(`answers.${question.id}`)} />)}
        <Group justify="space-between" mt="sm"><small style={{color:'var(--muted)'}}>Ved afsendelse accepterer du vores regler og behandling af ansøgningen.</small><Button type="submit" loading={form.submitting} rightSection={<IconArrowRight size={17} />}>Send ansøgning</Button></Group>
      </Stack>
    </form>
  </div>;
}
