'use client';

import { Avatar, Badge, Button, Checkbox, Group, Modal, NumberInput, Select, Stack, Tabs, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEdit, IconFileText, IconForms, IconHistory, IconListCheck, IconMap, IconPlus, IconShieldCheck, IconTrash, IconUsers } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { STAFF_GROUPS, STATUS_LABELS, type ApplicationQuestion, type PublicApplicationType } from '@/lib/constants';
import type { MapLocationData } from '@/lib/map';
import { ApplicationTypesAdmin } from '@/components/ApplicationTypesAdmin';
import { MapAdmin } from '@/components/MapAdmin';
import { ChangelogAdmin, type ChangelogData } from '@/components/ChangelogAdmin';
import { RulesAdmin, type RuleCategoryData } from '@/components/RulesAdmin';

type Post = { id:string; title:string; slug:string; category:string; excerpt:string; content:string; createdAt:string; author:{username:string} };
type Applicant = { id:string; username:string; avatar:string|null; discordId:string };
type Application = { id:string; type:string; status:keyof typeof STATUS_LABELS; adminNote:string|null; answers:Record<string,string>; createdAt:string; user:Applicant; applicationType?:{questions:ApplicationQuestion[]}|null };
type Staff = { id:string; name:string; rank:string; group:'OWNER'|'MANAGEMENT'|'DEVELOPER'|'ADMINISTRATOR'|'MODERATOR'|'SUPPORT'; avatar:string|null; discordTag:string; description:string; sortOrder:number; active:boolean };

export function AdminDashboard({ initialPosts, initialApplications, initialStaff, initialTypes, initialLocations, initialChangelog, initialRules, canManageContent, canReviewApplications }: { initialPosts:Post[]; initialApplications:Application[]; initialStaff:Staff[]; initialTypes:PublicApplicationType[]; initialLocations:MapLocationData[]; initialChangelog:ChangelogData[]; initialRules:RuleCategoryData[]; canManageContent:boolean; canReviewApplications:boolean }) {
  const [posts, setPosts] = useState(initialPosts);
  const [applications, setApplications] = useState(initialApplications);
  const [staff, setStaff] = useState(initialStaff);
  const [postOpen, setPostOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post|null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff|null>(null);
  const [editingApplication, setEditingApplication] = useState<Application|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{kind:'posts'|'staff'|'applications'; id:string; label:string}|null>(null);
  const [applicationFilter, setApplicationFilter] = useState<string|null>('ALL');

  const postForm = useForm({ initialValues:{ title:'', category:'Nyhed', excerpt:'', content:'' }, validate:{ title:(v)=>v.trim().length<5?'Mindst 5 tegn':null, excerpt:(v)=>v.trim().length<20?'Mindst 20 tegn':null, content:(v)=>v.trim().length<40?'Mindst 40 tegn':null } });
  const staffForm = useForm({ initialValues:{ name:'', rank:'', group:'SUPPORT' as Staff['group'], avatar:'', discordTag:'', description:'', sortOrder:0, active:true }, validate:{ name:(v)=>v.trim().length<2?'Angiv navn':null, description:(v)=>v.trim().length<20?'Mindst 20 tegn':null } });
  const applicationForm = useForm({ initialValues:{ status:'SENT', adminNote:'' } });

  const openPost = (post?:Post) => {
    setEditingPost(post || null);
    postForm.setValues(post ? { title:post.title, category:post.category, excerpt:post.excerpt, content:post.content } : { title:'', category:'Nyhed', excerpt:'', content:'' });
    postForm.clearErrors(); setPostOpen(true);
  };
  const openStaff = (member?:Staff) => {
    setEditingStaff(member || null);
    staffForm.setValues(member ? { name:member.name, rank:member.rank, group:member.group, avatar:member.avatar||'', discordTag:member.discordTag, description:member.description, sortOrder:member.sortOrder, active:member.active } : { name:'', rank:'', group:'SUPPORT', avatar:'', discordTag:'', description:'', sortOrder:0, active:true });
    staffForm.clearErrors(); setStaffOpen(true);
  };
  const openApplication = (application:Application) => {
    setEditingApplication(application);
    applicationForm.setValues({ status:application.status, adminNote:application.adminNote || '' });
    setApplicationOpen(true);
  };

  const savePost = postForm.onSubmit(async (values) => {
    const response = await fetch(editingPost ? `/api/posts/${editingPost.id}` : '/api/posts', { method:editingPost?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values) });
    const data = await response.json();
    if (!response.ok) return notifications.show({ color:'red', title:'Kunne ikke gemme', message:data.error || 'Prøv igen' });
    setPosts((current)=> editingPost ? current.map((item)=>item.id===data.id?data:item) : [data,...current]);
    setPostOpen(false); notifications.show({ color:'zendix', title:'Gemt', message:editingPost?'Opslaget er opdateret.':'Opslaget er udgivet.', icon:<IconCheck size={17}/> });
  });
  const saveStaff = staffForm.onSubmit(async (values) => {
    const response = await fetch(editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff', { method:editingStaff?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values) });
    const data = await response.json();
    if (!response.ok) return notifications.show({ color:'red', title:'Kunne ikke gemme', message:data.error || 'Prøv igen' });
    setStaff((current)=> (editingStaff ? current.map((item)=>item.id===data.id?data:item) : [...current,data]).sort((a,b)=>a.sortOrder-b.sortOrder));
    setStaffOpen(false); notifications.show({ color:'zendix', title:'Staff opdateret', message:`${data.name} er gemt.` });
  });
  const saveApplication = applicationForm.onSubmit(async (values) => {
    if (!editingApplication) return;
    const response = await fetch(`/api/applications/${editingApplication.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values) });
    const data = await response.json();
    if (!response.ok) return notifications.show({ color:'red', title:'Kunne ikke opdatere', message:data.error || 'Prøv igen' });
    setApplications((current)=>current.map((item)=>item.id===data.id?data:item)); setApplicationOpen(false);
    notifications.show({ color:'zendix', title:'Ansøgning opdateret', message:`Status er nu ${STATUS_LABELS[data.status as keyof typeof STATUS_LABELS].label.toLowerCase()}.` });
  });
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const response = await fetch(`/api/${deleteTarget.kind}/${deleteTarget.id}`, { method:'DELETE' });
    if (!response.ok) return notifications.show({ color:'red', title:'Kunne ikke slette', message:'Prøv igen.' });
    if (deleteTarget.kind==='posts') setPosts((current)=>current.filter((item)=>item.id!==deleteTarget.id));
    else if (deleteTarget.kind==='staff') setStaff((current)=>current.filter((item)=>item.id!==deleteTarget.id));
    else setApplications((current)=>current.filter((item)=>item.id!==deleteTarget.id));
    notifications.show({ color:'zendix', title:'Slettet', message:`${deleteTarget.label} er fjernet.` }); setDeleteTarget(null);
  };

  const filteredApplications = useMemo(()=>applicationFilter==='ALL'?applications:applications.filter((item)=>item.status===applicationFilter),[applications,applicationFilter]);
  const inReview = applications.filter((item)=>item.status==='SENT'||item.status==='IN_REVIEW').length;

  return <>
    <div className="adminStats">{canManageContent&&<div className="statCard"><span>Opslag</span><strong>{posts.length}</strong></div>}<div className="statCard"><span>Afventer svar</span><strong>{inReview}</strong></div><div className="statCard"><span>Godkendt</span><strong>{applications.filter((item)=>item.status==='APPROVED').length}</strong></div>{canManageContent&&<div className="statCard"><span>Aktiv staff</span><strong>{staff.filter((item)=>item.active).length}</strong></div>}</div>
    <Tabs defaultValue={canReviewApplications?'applications':'posts'} variant="pills">
      <Tabs.List mb="lg">{canReviewApplications&&<Tabs.Tab value="applications" leftSection={<IconFileText size={16}/>}>Ansøgninger <Badge ml={5} size="xs" circle>{inReview}</Badge></Tabs.Tab>}{canManageContent&&<><Tabs.Tab value="application-types" leftSection={<IconForms size={16}/>}>Ansøgningstyper</Tabs.Tab><Tabs.Tab value="posts" leftSection={<IconShieldCheck size={16}/>}>Opslag</Tabs.Tab><Tabs.Tab value="changelog" leftSection={<IconHistory size={16}/>}>Changelog</Tabs.Tab><Tabs.Tab value="rules" leftSection={<IconListCheck size={16}/>}>Regler</Tabs.Tab><Tabs.Tab value="staff" leftSection={<IconUsers size={16}/>}>Staff</Tabs.Tab><Tabs.Tab value="map" leftSection={<IconMap size={16}/>}>Kort</Tabs.Tab></>}</Tabs.List>

      <Tabs.Panel value="applications"><div className="adminPanel"><div className="adminPanelTop"><h2>Alle ansøgninger</h2><Select w={200} value={applicationFilter} onChange={setApplicationFilter} data={[{value:'ALL',label:'Alle statusser'},{value:'SENT',label:'Sendt'},{value:'IN_REVIEW',label:'Under behandling'},{value:'APPROVED',label:'Godkendt'},{value:'REJECTED',label:'Afvist'}]} /></div><div className="adminList">{filteredApplications.length?filteredApplications.map((application)=>{const status=STATUS_LABELS[application.status];return <div className="adminRow" key={application.id}><div className="adminRowTitle"><strong>{application.user.username}</strong><span>{application.type} · {new Intl.DateTimeFormat('da-DK',{dateStyle:'medium'}).format(new Date(application.createdAt))}</span></div><span>{application.type}</span><Badge color={status.color} variant="light">{status.label}</Badge><div className="adminActions"><Button size="xs" variant="light" onClick={()=>openApplication(application)}>Behandl</Button></div></div>}):<div className="emptyState">Ingen ansøgninger matcher filteret.</div>}</div></div></Tabs.Panel>

      <Tabs.Panel value="application-types"><ApplicationTypesAdmin initialTypes={initialTypes}/></Tabs.Panel>

      <Tabs.Panel value="posts"><div className="adminPanel"><div className="adminPanelTop"><h2>Opslag</h2><Button leftSection={<IconPlus size={16}/>} onClick={()=>openPost()}>Nyt opslag</Button></div><div className="adminList">{posts.map((post)=><div className="adminRow" key={post.id}><div className="adminRowTitle"><strong>{post.title}</strong><span>Af {post.author.username}</span></div><Badge variant="light">{post.category}</Badge><span>{new Intl.DateTimeFormat('da-DK',{dateStyle:'short'}).format(new Date(post.createdAt))}</span><div className="adminActions"><Button aria-label="Rediger" size="xs" variant="subtle" onClick={()=>openPost(post)}><IconEdit size={16}/></Button><Button aria-label="Slet" size="xs" variant="subtle" color="red" onClick={()=>setDeleteTarget({kind:'posts',id:post.id,label:post.title})}><IconTrash size={16}/></Button></div></div>)}</div></div></Tabs.Panel>

      <Tabs.Panel value="changelog"><ChangelogAdmin initialEntries={initialChangelog}/></Tabs.Panel>
      <Tabs.Panel value="rules"><RulesAdmin initialCategories={initialRules}/></Tabs.Panel>

      <Tabs.Panel value="staff"><div className="adminPanel"><div className="adminPanelTop"><h2>Staff team</h2><Button leftSection={<IconPlus size={16}/>} onClick={()=>openStaff()}>Tilføj staff</Button></div><div className="adminList">{staff.map((member)=>{const group=STAFF_GROUPS.find((item)=>item.value===member.group);return <div className="adminRow" key={member.id}><div className="adminRowTitle"><Group gap="sm"><Avatar src={member.avatar} color="zendix" size={34}>{member.name[0]}</Avatar><div><strong>{member.name}</strong><span>{member.discordTag}</span></div></Group></div><span>{member.rank}</span><Badge color={member.active?'green':'gray'} variant="light">{member.active ? group?.label || 'Staff' : 'Skjult'}</Badge><div className="adminActions"><Button aria-label="Rediger" size="xs" variant="subtle" onClick={()=>openStaff(member)}><IconEdit size={16}/></Button><Button aria-label="Slet" size="xs" variant="subtle" color="red" onClick={()=>setDeleteTarget({kind:'staff',id:member.id,label:member.name})}><IconTrash size={16}/></Button></div></div>})}</div></div></Tabs.Panel>

      <Tabs.Panel value="map"><MapAdmin initialLocations={initialLocations}/></Tabs.Panel>
    </Tabs>

    <Modal opened={postOpen} onClose={()=>setPostOpen(false)} title={editingPost?'Rediger opslag':'Opret opslag'} size="lg" centered><form onSubmit={savePost}><Stack><TextInput label="Titel" required {...postForm.getInputProps('title')}/><TextInput label="Kategori" required {...postForm.getInputProps('category')}/><Textarea label="Kort introduktion" minRows={2} required {...postForm.getInputProps('excerpt')}/><Textarea label="Indhold" minRows={9} autosize required {...postForm.getInputProps('content')}/><Group justify="flex-end"><Button variant="default" onClick={()=>setPostOpen(false)}>Annuller</Button><Button type="submit" loading={postForm.submitting}>{editingPost?'Gem ændringer':'Udgiv opslag'}</Button></Group></Stack></form></Modal>

    <Modal opened={staffOpen} onClose={()=>setStaffOpen(false)} title={editingStaff?'Rediger staff-medlem':'Tilføj staff-medlem'} size="lg" centered><form onSubmit={saveStaff}><Stack><Group grow><TextInput label="Navn" required {...staffForm.getInputProps('name')}/><TextInput label="Rank" required {...staffForm.getInputProps('rank')}/></Group><Select label="Staff-kategori" data={STAFF_GROUPS.map(({value,label})=>({value,label}))} allowDeselect={false} required {...staffForm.getInputProps('group')}/><TextInput label="Discord-tag" required {...staffForm.getInputProps('discordTag')}/><TextInput label="Avatar URL" placeholder="https://..." {...staffForm.getInputProps('avatar')}/><Textarea label="Beskrivelse" minRows={3} required {...staffForm.getInputProps('description')}/><Group align="end"><NumberInput label="Sortering" min={0} max={999} {...staffForm.getInputProps('sortOrder')}/><Checkbox label="Vis på Staff-siden" mb={10} {...staffForm.getInputProps('active',{type:'checkbox'})}/></Group><Group justify="flex-end"><Button variant="default" onClick={()=>setStaffOpen(false)}>Annuller</Button><Button type="submit" loading={staffForm.submitting}>Gem staff-medlem</Button></Group></Stack></form></Modal>

    <Modal opened={applicationOpen} onClose={()=>setApplicationOpen(false)} title={editingApplication?`${editingApplication.type} · ${editingApplication.user.username}`:'Ansøgning'} size="lg" centered>{editingApplication&&<form onSubmit={saveApplication}><Stack><Group><Avatar src={editingApplication.user.avatar} color="zendix"/><div><strong>{editingApplication.user.username}</strong><div className="mutedSmall">Discord ID: {editingApplication.user.discordId}</div></div></Group><div className="answersList">{Object.entries(editingApplication.answers).map(([key,value])=><div className="answerItem" key={key}><strong>{editingApplication.applicationType?.questions.find((question)=>question.id===key)?.label || {characterName:'Karakternavn',age:'Alder',experience:'Erfaring',motivation:'Motivation',scenario:'Scenarie'}[key] || key}</strong><p>{String(value)}</p></div>)}</div><Select label="Status" data={[{value:'SENT',label:'Sendt'},{value:'IN_REVIEW',label:'Under behandling'},{value:'APPROVED',label:'Godkendt'},{value:'REJECTED',label:'Afvist'}]} {...applicationForm.getInputProps('status')}/><Textarea label="Intern note / begrundelse" description="Vises også for ansøgeren i Mit Dashboard." minRows={4} {...applicationForm.getInputProps('adminNote')}/><Group justify="space-between"><Button color="red" variant="subtle" leftSection={<IconTrash size={16}/>} onClick={()=>{setApplicationOpen(false);setDeleteTarget({kind:'applications',id:editingApplication.id,label:`${editingApplication.type} fra ${editingApplication.user.username}`});}}>Slet ansøgning</Button><Group><Button variant="default" onClick={()=>setApplicationOpen(false)}>Annuller</Button><Button type="submit" loading={applicationForm.submitting}>Gem afgørelse</Button></Group></Group></Stack></form>}</Modal>

    <Modal opened={Boolean(deleteTarget)} onClose={()=>setDeleteTarget(null)} title="Bekræft sletning" centered size="sm"><p>Er du sikker på, at du vil slette <strong>{deleteTarget?.label}</strong>? Handlingen kan ikke fortrydes.</p><Group justify="flex-end" mt="xl"><Button variant="default" onClick={()=>setDeleteTarget(null)}>Annuller</Button><Button color="red" leftSection={<IconTrash size={16}/>} onClick={confirmDelete}>Slet permanent</Button></Group></Modal>
  </>;
}
