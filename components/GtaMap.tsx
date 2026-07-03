'use client';

import { Badge, Button, SegmentedControl, TextInput } from '@mantine/core';
import { IconMapPin, IconSearch } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import {
  gtaToLeaflet,
  GTA_CRS_CONFIG,
  GTA_MAP_BOUNDS,
  GTA_MAP_CENTER,
  GTA_MAP_DEFAULT_ZOOM,
  MAP_TILE_URLS,
  type MapLocationData,
} from '@/lib/map';

const iconSymbols: Record<string, string> = { pin: '●', shield: '◆', medical: '+', star: '★', wrench: '⚒', briefcase: '▣', garage: 'P', home: '⌂' };

export function GtaMap({ initialLocations }: { initialLocations: MapLocationData[] }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const [locations, setLocations] = useState(initialLocations);
  const [category, setCategory] = useState('Alle');
  const [query, setQuery] = useState('');
  const [layer, setLayer] = useState('atlas');
  const [mapReady, setMapReady] = useState(false);

  const categories = useMemo(() => ['Alle', ...Array.from(new Set(locations.map((item) => item.category)))], [locations]);
  const visible = useMemo(() => locations.filter((item) => (category === 'Alle' || item.category === category) && `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [locations, category, query]);

  useEffect(() => {
    const interval = window.setInterval(() => fetch('/api/map-locations').then((response) => response.ok ? response.json() : null).then((data) => data && setLocations(data)).catch(() => null), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapNode.current || map.current) return;
    let cancelled = false;
    const markerStore = markers.current;
    void import('leaflet').then((L) => {
      if (cancelled || !mapNode.current) return;
      const gtaCrs = Object.assign({}, L.CRS.Simple, {
        projection: L.Projection.LonLat,
        scale: (zoom: number) => 2 ** zoom,
        zoom: (scale: number) => Math.log(scale) / Math.LN2,
        distance: (first: L.LatLng, second: L.LatLng) => Math.hypot(second.lng - first.lng, second.lat - first.lat),
        transformation: new L.Transformation(
          GTA_CRS_CONFIG.scaleX,
          GTA_CRS_CONFIG.centerX,
          -GTA_CRS_CONFIG.scaleY,
          GTA_CRS_CONFIG.centerY,
        ),
        infinite: true,
      });
      const bounds = L.latLngBounds(GTA_MAP_BOUNDS);
      const instance = L.map(mapNode.current, {
        crs: gtaCrs,
        center: GTA_MAP_CENTER,
        zoom: GTA_MAP_DEFAULT_ZOOM,
        minZoom: 1,
        maxZoom: 5,
        zoomControl: true,
        attributionControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
      });
      L.tileLayer(MAP_TILE_URLS.atlas, { minZoom: 1, maxZoom: 5, noWrap: true, bounds, errorTileUrl: '/images/map-tile-fallback.svg' }).addTo(instance);
      map.current = instance;
      setMapReady(true);
      window.setTimeout(() => instance.invalidateSize(), 50);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; markerStore.clear(); };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !map.current) return;
      map.current.eachLayer((item) => { if (item instanceof L.TileLayer) map.current?.removeLayer(item); });
      const bounds = L.latLngBounds(GTA_MAP_BOUNDS);
      L.tileLayer(layer === 'atlas' ? MAP_TILE_URLS.atlas : MAP_TILE_URLS.satellite, { minZoom: 1, maxZoom: 5, noWrap: true, bounds, errorTileUrl: '/images/map-tile-fallback.svg' }).addTo(map.current);
    });
    return () => { cancelled = true; };
  }, [layer, mapReady]);

  useEffect(() => {
    if (!map.current) return;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !map.current) return;
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      visible.forEach((location) => {
        const symbol = iconSymbols[location.icon] || iconSymbols.pin;
        const icon = L.divIcon({ className: 'zendixMapMarkerWrap', html: `<span class="zendixMapMarker" style="--marker-color:${location.color}"><i>${symbol}</i></span>`, iconSize: [34, 42], iconAnchor: [17, 38], popupAnchor: [0, -34] });
        const popup = document.createElement('div');
        popup.className = 'mapPopup';
        const label = document.createElement('small'); label.textContent = location.category;
        const title = document.createElement('strong'); title.textContent = location.title;
        const description = document.createElement('p'); description.textContent = location.description;
        const coords = document.createElement('code'); coords.textContent = `X ${location.x.toFixed(1)} · Y ${location.y.toFixed(1)}`;
        popup.append(label, title, description, coords);
        const marker = L.marker(gtaToLeaflet(location.x, location.y), { icon, title: location.title }).bindPopup(popup).addTo(map.current!);
        markers.current.set(location.id, marker);
      });
    });
    return () => { cancelled = true; };
  }, [visible, mapReady]);

  const focus = (location: MapLocationData) => {
    map.current?.setView(gtaToLeaflet(location.x, location.y), 4, { animate: true });
    markers.current.get(location.id)?.openPopup();
  };

  return <div className="mapShell">
    <aside className="mapSidebar">
      <div className="mapControls"><TextInput leftSection={<IconSearch size={16}/>} placeholder="Søg efter sted..." value={query} onChange={(event) => setQuery(event.currentTarget.value)}/><SegmentedControl fullWidth value={layer} onChange={setLayer} data={[{value:'atlas',label:'Atlas'},{value:'satellite',label:'Satellit'}]}/><div className="mapCategoryRow">{categories.map((item) => <Badge key={item} variant={category === item ? 'filled' : 'light'} onClick={() => setCategory(item)}>{item}</Badge>)}</div></div>
      <div className="mapLocationList">{visible.map((location) => <button type="button" className="mapLocationItem" key={location.id} onClick={() => focus(location)}><span className="mapLocationIcon" style={{color:location.color,borderColor:`${location.color}55`,background:`${location.color}14`}}><IconMapPin size={18}/></span><span><strong>{location.title}</strong><small>{location.category} · X {location.x.toFixed(0)} / Y {location.y.toFixed(0)}</small></span></button>)}{!visible.length && <div className="mapEmpty">Ingen steder matcher din søgning.</div>}</div>
    </aside>
    <div className="mapCanvasWrap"><div ref={mapNode} className="mapCanvas"/><div className="mapLivePill"><span className="liveDot"/> Opdateres automatisk</div><Button className="mapResetButton" size="xs" variant="default" onClick={() => map.current?.setView(GTA_MAP_CENTER, GTA_MAP_DEFAULT_ZOOM, { animate: true })}>Vis hele kortet</Button></div>
  </div>;
}
