'use client';

import { Badge, Button, Group, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconFileText, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { STATUS_LABELS } from '@/lib/constants';

type DashboardApplication={id:string;type:string;status:keyof typeof STATUS_LABELS;adminNote:string|null;createdAt:string};

export function DashboardApplications({initialApplications}:{initialApplications:DashboardApplication[]}){
  const[applications,setApplications]=useState(initialApplications);const[deleting,setDeleting]=useState<DashboardApplication|null>(null);
  const remove=async()=>{if(!deleting)return;const response=await fetch(`/api/applications/${deleting.id}`,{method:'DELETE'});const data=await response.json().catch(()=>({}));if(!response.ok)return notifications.show({color:'red',title:'Kunne ikke slette',message:data.error||'Prøv igen.'});setApplications((current)=>current.filter((item)=>item.id!==deleting.id));setDeleting(null);notifications.show({color:'zendix',title:'Ansøgning slettet',message:'Den gamle ansøgning er fjernet permanent.'});};
  return <>{applications.length?<div className="applicationCards">{applications.map((application)=>{const status=STATUS_LABELS[application.status];const closed=application.status==='APPROVED'||application.status==='REJECTED';return <div className="applicationCard" key={application.id}><div><h3>{application.type}-ansøgning</h3><div className="applicationMeta"><span><IconCalendar size={14}/> {new Intl.DateTimeFormat('da-DK',{dateStyle:'long'}).format(new Date(application.createdAt))}</span><span><IconFileText size={14}/> #{application.id.slice(-6).toUpperCase()}</span></div></div><Group><Badge color={status.color} size="lg" variant="light">{status.label}</Badge>{closed&&<Button size="xs" color="red" variant="subtle" aria-label="Slet gammel ansøgning" onClick={()=>setDeleting(application)}><IconTrash size={16}/></Button>}</Group>{application.adminNote&&<div className="noteBox"><strong>Note fra staff:</strong> {application.adminNote}</div>}</div>})}</div>:<div className="emptyState"><IconFileText size={38} stroke={1.4}/><h3>Ingen ansøgninger endnu</h3><p>Din første historie starter med et par gode svar.</p></div>}<Modal opened={Boolean(deleting)} onClose={()=>setDeleting(null)} title="Slet gammel ansøgning" centered size="sm"><p>Vil du permanent slette din afsluttede <strong>{deleting?.type}-ansøgning</strong>?</p><Group justify="flex-end"><Button variant="default" onClick={()=>setDeleting(null)}>Annuller</Button><Button color="red" leftSection={<IconTrash size={16}/>} onClick={remove}>Slet permanent</Button></Group></Modal></>;
}
