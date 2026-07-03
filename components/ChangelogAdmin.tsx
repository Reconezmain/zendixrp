'use client';

import { Badge, Button, Checkbox, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

export type ChangelogData = { id:string; version:string; title:string; summary:string; changes:string[]; published:boolean; createdAt:string; author:{username:string} };

export function ChangelogAdmin({ initialEntries }: { initialEntries: ChangelogData[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<ChangelogData|null>(null);
  const [deleting, setDeleting] = useState<ChangelogData|null>(null);
  const form = useForm({ initialValues:{version:'',title:'',summary:'',changesText:'',published:true}, validate:{version:(v)=>v.trim()?'': 'Angiv version',title:(v)=>v.trim().length<4?'Mindst 4 tegn':null,summary:(v)=>v.trim().length<15?'Mindst 15 tegn':null,changesText:(v)=>v.split('\n').filter(Boolean).length?'':'Tilføj mindst én ændring'} });

  const open = (entry?:ChangelogData) => { setEditing(entry||null); form.setValues(entry?{version:entry.version,title:entry.title,summary:entry.summary,changesText:entry.changes.join('\n'),published:entry.published}:{version:'',title:'',summary:'',changesText:'',published:true}); form.clearErrors(); setOpened(true); };
  const save = form.onSubmit(async (values) => {
    const payload={version:values.version,title:values.title,summary:values.summary,changes:values.changesText.split('\n').map((line)=>line.trim()).filter(Boolean),published:values.published};
    const response=await fetch(editing?`/api/changelog/${editing.id}`:'/api/changelog',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const data=await response.json();
    if(!response.ok)return notifications.show({color:'red',title:'Kunne ikke gemme',message:data.error||'Prøv igen.'});
    setEntries((current)=>editing?current.map((item)=>item.id===data.id?data:item):[data,...current]); setOpened(false); notifications.show({color:'zendix',title:'Changelog gemt',message:`Version ${data.version} er gemt.`});
  });
  const remove=async()=>{if(!deleting)return;const response=await fetch(`/api/changelog/${deleting.id}`,{method:'DELETE'});if(!response.ok)return notifications.show({color:'red',title:'Kunne ikke slette',message:'Prøv igen.'});setEntries((current)=>current.filter((item)=>item.id!==deleting.id));setDeleting(null);};

  return <><div className="adminPanel"><div className="adminPanelTop"><div><h2>Changelog</h2><small className="adminSubtitle">Fortæl communityet om nye features og rettelser.</small></div><Button leftSection={<IconPlus size={16}/>} onClick={()=>open()}>Ny version</Button></div><div className="adminList">{entries.map((entry)=><div className="adminRow" key={entry.id}><div className="adminRowTitle"><strong>{entry.title}</strong><span>Version {entry.version} · {entry.changes.length} ændringer</span></div><Badge variant="light">v{entry.version}</Badge><Badge color={entry.published?'green':'gray'} variant="light">{entry.published?'Udgivet':'Kladde'}</Badge><div className="adminActions"><Button size="xs" variant="subtle" onClick={()=>open(entry)}><IconEdit size={16}/></Button><Button size="xs" variant="subtle" color="red" onClick={()=>setDeleting(entry)}><IconTrash size={16}/></Button></div></div>)}</div></div><Modal opened={opened} onClose={()=>setOpened(false)} title={editing?'Rediger changelog':'Ny changelog-version'} size="lg" centered><form onSubmit={save}><Stack><Group grow><TextInput label="Version" placeholder="Fx 1.3.0" required {...form.getInputProps('version')}/><TextInput label="Titel" required {...form.getInputProps('title')}/></Group><Textarea label="Kort opsummering" minRows={2} required {...form.getInputProps('summary')}/><Textarea label="Ændringer" description="Skriv én ændring pr. linje." minRows={7} required {...form.getInputProps('changesText')}/><Checkbox label="Udgiv på changelog-siden" {...form.getInputProps('published',{type:'checkbox'})}/><Group justify="flex-end"><Button variant="default" onClick={()=>setOpened(false)}>Annuller</Button><Button type="submit" loading={form.submitting}>Gem changelog</Button></Group></Stack></form></Modal><Modal opened={Boolean(deleting)} onClose={()=>setDeleting(null)} title="Slet changelog" centered size="sm"><p>Vil du slette version <strong>{deleting?.version}</strong>?</p><Group justify="flex-end"><Button variant="default" onClick={()=>setDeleting(null)}>Annuller</Button><Button color="red" onClick={remove}>Slet</Button></Group></Modal></>;
}
