'use client';

import { Badge, Button, ScrollArea, Skeleton, TextInput } from '@mantine/core';
import { IconBrandDiscord, IconCopy, IconSearch, IconServer, IconUser, IconUsers } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { DISCORD_INVITE, SERVER_CONNECT } from '@/lib/constants';

type Status = { online: boolean; players: number | null; maxPlayers: number | null; name?: string; joinCode?: string; gametype?:string; mapName?:string; resourceCount?:number; playersList?:Array<{id:number;name:string;ping:number}>; configured: boolean };

export function ServerStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');

  useEffect(() => {
    fetch('/api/status').then((res) => res.json()).then(setStatus).catch(() => setStatus({ online: false, players: null, maxPlayers: null, configured: false }));
  }, []);

  const copyConnect = async () => {
    await navigator.clipboard.writeText(`connect ${SERVER_CONNECT}`);
    notifications.show({ title: 'Connect-adresse kopieret', message: 'Indsæt den direkte i FiveM-konsollen.', color: 'zendix' });
  };

  if (compact) {
    return (
      <div className="statusPanel">
        <div className="statusItem"><IconServer className="statusIcon" /><div><div className="statusItemLabel">Server</div>{status ? <div className={`statusItemValue ${status.online ? 'statusOnline' : 'statusOffline'}`}>{status.online ? 'Online' : status.configured ? 'Offline' : 'Klar til opsætning'}</div> : <Skeleton width={85} height={18} />}</div></div>
        <div className="statusItem"><IconUsers className="statusIcon" /><div><div className="statusItemLabel">Spillere online</div>{status ? <div className="statusItemValue">{status.players === null ? '—' : `${status.players} / ${status.maxPlayers ?? '?'}`}</div> : <Skeleton width={70} height={18} />}</div></div>
        <div className="statusItem"><IconBrandDiscord className="statusIcon" /><div><div className="statusItemLabel">Discord</div><div className="statusItemValue">Community åbent</div></div></div>
        <div className="statusItem"><Button onClick={copyConnect} variant="light" leftSection={<IconCopy size={16} />}>Kopiér connect</Button></div>
      </div>
    );
  }

  const filteredPlayers=(status?.playersList||[]).filter((player)=>player.name.toLowerCase().includes(playerQuery.toLowerCase()));
  return (<>
    <div className="statusHeroGrid">
      <div className="bigStatusCard">
        <div className="statusOrb"><IconServer size={31} /></div>
        {status ? <><div className="statusItemLabel">LIVE SERVERSTATUS</div><h2 className={status.online ? 'statusOnline' : 'statusOffline'}>{status.online ? 'Serveren er online' : status.configured ? 'Serveren er offline' : 'Status afventer opsætning'}</h2><p>{status.online ? `${status.players ?? 0} af ${status.maxPlayers ?? '?'} spillere er i byen lige nu.` : status.configured ? 'Vi er tilbage hurtigst muligt. Følg med på Discord.' : 'Tilføj FIVEM_SERVER_URL i miljøvariablerne for live-status.'}</p></> : <><Skeleton width="55%" height={38} mb="md" /><Skeleton width="75%" height={18} /></>}
      </div>
      <div className="statusSide">
        <div className="infoCard"><div className="infoCardTop"><IconServer /><h3>Forbind til byen</h3></div><p>Åbn FiveM, tryk F8 og brug join-linket herunder.</p><div className="connectCode">connect {SERVER_CONNECT}</div><Button fullWidth onClick={copyConnect} leftSection={<IconCopy size={16} />}>Kopiér connect-adresse</Button></div>
        <div className="infoCard"><div className="infoCardTop"><IconBrandDiscord /><h3>ZendixRP Discord</h3></div><p>Nyheder, support, community og direkte besked ved planlagt vedligehold.</p><Button component="a" href={DISCORD_INVITE} target="_blank" variant="light" fullWidth>Åbn Discord</Button></div>
      </div>
    </div>
    <section className="playersPanel"><div className="playersPanelHeader"><div><div className="statusItemLabel">LIVE FRA CFX</div><h2>Aktive spillere</h2><div className="serverInfoBadges"><Badge variant="light">{status?.gametype||'FiveM'}</Badge><Badge variant="light" color="gray">{status?.mapName||'San Andreas'}</Badge><Badge variant="light" color="gray">{status?.resourceCount||0} resources</Badge></div></div><TextInput value={playerQuery} onChange={(event)=>setPlayerQuery(event.currentTarget.value)} leftSection={<IconSearch size={16}/>} placeholder="Søg efter spiller..." w={280}/></div>{status ? <ScrollArea.Autosize mah={520}><div className="playersGrid">{filteredPlayers.map((player)=><div className="playerCard" key={`${player.id}-${player.name}`}><span className="playerAvatar"><IconUser size={17}/></span><span className="playerIdentity"><strong>{player.name}</strong><small>ID {player.id}</small></span><span className={`playerPing ${player.ping<80?'good':''}`}>{player.ping} ms</span></div>)}{!filteredPlayers.length&&<div className="playersEmpty">{status.online?'Ingen spillere matcher søgningen.':'Spillerlisten er ikke tilgængelig, mens serveren er offline.'}</div>}</div></ScrollArea.Autosize>:<div className="playersGrid">{Array.from({length:8}).map((_,index)=><Skeleton height={58} radius="md" key={index}/>)}</div>}</section>
  </>);
}
