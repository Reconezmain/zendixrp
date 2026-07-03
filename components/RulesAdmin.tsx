'use client';

import { ActionIcon, Badge, Button, Checkbox, Group, Modal, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

type RuleData = { id?:string; code?:string|null; title:string; content:string; sortOrder:number; active:boolean };
export type RuleCategoryData = { id:string; name:string; slug:string; description:string|null; sortOrder:number; active:boolean; rules:RuleData[] };
const newRule = ():RuleData => ({ code:'', title:'', content:'', sortOrder:0, active:true });

export function RulesAdmin({ initialCategories }:{ initialCategories:RuleCategoryData[] }) {
  const [categories,setCategories] = useState(initialCategories);
  const [opened,setOpened] = useState(false);
  const [editing,setEditing] = useState<RuleCategoryData|null>(null);
  const [deleting,setDeleting] = useState<RuleCategoryData|null>(null);
  const form = useForm({ initialValues:{name:'',description:'',sortOrder:0,active:true,rules:[newRule()]}, validate:{name:(value)=>value.trim().length<3?'Mindst 3 tegn':null} });

  const open = (category?:RuleCategoryData) => {
    setEditing(category||null);
    form.setValues(category ? { name:category.name, description:category.description||'', sortOrder:category.sortOrder, active:category.active, rules:category.rules } : { name:'', description:'', sortOrder:0, active:true, rules:[newRule()] });
    form.clearErrors(); setOpened(true);
  };

  const save = form.onSubmit(async(values) => {
    if(values.rules.some((rule)=>rule.title.trim().length<2||rule.content.trim().length<10)) return notifications.show({color:'red',title:'Ufuldstændig regel',message:'Alle regler skal have titel og mindst 10 tegns indhold.'});
    const response = await fetch(editing?`/api/rules/${editing.id}`:'/api/rules',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
    const data = await response.json();
    if(!response.ok) return notifications.show({color:'red',title:'Kunne ikke gemme',message:data.error||'Prøv igen.'});
    setCategories((current)=>(editing?current.map((item)=>item.id===data.id?data:item):[...current,data]).sort((a,b)=>a.sortOrder-b.sortOrder));
    setOpened(false); notifications.show({color:'zendix',title:'Regler gemt',message:`${data.name} er opdateret.`});
  });

  const remove = async() => {
    if(!deleting)return;
    const response=await fetch(`/api/rules/${deleting.id}`,{method:'DELETE'});
    if(!response.ok)return notifications.show({color:'red',title:'Kunne ikke slette',message:'Prøv igen.'});
    setCategories((current)=>current.filter((item)=>item.id!==deleting.id)); setDeleting(null);
  };

  return <>
    <div className="adminPanel">
      <div className="adminPanelTop"><div><h2>Regler</h2><small className="adminSubtitle">Opret kategorier og rediger hver enkelt regel.</small></div><Button leftSection={<IconPlus size={16}/>} onClick={()=>open()}>Ny kategori</Button></div>
      <div className="adminList">{categories.map((category)=><div className="adminRow" key={category.id}>
        <div className="adminRowTitle"><strong>{category.name}</strong><span>{category.rules.length} regler</span></div>
        <Badge variant="light">{category.rules.filter((rule)=>rule.active).length} aktive</Badge>
        <Badge color={category.active?'green':'gray'} variant="light">{category.active?'Synlig':'Skjult'}</Badge>
        <div className="adminActions"><Button size="xs" variant="subtle" onClick={()=>open(category)}><IconEdit size={16}/></Button><Button size="xs" variant="subtle" color="red" onClick={()=>setDeleting(category)}><IconTrash size={16}/></Button></div>
      </div>)}</div>
    </div>

    <Modal opened={opened} onClose={()=>setOpened(false)} title={editing?'Rediger regelkategori':'Ny regelkategori'} size="xl" centered>
      <form onSubmit={save}><Stack>
        <Group grow><TextInput label="Kategorinavn" required {...form.getInputProps('name')}/><NumberInput label="Sortering" min={0} max={999} {...form.getInputProps('sortOrder')}/></Group>
        <Textarea label="Beskrivelse" minRows={2} {...form.getInputProps('description')}/>
        <Checkbox label="Vis kategorien på regelsiden" {...form.getInputProps('active',{type:'checkbox'})}/>
        <div className="questionBuilder">
          <div className="questionBuilderHeader"><strong>Regler i kategorien</strong><Button type="button" size="xs" variant="light" leftSection={<IconPlus size={14}/>} onClick={()=>form.insertListItem('rules',{...newRule(),sortOrder:form.values.rules.length+1})}>Tilføj regel</Button></div>
          {form.values.rules.map((rule,index)=><div className="ruleEditorRow" key={rule.id||index}>
            <div className="ruleEditorFields">
              <Group grow><TextInput label="Regelnr." placeholder="Fx 6.9.1" {...form.getInputProps(`rules.${index}.code`)}/><TextInput label={`Titel ${index+1}`} required {...form.getInputProps(`rules.${index}.title`)}/></Group>
              <Textarea label="Regeltekst" minRows={3} autosize required {...form.getInputProps(`rules.${index}.content`)}/>
              <Group><NumberInput label="Sortering" min={0} max={999} {...form.getInputProps(`rules.${index}.sortOrder`)}/><Checkbox label="Aktiv" mt={28} {...form.getInputProps(`rules.${index}.active`,{type:'checkbox'})}/></Group>
            </div>
            <ActionIcon color="red" variant="subtle" aria-label="Slet regel" disabled={form.values.rules.length===1} onClick={()=>form.removeListItem('rules',index)}><IconTrash size={17}/></ActionIcon>
          </div>)}
        </div>
        <Group justify="flex-end"><Button variant="default" onClick={()=>setOpened(false)}>Annuller</Button><Button type="submit" loading={form.submitting}>Gem regler</Button></Group>
      </Stack></form>
    </Modal>

    <Modal opened={Boolean(deleting)} onClose={()=>setDeleting(null)} title="Slet regelkategori" centered size="sm"><p>Vil du slette <strong>{deleting?.name}</strong> og alle regler i kategorien?</p><Group justify="flex-end"><Button variant="default" onClick={()=>setDeleting(null)}>Annuller</Button><Button color="red" onClick={remove}>Slet</Button></Group></Modal>
  </>;
}
