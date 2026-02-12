import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Waves, Eye, EyeOff, Layers, BarChart3, MapPin, ChevronDown,
  Satellite, Mountain, TreePine, Coffee, Loader2, AlertTriangle,
  Map as MapIcon, Globe2, Info, X, ArrowDown, ArrowLeft, ArrowRight,
  MousePointer2, HelpCircle
} from "lucide-react";
import {
  FLOOD_LAYERS, LANDSLIDE_LAYERS, COMMODITY_LAYERS, INTERSECTION_TYPES,
  LOCATIONS,
  getFloodTileUrl, getLandslideTileUrl, getCommodityTileUrl, getIntersectionTileUrl,
  fetchFloodStats, fetchLandslideStats, fetchCommodityStats, fetchIntersectionStats,
  type FloodLayerKey, type LandslideLayerKey, type CommodityKey, type IntersectionKey,
  type LocationKey, type LocationPreset, type AreaStatsResponse,
} from "@/lib/gee-api";

// ── Types ───────────────────────────────────────────────────────────────────

type BasemapKey = "osm" | "satellite" | "dark";

interface LayerState {
  flood: { visible: boolean; dataset: FloodLayerKey; opacity: number };
  landslide: { visible: boolean; dataset: LandslideLayerKey; opacity: number };
  commodity: { visible: boolean; dataset: CommodityKey; opacity: number };
  intersection: { visible: boolean; type: IntersectionKey; commodity: CommodityKey; opacity: number };
}

interface StatsData {
  flood: AreaStatsResponse | null;
  landslide: AreaStatsResponse | null;
  commodity: AreaStatsResponse | null;
  intersection: AreaStatsResponse | null;
}

// ── Basemaps ────────────────────────────────────────────────────────────────

const BASEMAPS: Record<BasemapKey, { label: string; tiles: string; attr: string }> = {
  osm: {
    label: "Street",
    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    tiles: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri",
  },
  dark: {
    label: "Dark",
    tiles: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "&copy; CARTO",
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export function FloodMap3D({ fullPage = false }: { fullPage?: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [isActivated, setIsActivated] = useState(fullPage);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemap, setBasemap] = useState<BasemapKey>("dark");
  const [selectedLocation, setSelectedLocation] = useState<LocationKey>("aceh_barat");
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [guideStep, setGuideStep] = useState(0);

  const [layers, setLayers] = useState<LayerState>({
    flood: { visible: true, dataset: "flood_hazard", opacity: 0.7 },
    landslide: { visible: false, dataset: "landslide_nov_dec_2025", opacity: 0.7 },
    commodity: { visible: false, dataset: "cocoa", opacity: 0.6 },
    intersection: { visible: false, type: "commodity_flood", commodity: "cocoa", opacity: 0.7 },
  });

  const [stats, setStats] = useState<StatsData>({
    flood: null, landslide: null, commodity: null, intersection: null,
  });

  const location = LOCATIONS[selectedLocation];

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addOrUpdateRasterLayer = useCallback((
    map: maplibregl.Map,
    id: string,
    tileUrl: string,
    visible: boolean,
    opacity: number,
  ) => {
    const sourceId = `${id}-src`;
    // Remove old
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (!visible) return;

    map.addSource(sourceId, { type: "raster", tiles: [tileUrl], tileSize: 256 });
    map.addLayer({ id, type: "raster", source: sourceId, paint: { "raster-opacity": opacity } });
  }, []);

  // ── Init Map ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActivated || !mapContainer.current || mapRef.current) return;

    const bm = BASEMAPS[basemap];
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "GEE Flood Analysis",
        sources: {
          basemap: { type: "raster", tiles: [bm.tiles], tileSize: 256, attribution: bm.attr },
        },
        layers: [
          { id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } },
        ],
      },
      center: location.center,
      zoom: location.zoom,
      pitch: 0,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [isActivated]);

  // ── Switch Basemap ──────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const bm = BASEMAPS[basemap];
    const src = map.getSource("basemap") as maplibregl.RasterTileSource | undefined;
    if (src) {
      // Remove & re-add
      map.removeLayer("basemap");
      map.removeSource("basemap");
      map.addSource("basemap", { type: "raster", tiles: [bm.tiles], tileSize: 256, attribution: bm.attr });
      // Add as first layer
      const firstLayer = map.getStyle().layers?.[0]?.id;
      map.addLayer({ id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } }, firstLayer);
    }
  }, [basemap, mapLoaded]);

  // ── Fly to Location ─────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.flyTo({ center: location.center, zoom: location.zoom, duration: 1500 });
  }, [selectedLocation, mapLoaded]);

  // ── Sync GEE Layers ─────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const { province, district } = location;

    // Flood
    addOrUpdateRasterLayer(
      map, "gee-flood",
      getFloodTileUrl(layers.flood.dataset, province, district),
      layers.flood.visible, layers.flood.opacity,
    );

    // Landslide
    addOrUpdateRasterLayer(
      map, "gee-landslide",
      getLandslideTileUrl(layers.landslide.dataset, province, district),
      layers.landslide.visible, layers.landslide.opacity,
    );

    // Commodity
    addOrUpdateRasterLayer(
      map, "gee-commodity",
      getCommodityTileUrl(layers.commodity.dataset, province, district),
      layers.commodity.visible, layers.commodity.opacity,
    );

    // Intersection
    addOrUpdateRasterLayer(
      map, "gee-intersection",
      getIntersectionTileUrl(layers.intersection.type, layers.intersection.commodity, province, district),
      layers.intersection.visible, layers.intersection.opacity,
    );
  }, [layers, selectedLocation, mapLoaded, addOrUpdateRasterLayer]);

  // ── Fetch Stats ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded) return;

    const { province, district } = location;
    setLoadingStats(true);

    const promises: Promise<void>[] = [];

    if (layers.flood.visible) {
      promises.push(
        fetchFloodStats(layers.flood.dataset, province, district)
          .then((r: AreaStatsResponse) => setStats(prev => ({ ...prev, flood: r })))
          .catch(() => setStats(prev => ({ ...prev, flood: null })))
      );
    } else {
      setStats(prev => ({ ...prev, flood: null }));
    }

    if (layers.landslide.visible) {
      promises.push(
        fetchLandslideStats(layers.landslide.dataset, province, district)
          .then((r: AreaStatsResponse) => setStats(prev => ({ ...prev, landslide: r })))
          .catch(() => setStats(prev => ({ ...prev, landslide: null })))
      );
    } else {
      setStats(prev => ({ ...prev, landslide: null }));
    }

    if (layers.commodity.visible) {
      promises.push(
        fetchCommodityStats(layers.commodity.dataset, province, district)
          .then((r: AreaStatsResponse) => setStats(prev => ({ ...prev, commodity: r })))
          .catch(() => setStats(prev => ({ ...prev, commodity: null })))
      );
    } else {
      setStats(prev => ({ ...prev, commodity: null }));
    }

    if (layers.intersection.visible) {
      promises.push(
        fetchIntersectionStats(layers.intersection.type, layers.intersection.commodity, province, district)
          .then((r: AreaStatsResponse) => setStats(prev => ({ ...prev, intersection: r })))
          .catch(() => setStats(prev => ({ ...prev, intersection: null })))
      );
    } else {
      setStats(prev => ({ ...prev, intersection: null }));
    }

    Promise.allSettled(promises).finally(() => setLoadingStats(false));
  }, [layers.flood.visible, layers.flood.dataset, layers.landslide.visible, layers.landslide.dataset,
      layers.commodity.visible, layers.commodity.dataset, layers.intersection.visible,
      layers.intersection.type, layers.intersection.commodity, selectedLocation, mapLoaded]);

  // ── Render: Placeholder (before activation) ─────────────────────────────

  if (!isActivated) {
    return (
      <div className={`relative w-full overflow-hidden border border-border/50 shadow-2xl bg-gradient-to-br from-emerald-950/30 via-slate-950/50 to-blue-950/30 ${fullPage ? '' : 'rounded-xl'}`} style={{ height: fullPage ? '100vh' : '650px' }}>
        {/* Subtle grid */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-emerald-400" />
            </pattern>
            <rect width="100" height="100" fill="url(#map-grid)" />
          </svg>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <div className="flex items-center justify-center gap-4 mb-5">
              <Satellite className="w-7 h-7 text-emerald-400" />
              <Globe2 className="w-10 h-10 text-blue-400" />
              <Layers className="w-7 h-7 text-emerald-400" />
            </div>

            <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
              Operational Flood & Disaster Analysis
            </h3>

            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Real satellite-based analysis using Google Earth Engine with Sentinel-1 SAR &amp; Sentinel-2 imagery.
              Explore flood hazard, landslide detection, and agricultural commodity impact across Aceh, Indonesia.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["Google Earth Engine", "Sentinel-1 SAR", "Sentinel-2", "Flood Hazard", "Landslide Detection", "Commodity Analysis"].map(t => (
                <span key={t} className="text-xs font-mono text-emerald-400/80 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                  {t}
                </span>
              ))}
            </div>

            <motion.button
              onClick={() => setIsActivated(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold px-6 py-3 rounded-lg border border-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <Satellite className="w-5 h-5" />
              Launch Analysis Dashboard
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                →
              </motion.span>
            </motion.button>

            <p className="text-xs text-muted-foreground/60 mt-4">
              Live data from Google Earth Engine API — Sentinel-1/2 satellite imagery
            </p>
          </motion.div>
        </div>

        {/* Feature strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent backdrop-blur-sm border-t border-border/30 p-4">
          <div className="grid grid-cols-4 gap-4 text-center max-w-lg mx-auto">
            <div>
              <Waves className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Flood Hazard</p>
            </div>
            <div>
              <Mountain className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Landslide</p>
            </div>
            <div>
              <TreePine className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Commodity</p>
            </div>
            <div>
              <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Intersection</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const GUIDE_STEPS = [
    {
      title: "Welcome to GEE Analysis",
      description: "This dashboard shows real satellite-based flood, landslide, and commodity analysis powered by Google Earth Engine.",
      position: "center" as const,
    },
    {
      title: "Select Location",
      description: "Choose a district in Aceh province to analyze. The map will fly to the selected area.",
      position: "top-left" as const,
      arrow: "down" as const,
    },
    {
      title: "Analysis Layers",
      description: "Toggle flood hazard, landslide, commodity, and intersection layers. Each layer has opacity control and dataset options.",
      position: "left" as const,
      arrow: "left" as const,
    },
    {
      title: "Switch Basemap",
      description: "Change between Street, Satellite, and Dark map styles for better visualization.",
      position: "top-right" as const,
      arrow: "right" as const,
    },
    {
      title: "Area Statistics",
      description: "View computed area statistics (in hectares) for each active layer based on GEE calculations.",
      position: "bottom" as const,
      arrow: "down" as const,
    },
  ];

  // ── Render: Active Map ──────────────────────────────────────────────────

  return (
    <div className={`relative w-full overflow-hidden border border-border/50 shadow-2xl ${fullPage ? '' : 'rounded-xl'}`} style={{ height: fullPage ? '100vh' : '650px' }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* ── Top Bar (Title + Location combined) ── */}
      <div className={`absolute left-3 right-3 z-10 flex items-start justify-between gap-2 ${fullPage ? 'top-4' : 'top-3'}`}>
        <div className={`bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg flex items-center gap-3 min-w-0 ${fullPage ? 'px-4 py-2.5' : 'px-3 py-2'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Satellite className={`text-emerald-400 shrink-0 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <div className="min-w-0">
              <h3 className={`font-display font-bold text-foreground truncate ${fullPage ? 'text-sm' : 'text-xs'}`}>GEE Flood & Disaster Analysis</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className={`text-emerald-400/80 font-mono truncate ${fullPage ? 'text-xs' : 'text-[9px]'}`}>Sentinel-1 SAR · Google Earth Engine</span>
              </div>
            </div>
          </div>

          <div className={`w-px bg-border/50 shrink-0 ${fullPage ? 'h-7' : 'h-6'}`} />

          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className={`text-emerald-400 ${fullPage ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value as LocationKey)}
              className={`bg-transparent text-foreground border-none outline-none cursor-pointer font-mono pr-4 ${fullPage ? 'text-sm' : 'text-xs'}`}
            >
              {(Object.entries(LOCATIONS) as [string, LocationPreset][]).map(([key, loc]) => (
                <option key={key} value={key} className="bg-background text-foreground">
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Basemap + Help + Back */}
        <div className={`flex items-center shrink-0 ${fullPage ? 'gap-2' : 'gap-1.5'}`}>
          <button
            onClick={() => { setShowGuide(true); setGuideStep(0); }}
            className={`bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg hover:border-emerald-500/50 transition-colors ${fullPage ? 'p-2.5' : 'p-2'}`}
            title="Show guide"
          >
            <HelpCircle className={`text-emerald-400 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
          </button>
          <div className={`bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg flex gap-1 ${fullPage ? 'px-2.5 py-2' : 'px-2 py-1.5'}`}>
          {(Object.entries(BASEMAPS) as [BasemapKey, typeof BASEMAPS[BasemapKey]][]).map(([key, bm]) => (
            <button
              key={key}
              onClick={() => setBasemap(key)}
              className={`rounded font-mono font-bold transition-all ${fullPage ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]'} ${
                basemap === key
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {bm.label}
            </button>
          ))}
          </div>
          {fullPage && (
            <Link href="/">
              <button className={`bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg flex items-center gap-1.5 hover:border-emerald-500/50 transition-colors group ${fullPage ? 'px-3 py-2' : 'px-2.5 py-1.5'}`}>
                <ArrowLeft className={`text-muted-foreground group-hover:text-emerald-400 transition-colors ${fullPage ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                <span className={`font-mono font-bold text-muted-foreground group-hover:text-emerald-400 transition-colors ${fullPage ? 'text-xs' : 'text-[10px]'}`}>Back</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Layer Panel (Left) ── */}
      <div className={`absolute left-3 z-10 ${fullPage ? 'top-[60px] w-[260px]' : 'top-[52px] w-[220px]'}`}>
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`w-full bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg hover:border-emerald-500/40 transition-colors flex items-center justify-between ${fullPage ? 'px-4 py-2.5' : 'px-3 py-2'}`}
        >
          <div className="flex items-center gap-2">
            <Layers className={`text-emerald-400 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-mono font-bold text-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>Analysis Layers</span>
          </div>
          <ChevronDown className={`text-muted-foreground transition-transform ${fullPage ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${showLayerPanel ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showLayerPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 bg-background/95 backdrop-blur-md rounded-lg border border-border/50 shadow-xl overflow-hidden"
            >
              <div className="p-2.5 space-y-2.5 max-h-[440px] overflow-y-auto">

                {/* Flood Layer */}
                <LayerToggle
                  icon={<Waves className="w-4 h-4" />}
                  label="Flood Hazard"
                  color="text-blue-400"
                  visible={layers.flood.visible}
                  opacity={layers.flood.opacity}
                  onToggle={() => setLayers(prev => ({ ...prev, flood: { ...prev.flood, visible: !prev.flood.visible } }))}
                  onOpacity={v => setLayers(prev => ({ ...prev, flood: { ...prev.flood, opacity: v } }))}
                >
                  <select
                    value={layers.flood.dataset}
                    onChange={e => setLayers(prev => ({ ...prev, flood: { ...prev.flood, dataset: e.target.value as FloodLayerKey } }))}
                    className="w-full bg-muted/50 border border-border/40 rounded px-2 py-1 text-[10px] text-foreground mt-1.5"
                  >
                    {(Object.entries(FLOOD_LAYERS) as [FloodLayerKey, typeof FLOOD_LAYERS[FloodLayerKey]][]).map(([key, l]) => (
                      <option key={key} value={key}>{l.label}</option>
                    ))}
                  </select>
                  {/* Legend */}
                  <div className="mt-1.5">
                    <div className="flex h-2 w-full rounded-sm overflow-hidden">
                      {FLOOD_LAYERS[layers.flood.dataset].legendColors.map((c: string, i: number) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
                      {FLOOD_LAYERS[layers.flood.dataset].legendLabels.map((l: string, i: number) => (
                        <span key={i}>{l}</span>
                      ))}
                    </div>
                  </div>
                </LayerToggle>

                {/* Landslide Layer */}
                <LayerToggle
                  icon={<Mountain className="w-4 h-4" />}
                  label="Landslide"
                  color="text-orange-400"
                  visible={layers.landslide.visible}
                  opacity={layers.landslide.opacity}
                  onToggle={() => setLayers(prev => ({ ...prev, landslide: { ...prev.landslide, visible: !prev.landslide.visible } }))}
                  onOpacity={v => setLayers(prev => ({ ...prev, landslide: { ...prev.landslide, opacity: v } }))}
                >
                  <select
                    value={layers.landslide.dataset}
                    onChange={e => setLayers(prev => ({ ...prev, landslide: { ...prev.landslide, dataset: e.target.value as LandslideLayerKey } }))}
                    className="w-full bg-muted/50 border border-border/40 rounded px-2 py-1 text-[10px] text-foreground mt-1.5"
                  >
                    {(Object.entries(LANDSLIDE_LAYERS) as [LandslideLayerKey, typeof LANDSLIDE_LAYERS[LandslideLayerKey]][]).map(([key, l]) => (
                      <option key={key} value={key}>{l.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: LANDSLIDE_LAYERS[layers.landslide.dataset].color }} />
                    <span className="text-[8px] text-muted-foreground">Detected area</span>
                  </div>
                </LayerToggle>

                <div className="h-px bg-border/40" />

                {/* Commodity Layer */}
                <LayerToggle
                  icon={<TreePine className="w-4 h-4" />}
                  label="Commodity"
                  color="text-emerald-400"
                  visible={layers.commodity.visible}
                  opacity={layers.commodity.opacity}
                  onToggle={() => setLayers(prev => ({ ...prev, commodity: { ...prev.commodity, visible: !prev.commodity.visible } }))}
                  onOpacity={v => setLayers(prev => ({ ...prev, commodity: { ...prev.commodity, opacity: v } }))}
                >
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(Object.entries(COMMODITY_LAYERS) as [CommodityKey, typeof COMMODITY_LAYERS[CommodityKey]][]).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setLayers(prev => ({ ...prev, commodity: { ...prev.commodity, dataset: key } }))}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${
                          layers.commodity.dataset === key
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </LayerToggle>

                {/* Intersection Layer */}
                <LayerToggle
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="Intersection"
                  color="text-purple-400"
                  visible={layers.intersection.visible}
                  opacity={layers.intersection.opacity}
                  onToggle={() => setLayers(prev => ({ ...prev, intersection: { ...prev.intersection, visible: !prev.intersection.visible } }))}
                  onOpacity={v => setLayers(prev => ({ ...prev, intersection: { ...prev.intersection, opacity: v } }))}
                >
                  <select
                    value={layers.intersection.type}
                    onChange={e => setLayers(prev => ({ ...prev, intersection: { ...prev.intersection, type: e.target.value as IntersectionKey } }))}
                    className="w-full bg-muted/50 border border-border/40 rounded px-2 py-1 text-[10px] text-foreground mt-1.5"
                  >
                    {(Object.entries(INTERSECTION_TYPES) as [IntersectionKey, typeof INTERSECTION_TYPES[IntersectionKey]][]).map(([key, t]) => (
                      <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(Object.entries(COMMODITY_LAYERS) as [CommodityKey, typeof COMMODITY_LAYERS[CommodityKey]][]).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setLayers(prev => ({ ...prev, intersection: { ...prev.intersection, commodity: key } }))}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${
                          layers.intersection.commodity === key
                            ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                            : "border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </LayerToggle>
              </div>

              {/* Data source */}
              <div className="px-3 py-2 border-t border-border/30">
                <p className="text-[8px] text-muted-foreground/60 leading-tight">
                  Powered by Google Earth Engine — Sentinel-1 SAR & Sentinel-2 Optical.
                  Boundary: FAO GAUL 2024. Commodity: Forest Data Partnership 2025a.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Statistics Panel (Bottom) ── */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mapLoaded ? 1 : 0, y: mapLoaded ? 0 : 20 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 left-3 right-3 z-10"
          >
            <div className="bg-background/90 backdrop-blur-md rounded-lg border border-border/50 px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2`}>
                  <BarChart3 className={`text-emerald-400 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  <span className={`font-bold text-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>Area Statistics</span>
                  <span className={`text-muted-foreground font-mono ${fullPage ? 'text-xs' : 'text-[9px]'}`}>({location.district})</span>
                </div>
                {loadingStats && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Flood Hazard"
                  value={stats.flood}
                  color="text-blue-400"
                  bgColor="bg-blue-500/10"
                  icon={<Waves className="w-3.5 h-3.5" />}
                  visible={layers.flood.visible}
                />
                <StatCard
                  label="Landslide"
                  value={stats.landslide}
                  color="text-orange-400"
                  bgColor="bg-orange-500/10"
                  icon={<Mountain className="w-3.5 h-3.5" />}
                  visible={layers.landslide.visible}
                />
                <StatCard
                  label={`${COMMODITY_LAYERS[layers.commodity.dataset].label}`}
                  value={stats.commodity}
                  color="text-emerald-400"
                  bgColor="bg-emerald-500/10"
                  icon={<TreePine className="w-3.5 h-3.5" />}
                  visible={layers.commodity.visible}
                />
                <StatCard
                  label="Intersection"
                  value={stats.intersection}
                  color="text-purple-400"
                  bgColor="bg-purple-500/10"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  visible={layers.intersection.visible}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle stats visibility */}
      <button
        onClick={() => setShowStats(!showStats)}
        className="absolute bottom-3 right-3 z-20 bg-background/90 backdrop-blur-md rounded-lg border border-border/50 p-2 shadow-lg hover:border-emerald-500/50 transition-colors"
        title={showStats ? "Hide stats" : "Show stats"}
      >
        <BarChart3 className={`w-4 h-4 ${showStats ? "text-emerald-400" : "text-muted-foreground"}`} />
      </button>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-sm font-mono text-muted-foreground">Connecting to Google Earth Engine...</span>
          </div>
        </div>
      )}

      {/* ── Onboarding Guide Overlay ── */}
      <AnimatePresence>
        {showGuide && mapLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowGuide(false)} />

            {/* Guide Card */}
            <motion.div
              key={guideStep}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute z-40 ${
                GUIDE_STEPS[guideStep].position === "center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :
                GUIDE_STEPS[guideStep].position === "top-left" ? "top-[60px] left-[260px]" :
                GUIDE_STEPS[guideStep].position === "left" ? "top-[120px] left-[250px]" :
                GUIDE_STEPS[guideStep].position === "top-right" ? "top-[60px] right-[180px]" :
                "bottom-[90px] left-1/2 -translate-x-1/2"
              }`}
            >
              {/* Arrow indicators */}
              {GUIDE_STEPS[guideStep].arrow === "down" && GUIDE_STEPS[guideStep].position === "top-left" && (
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute -top-8 left-8"
                >
                  <ArrowDown className="w-5 h-5 text-emerald-400 rotate-[225deg]" />
                </motion.div>
              )}
              {GUIDE_STEPS[guideStep].arrow === "left" && (
                <motion.div
                  animate={{ x: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute top-4 -left-8"
                >
                  <ArrowLeft className="w-5 h-5 text-emerald-400" />
                </motion.div>
              )}
              {GUIDE_STEPS[guideStep].arrow === "right" && (
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute top-4 -right-8"
                >
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                </motion.div>
              )}
              {GUIDE_STEPS[guideStep].arrow === "down" && GUIDE_STEPS[guideStep].position === "bottom" && (
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2"
                >
                  <ArrowDown className="w-5 h-5 text-emerald-400" />
                </motion.div>
              )}

              <div className="bg-background/95 backdrop-blur-md rounded-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 p-4 max-w-[280px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
                      {guideStep + 1}
                    </div>
                    <h4 className="font-display font-bold text-sm text-foreground">{GUIDE_STEPS[guideStep].title}</h4>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {GUIDE_STEPS[guideStep].description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {GUIDE_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === guideStep ? "bg-emerald-400" : i < guideStep ? "bg-emerald-400/40" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {guideStep > 0 && (
                      <button
                        onClick={() => setGuideStep(guideStep - 1)}
                        className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border/40 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {guideStep < GUIDE_STEPS.length - 1 ? (
                      <button
                        onClick={() => setGuideStep(guideStep + 1)}
                        className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1 rounded border border-emerald-500/30 transition-colors font-bold"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowGuide(false)}
                        className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1 rounded border border-emerald-500/30 transition-colors font-bold"
                      >
                        Got it ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function LayerToggle({
  icon,
  label,
  color,
  visible,
  opacity,
  onToggle,
  onOpacity,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  visible: boolean;
  opacity: number;
  onToggle: () => void;
  onOpacity: (v: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-md border p-2 transition-all ${visible ? "border-border/50 bg-muted/20" : "border-transparent opacity-60"}`}>
      <div className="flex items-center justify-between">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
            visible ? "bg-emerald-500/20 " + color : "bg-muted/30 text-muted-foreground"
          }`}>
            {visible
              ? <Eye className="w-3 h-3" />
              : <EyeOff className="w-3 h-3" />
            }
          </div>
          <span className={`text-xs font-bold ${visible ? color : "text-muted-foreground"}`}>{label}</span>
        </button>
      </div>

      {visible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-9">Opacity</span>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={opacity}
              onChange={e => onOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">{Math.round(opacity * 100)}%</span>
          </div>
          {children}
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bgColor,
  icon,
  visible,
}: {
  label: string;
  value: AreaStatsResponse | null;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  visible: boolean;
}) {
  if (!visible) {
    return (
      <div className="rounded-md border border-border/30 bg-muted/10 p-2 opacity-40">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">Layer off</p>
      </div>
    );
  }

  return (
    <div className={`rounded-md border border-border/30 ${bgColor} p-2`}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={color}>{icon}</div>
        <span className={`text-[10px] font-bold ${color}`}>{label}</span>
      </div>
      {value ? (
        <div>
          <p className={`text-base font-bold font-mono ${color}`}>
            {value.area_ha >= 1000
              ? `${(value.area_ha / 1000).toFixed(1)}k`
              : value.area_ha.toFixed(1)
            }
            <span className="text-[9px] font-normal ml-0.5">Ha</span>
          </p>
          <p className="text-[9px] text-muted-foreground font-mono">
            {(value.area_ha / 100).toFixed(2)} km² · {value.scale_used}m res
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground font-mono">Loading...</p>
      )}
    </div>
  );
}
