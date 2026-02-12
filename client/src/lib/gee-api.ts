/**
 * Google Earth Engine (GEE) API Integration
 * Real operational flood, landslide, and commodity analysis
 * Based on Sentinel-1 SAR & Sentinel-2 imagery via GEE
 */

const API_BASE = "https://api-v2.sustainit.id/api/v1/gee";

// ── Response Types ──────────────────────────────────────────────────────────

export interface AreaStatsResponse {
  dataset?: string;
  commodity?: string;
  analysis_type?: string;
  location: {
    country: string;
    province: string;
    district: string | null;
  };
  scale_used: number;
  area_sqm: number;
  area_ha: number;
}

// ── Layer Definitions ───────────────────────────────────────────────────────

export const FLOOD_LAYERS = {
  flood_hazard: {
    label: "Flood Hazard Index",
    description: "Composite flood susceptibility (0–1) from Sentinel-1 SAR",
    legendColors: ["#FEE5D9", "#FCBBA1", "#FC9272", "#FB6A4A", "#DE2D26", "#A50F15"],
    legendLabels: ["Very Low", "High"],
  },
  permanent_water: {
    label: "Permanent Water",
    description: "Detected permanent water bodies",
    legendColors: ["#c6dbef", "#6baed6", "#2171b5", "#084594"],
    legendLabels: ["Shallow", "Deep"],
  },
  flood_nov_dec_2025: {
    label: "Flood Nov–Dec 2025",
    description: "Flood detection vs baseline Aug–Oct 2025",
    legendColors: ["#bdd7e7", "#6baed6", "#2171b5"],
    legendLabels: ["Low", "High"],
  },
  flood_2024: {
    label: "Flood Extent 2024",
    description: "Historical flood extent for 2024",
    legendColors: ["#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
    legendLabels: ["Low", "High"],
  },
  flood_2023: {
    label: "Flood Extent 2023",
    description: "Historical flood extent for 2023",
    legendColors: ["#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
    legendLabels: ["Low", "High"],
  },
} as const;

export const LANDSLIDE_LAYERS = {
  landslide_nov_dec_2025: {
    label: "Landslide SAR",
    description: "SAR backscatter-based detection Nov–Dec 2025",
    color: "#e66101",
  },
  landslide_ndvi_nov_dec_2025: {
    label: "Landslide NDVI",
    description: "NDVI-based detection Nov–Dec 2025",
    color: "#d8b365",
  },
} as const;

export const COMMODITY_LAYERS = {
  cocoa: { label: "Cocoa", color: "#018571", description: "Cocoa plantation probability" },
  coffee: { label: "Coffee", color: "#a6611a", description: "Coffee plantation probability" },
  rubber: { label: "Rubber", color: "#2c7bb6", description: "Rubber plantation probability" },
  palm: { label: "Oil Palm", color: "#abdda4", description: "Palm oil plantation probability" },
} as const;

export const INTERSECTION_TYPES = {
  commodity_flood: { label: "Commodity × Flood", color: "#7b3294", description: "Commodity area exposed to flood hazard" },
  commodity_landslide: { label: "Commodity × Landslide", color: "#c51b7d", description: "Commodity area exposed to landslide" },
} as const;

export type FloodLayerKey = keyof typeof FLOOD_LAYERS;
export type LandslideLayerKey = keyof typeof LANDSLIDE_LAYERS;
export type CommodityKey = keyof typeof COMMODITY_LAYERS;
export type IntersectionKey = keyof typeof INTERSECTION_TYPES;

// ── Tile URL Builders ───────────────────────────────────────────────────────

function buildParams(province: string, district?: string): URLSearchParams {
  const params = new URLSearchParams({ country: "Indonesia", province });
  if (district) params.append("district", district);
  return params;
}

export function getFloodTileUrl(dataset: FloodLayerKey, province: string, district?: string): string {
  return `${API_BASE}/flood/tiles/${dataset}/{z}/{x}/{y}?${buildParams(province, district)}`;
}

export function getLandslideTileUrl(dataset: LandslideLayerKey, province: string, district?: string): string {
  return `${API_BASE}/landslide/tiles/${dataset}/{z}/{x}/{y}?${buildParams(province, district)}`;
}

export function getCommodityTileUrl(commodity: CommodityKey, province: string, district?: string): string {
  return `${API_BASE}/commodity/tiles/${commodity}/{z}/{x}/{y}?${buildParams(province, district)}`;
}

export function getIntersectionTileUrl(type: IntersectionKey, commodity: CommodityKey, province: string, district?: string): string {
  return `${API_BASE}/intersection/tiles/${type}/${commodity}/{z}/{x}/{y}?${buildParams(province, district)}`;
}

// ── Stats Fetchers ──────────────────────────────────────────────────────────

export async function fetchFloodStats(dataset: FloodLayerKey, province: string, district?: string): Promise<AreaStatsResponse> {
  const params = buildParams(province, district);
  params.append("dataset", dataset);
  const res = await fetch(`${API_BASE}/flood/stats?${params}`);
  if (!res.ok) throw new Error(`Flood stats failed: ${res.statusText}`);
  return res.json();
}

export async function fetchLandslideStats(dataset: LandslideLayerKey, province: string, district?: string): Promise<AreaStatsResponse> {
  const params = buildParams(province, district);
  params.append("dataset", dataset);
  const res = await fetch(`${API_BASE}/landslide/stats?${params}`);
  if (!res.ok) throw new Error(`Landslide stats failed: ${res.statusText}`);
  return res.json();
}

export async function fetchCommodityStats(commodity: CommodityKey, province: string, district?: string): Promise<AreaStatsResponse> {
  const params = buildParams(province, district);
  params.append("commodity", commodity);
  const res = await fetch(`${API_BASE}/commodity/stats?${params}`);
  if (!res.ok) throw new Error(`Commodity stats failed: ${res.statusText}`);
  return res.json();
}

export async function fetchIntersectionStats(type: IntersectionKey, commodity: CommodityKey, province: string, district?: string): Promise<AreaStatsResponse> {
  const params = buildParams(province, district);
  params.append("type", type);
  params.append("commodity", commodity);
  const res = await fetch(`${API_BASE}/intersection/stats?${params}`);
  if (!res.ok) throw new Error(`Intersection stats failed: ${res.statusText}`);
  return res.json();
}

// ── Location Presets ────────────────────────────────────────────────────────

export interface LocationPreset {
  label: string;
  province: string;
  district: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export const LOCATIONS: Record<string, LocationPreset> = {
  aceh_barat: {
    label: "Aceh Barat",
    province: "Aceh",
    district: "Aceh Barat",
    center: [96.15, 4.45],
    zoom: 10,
  },
  aceh_selatan: {
    label: "Aceh Selatan",
    province: "Aceh",
    district: "Aceh Selatan",
    center: [97.30, 3.18],
    zoom: 10,
  },
  pidie: {
    label: "Pidie",
    province: "Aceh",
    district: "Pidie",
    center: [96.10, 5.30],
    zoom: 10,
  },
  aceh_besar: {
    label: "Aceh Besar",
    province: "Aceh",
    district: "Aceh Besar",
    center: [95.52, 5.38],
    zoom: 10,
  },
  aceh_utara: {
    label: "Aceh Utara",
    province: "Aceh",
    district: "Aceh Utara",
    center: [97.09, 5.05],
    zoom: 10,
  },
};

export type LocationKey = keyof typeof LOCATIONS;
