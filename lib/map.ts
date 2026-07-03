// GTA world coordinates are used directly. Leaflet expects [latitude, longitude],
// which corresponds to [Y, X] for in-game coordinates.
export const GTA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [-4000, -5500],
  [8000, 6000],
];
export const GTA_MAP_CENTER: [number, number] = [0, 0];
export const GTA_MAP_DEFAULT_ZOOM = 3;

export const GTA_CRS_CONFIG = {
  centerX: 117.3,
  centerY: 172.8,
  scaleX: 0.02072,
  scaleY: 0.0205,
};

export type MapLocationData = {
  id: string;
  externalId?: string | null;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  active: boolean;
  sortOrder: number;
};

export function gtaToLeaflet(x: number, y: number): [number, number] {
  return [y, x];
}

export const MAP_TILE_URLS = {
  atlas: process.env.NEXT_PUBLIC_GTA_ATLAS_TILES || 'https://raw.githubusercontent.com/meesvrh/GTAV-Map-Tiles/main/tiles/atlas/{z}/{x}/{y}.jpg',
  satellite: process.env.NEXT_PUBLIC_GTA_SATELLITE_TILES || 'https://raw.githubusercontent.com/meesvrh/GTAV-Map-Tiles/main/tiles/satellite/{z}/{x}/{y}.jpg',
};
