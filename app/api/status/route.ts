import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CfxPlayer = {
  id?: number;
  name?: string;
  ping?: number;
};

export async function GET() {
  const apiUrl = process.env.CFX_SERVER_API_URL || 'https://frontend.cfx-services.net/api/servers/single/ler3lr5';
  try {
    const response = await fetch(apiUrl, { next: { revalidate: 30 }, signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Cfx status unavailable');
    const payload = await response.json() as { EndPoint?: string; Data?: { hostname?: string; clients?: number; sv_maxclients?: number; svMaxclients?: number; lastSeen?: string; gametype?: string; mapname?: string; resources?: string[]; players?: CfxPlayer[] } };
    if (!payload.Data) throw new Error('Cfx status payload missing data');
    const lastSeen = payload.Data.lastSeen ? new Date(payload.Data.lastSeen).getTime() : Date.now();
    const online = Date.now() - lastSeen < 10 * 60 * 1000;
    const playersList=(payload.Data.players||[]).map((player: CfxPlayer)=>({id:Number(player.id||0),name:String(player.name||'Ukendt spiller').slice(0,80),ping:Number(player.ping||0)})).sort((a,b)=>a.name.localeCompare(b.name,'da'));
    return NextResponse.json({ online, players: Number(payload.Data.clients ?? playersList.length), maxPlayers: Number(payload.Data.sv_maxclients ?? payload.Data.svMaxclients ?? 0), name: payload.Data.hostname, joinCode: payload.EndPoint, gametype:payload.Data.gametype, mapName:payload.Data.mapname, resourceCount:payload.Data.resources?.length||0, playersList, configured: true });
  } catch {
    return NextResponse.json({ online: false, players: null, maxPlayers: null, configured: true });
  }
}
