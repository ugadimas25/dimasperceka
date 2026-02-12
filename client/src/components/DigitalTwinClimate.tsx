import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Line, LineChart, ResponsiveContainer, Tooltip as ReTooltip,
  XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from "recharts";
import {
  Leaf, AlertTriangle, Droplets, ThermometerSun, Waves, Activity,
  ArrowLeft, RefreshCw, ShieldAlert, MapPin, Factory,
  ArrowUpRight, ArrowDownRight, X,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type AlertSeverity = "low" | "medium" | "high" | "critical";
type DtLayer = "ndvi" | "rainfall_anom" | "temp_anom" | "flood_risk" | "water_stress";
type DateRange = "7d" | "30d" | "90d";

interface DtField {
  id: string;
  name: string;
  regionId: string;
  commodity: string;
  areaHa: number;
  polygon: [number, number][];
  latestNdvi: number;
  waterStressIdx: number;
  floodRiskIdx: number;
  riskScore: number;
}

interface DtAlert {
  id: string;
  fieldId: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  occurredAt: string;
}

interface TimeSeries {
  date: string;
  ndvi: number;
  riskScore: number;
  waterStressIdx: number;
  floodRiskIdx: number;
  tempC: number;
  rainfallMm: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_FIELDS: DtField[] = [
  { id: "f-001", name: "North Prairie A", regionId: "hennepin", commodity: "Corn", areaHa: 45.2, polygon: [[-93.35, 45.08], [-93.31, 45.08], [-93.31, 45.05], [-93.35, 45.05], [-93.35, 45.08]], latestNdvi: 0.74, waterStressIdx: 0.32, floodRiskIdx: 0.12, riskScore: 25 },
  { id: "f-002", name: "South Valley B", regionId: "dakota", commodity: "Soybeans", areaHa: 38.7, polygon: [[-93.22, 44.92], [-93.18, 44.92], [-93.18, 44.89], [-93.22, 44.89], [-93.22, 44.92]], latestNdvi: 0.41, waterStressIdx: 0.71, floodRiskIdx: 0.24, riskScore: 74 },
  { id: "f-003", name: "East Ridge C", regionId: "hennepin", commodity: "Wheat", areaHa: 52.1, polygon: [[-93.10, 44.99], [-93.06, 44.99], [-93.06, 44.96], [-93.10, 44.96], [-93.10, 44.99]], latestNdvi: 0.67, waterStressIdx: 0.45, floodRiskIdx: 0.41, riskScore: 48 },
  { id: "f-004", name: "West Creek D", regionId: "scott", commodity: "Corn", areaHa: 41.3, polygon: [[-93.42, 45.02], [-93.38, 45.02], [-93.38, 44.99], [-93.42, 44.99], [-93.42, 45.02]], latestNdvi: 0.26, waterStressIdx: 0.85, floodRiskIdx: 0.68, riskScore: 91 },
  { id: "f-005", name: "Central Basin E", regionId: "dakota", commodity: "Soybeans", areaHa: 47.8, polygon: [[-93.24, 44.97], [-93.20, 44.97], [-93.20, 44.94], [-93.24, 44.94], [-93.24, 44.97]], latestNdvi: 0.55, waterStressIdx: 0.52, floodRiskIdx: 0.31, riskScore: 55 },
  { id: "f-006", name: "Hilltop F", regionId: "hennepin", commodity: "Wheat", areaHa: 33.9, polygon: [[-93.28, 45.04], [-93.24, 45.04], [-93.24, 45.01], [-93.28, 45.01], [-93.28, 45.04]], latestNdvi: 0.81, waterStressIdx: 0.18, floodRiskIdx: 0.08, riskScore: 12 },
];

const DEMO_ALERTS: DtAlert[] = [
  { id: "a-01", fieldId: "f-004", type: "Severe water stress", severity: "critical", message: "Water stress index exceeded 0.85 — immediate irrigation recommended for West Creek D.", occurredAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "a-02", fieldId: "f-002", type: "High temperature anomaly", severity: "high", message: "Surface temperature 3.2 °C above 30-day mean in South Valley B.", occurredAt: new Date(Date.now() - 5400000).toISOString() },
  { id: "a-03", fieldId: "f-004", type: "Flood risk elevated", severity: "high", message: "Flood risk index 0.68 — upstream precipitation may affect drainage in next 48 h.", occurredAt: new Date(Date.now() - 9000000).toISOString() },
  { id: "a-04", fieldId: "f-003", type: "NDVI decline", severity: "medium", message: "NDVI dropped 12 % over last 7 days in East Ridge C — possible pest or disease.", occurredAt: new Date(Date.now() - 14400000).toISOString() },
  { id: "a-05", fieldId: "f-005", type: "Water stress rising", severity: "medium", message: "Water stress index trending up for Central Basin E — monitor soil moisture.", occurredAt: new Date(Date.now() - 21600000).toISOString() },
  { id: "a-06", fieldId: "f-001", type: "Low rainfall", severity: "low", message: "Rainfall 40 % below normal for North Prairie A this period.", occurredAt: new Date(Date.now() - 28800000).toISOString() },
];

function generateTimeSeries(field: DtField): TimeSeries[] {
  const series: TimeSeries[] = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const jitter = () => (Math.random() - 0.5) * 0.08;
    series.push({
      date: d.toISOString().slice(0, 10),
      ndvi: Math.max(0, Math.min(1, field.latestNdvi + jitter() + (i / 60))),
      riskScore: Math.max(0, Math.min(1, (field.riskScore / 100) + jitter())),
      waterStressIdx: Math.max(0, Math.min(1, field.waterStressIdx + jitter())),
      floodRiskIdx: Math.max(0, Math.min(1, field.floodRiskIdx + jitter())),
      tempC: 22 + Math.random() * 8,
      rainfallMm: Math.random() * 20,
    });
  }
  return series;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, string> = {
    low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    medium: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    high: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    critical: "border-red-400/25 bg-red-500/10 text-red-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-tight ${styles[severity]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {severity.toUpperCase()}
    </span>
  );
}

type MetricTone = "primary" | "accent" | "warn" | "danger";
const TONE_RING: Record<MetricTone, string> = {
  primary: "ring-emerald-500/20 shadow-emerald-500/20",
  accent: "ring-cyan-400/18 shadow-cyan-400/20",
  warn: "ring-amber-400/18 shadow-amber-400/20",
  danger: "ring-red-500/18 shadow-red-500/20",
};

function MetricCard({ label, value, deltaPct, icon, tone = "primary" }: {
  label: string; value: ReactNode; deltaPct?: number | null; icon?: ReactNode; tone?: MetricTone;
}) {
  const delta = typeof deltaPct === "number" ? deltaPct : null;
  const up = delta !== null ? delta >= 0 : null;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 ring-1 shadow-[0_18px_60px_-20px] ${TONE_RING[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">{value}</div>
          {delta !== null && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold">
              {up ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-red-400" />}
              <span className={up ? "text-emerald-400" : "text-red-400"}>{Math.abs(delta).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {icon && <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">{icon}</div>}
      </div>
    </div>
  );
}

function SelectSimple({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40 transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-gray-900 text-white">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DigitalTwinClimate({ fullPage = false }: { fullPage?: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [isActivated, setIsActivated] = useState(fullPage);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [layer, setLayer] = useState<DtLayer>("ndvi");
  const [regionId, setRegionId] = useState<string>("all");
  const [commodity, setCommodity] = useState<string>("all");
  const [threshold, setThreshold] = useState(60);

  // Toggles
  const [showFields, setShowFields] = useState(true);
  const [wsConnected] = useState(true); // simulated

  // Selection
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<"alerts" | "analytics" | "stats">("alerts");

  // ── Derived ─────────────────────────────────────────────────────────────

  const filteredFields = useMemo(() => {
    return DEMO_FIELDS.filter(f => {
      if (regionId !== "all" && f.regionId !== regionId) return false;
      if (commodity !== "all" && f.commodity !== commodity) return false;
      return true;
    });
  }, [regionId, commodity]);

  const filteredAlerts = useMemo(() => {
    return DEMO_ALERTS.filter(a => {
      const field = DEMO_FIELDS.find(f => f.id === a.fieldId);
      if (!field) return false;
      if (regionId !== "all" && field.regionId !== regionId) return false;
      if (field.riskScore < threshold) return false;
      return true;
    });
  }, [regionId, threshold]);

  const kpis = useMemo(() => {
    const ff = filteredFields;
    if (!ff.length) return { cropHealth: 0, riskIndex: 0, waterStress: 0, floodWatch: 0 };
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      cropHealth: Math.round(avg(ff.map(f => f.latestNdvi * 100))),
      riskIndex: Math.round(avg(ff.map(f => f.riskScore))),
      waterStress: avg(ff.map(f => f.waterStressIdx)) * 100,
      floodWatch: ff.filter(f => f.floodRiskIdx > 0.5).length,
    };
  }, [filteredFields]);

  const selectedTimeSeries = useMemo(() => {
    if (!selectedFieldId) return [];
    const f = DEMO_FIELDS.find(x => x.id === selectedFieldId);
    if (!f) return [];
    return generateTimeSeries(f);
  }, [selectedFieldId]);

  const analyticsSeries = useMemo(() => {
    return filteredAlerts.map((a, i) => ({
      i: i + 1,
      severity: a.severity === "critical" ? 100 : a.severity === "high" ? 75 : a.severity === "medium" ? 45 : 20,
    }));
  }, [filteredAlerts]);

  const regionOptions = useMemo(() => {
    const ids = new Set(DEMO_FIELDS.map(f => f.regionId));
    return [
      { value: "all", label: "All regions" },
      ...Array.from(ids).sort().map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
    ];
  }, []);

  const commodityOptions = useMemo(() => {
    const ids = new Set(DEMO_FIELDS.map(f => f.commodity));
    return [
      { value: "all", label: "All commodities" },
      ...Array.from(ids).sort().map(c => ({ value: c, label: c })),
    ];
  }, []);

  // ── Map Init ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActivated || !mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "DT",
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OSM",
          },
        },
        layers: [
          { id: "osm", type: "raster", source: "osm", paint: { "raster-opacity": 0.75 } },
        ],
      },
      center: [-93.22, 44.98],
      zoom: 9.5,
      maxZoom: 18,
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-right");
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [isActivated]);

  // ── Render Fields ───────────────────────────────────────────────────────

  const getFillColor = useCallback((field: DtField): string => {
    if (layer === "ndvi") {
      if (field.latestNdvi < 0.3) return "rgba(239,68,68,0.5)";
      if (field.latestNdvi < 0.6) return "rgba(245,158,11,0.45)";
      return "rgba(16,185,129,0.4)";
    }
    if (layer === "water_stress") {
      if (field.waterStressIdx > 0.75) return "rgba(239,68,68,0.45)";
      if (field.waterStressIdx > 0.5) return "rgba(245,158,11,0.4)";
      return "rgba(56,189,248,0.35)";
    }
    if (layer === "flood_risk") {
      if (field.floodRiskIdx > 0.6) return "rgba(239,68,68,0.45)";
      if (field.floodRiskIdx > 0.35) return "rgba(245,158,11,0.4)";
      return "rgba(34,211,238,0.3)";
    }
    return "rgba(255,255,255,0.08)";
  }, [layer]);

  const renderFields = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing
    ["fields-fill", "fields-line"].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("fields")) map.removeSource("fields");

    if (!showFields) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filteredFields.map(f => ({
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [f.polygon] },
        properties: {
          id: f.id,
          name: f.name,
          color: getFillColor(f),
          selected: f.id === selectedFieldId ? 1 : 0,
        },
      })),
    };

    map.addSource("fields", { type: "geojson", data: geojson });
    map.addLayer({
      id: "fields-fill",
      type: "fill",
      source: "fields",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["case", ["==", ["get", "selected"], 1], 0.7, 0.4],
      },
    });
    map.addLayer({
      id: "fields-line",
      type: "line",
      source: "fields",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "selected"], 1],
          "rgba(16,185,129,0.95)",
          "rgba(148,163,184,0.45)",
        ],
        "line-width": ["case", ["==", ["get", "selected"], 1], 2.5, 1.2],
      },
    });

    map.on("click", "fields-fill", (e) => {
      const fid = e.features?.[0]?.properties?.id;
      if (fid) {
        setSelectedFieldId(fid);
        setDetailsOpen(true);
      }
    });
    map.on("mouseenter", "fields-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "fields-fill", () => {
      map.getCanvas().style.cursor = "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFields, showFields, layer, selectedFieldId, getFillColor]);

  useEffect(() => {
    if (mapLoaded) renderFields();
  }, [mapLoaded, renderFields]);

  // ── Placeholder (inline card preview) ───────────────────────────────────

  if (!isActivated) {
    return (
      <div
        onClick={() => setIsActivated(true)}
        className="relative cursor-pointer rounded-xl overflow-hidden h-[500px] bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-950 group"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <Waves className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Climate‑Smart Digital Twin</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Real‑time agricultural field monitoring with AI‑powered climate risk assessment
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold group-hover:bg-emerald-500 transition-colors">
              <Activity className="w-5 h-5" /> Launch Dashboard
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const dateTick = (v: string) => {
    try {
      return new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return v;
    }
  };

  // ── Main Dashboard ──────────────────────────────────────────────────────

  return (
    <div
      className={`relative w-full ${fullPage ? "min-h-screen" : "rounded-xl"} overflow-hidden bg-gray-950`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {fullPage && (
              <Link href="/">
                <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs mr-2">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </Link>
            )}
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-emerald-500/20 blur-xl" />
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                <Waves className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight text-white">
                Digital Twin <span className="text-white/50">· Climate‑Smart</span>
              </div>
              <div className="text-xs text-white/40">
                Field intelligence, risk signals, and agronomic foresight
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              <span
                className={`h-2 w-2 rounded-full ${wsConnected ? "bg-emerald-400" : "bg-white/30"}`}
              />
              {wsConnected ? "Live" : "Connecting"}
            </span>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Dashboard Body ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {/* Section heading */}
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Dashboard
          </div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">
            Climate‑Smart Twin
          </div>
          <div className="mt-1 text-sm text-white/50">
            Dial in a region, pick a layer, set a risk threshold, and watch your alert stream
            update in real time.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── LEFT PANEL ──────────────────────────────────────────── */}
          <motion.div
            className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Filters */}
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Filters
                  </div>
                  <div className="mt-1 text-lg font-extrabold tracking-tight text-white">
                    Scope &amp; thresholds
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/40">
                  <Factory className="h-4 w-4 text-emerald-400" />
                  Demo mode
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SelectSimple
                  label="Date range"
                  value={dateRange}
                  onChange={(v) => setDateRange(v as DateRange)}
                  options={[
                    { value: "7d", label: "Last 7 days" },
                    { value: "30d", label: "Last 30 days" },
                    { value: "90d", label: "Last 90 days" },
                  ]}
                />
                <SelectSimple
                  label="Layer"
                  value={layer}
                  onChange={(v) => setLayer(v as DtLayer)}
                  options={[
                    { value: "ndvi", label: "NDVI" },
                    { value: "rainfall_anom", label: "Rainfall anomaly" },
                    { value: "temp_anom", label: "Temp anomaly" },
                    { value: "flood_risk", label: "Flood risk" },
                    { value: "water_stress", label: "Water stress" },
                  ]}
                />
                <SelectSimple
                  label="Region"
                  value={regionId}
                  onChange={setRegionId}
                  options={regionOptions}
                />
                <SelectSimple
                  label="Commodity"
                  value={commodity}
                  onChange={setCommodity}
                  options={commodityOptions}
                />
              </div>

              {/* Risk threshold slider */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Risk threshold
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      Only show alerts at or above this score.
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-extrabold text-white">
                    {threshold}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="mt-3 w-full accent-emerald-500"
                />
              </div>

              {/* Toggles + Reset */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFields}
                    onChange={(e) => setShowFields(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span className="text-xs font-semibold text-white/60">Field polygons</span>
                </label>
                <button
                  onClick={() => {
                    setRegionId("all");
                    setCommodity("all");
                    setThreshold(60);
                    setLayer("ndvi");
                    setDateRange("30d");
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* KPI cards + Tabs */}
            <div className="p-5">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Crop health score"
                  value={kpis.cropHealth}
                  deltaPct={-2.3}
                  tone="primary"
                  icon={<Leaf className="h-5 w-5" />}
                />
                <MetricCard
                  label="Climate risk index"
                  value={kpis.riskIndex}
                  deltaPct={5.1}
                  tone="danger"
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
                <MetricCard
                  label="Water stress"
                  value={`${kpis.waterStress.toFixed(1)}%`}
                  deltaPct={3.8}
                  tone="warn"
                  icon={<Droplets className="h-5 w-5" />}
                />
                <MetricCard
                  label="Flood watch"
                  value={kpis.floodWatch}
                  deltaPct={null}
                  tone="accent"
                  icon={<Waves className="h-5 w-5" />}
                />
              </div>

              <div className="my-5 h-px bg-white/10" />

              {/* Tab bar */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1 grid grid-cols-3 gap-1 mb-4">
                {(["alerts", "analytics", "stats"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* ── Alerts Tab ─────────────────── */}
              {activeTab === "alerts" && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-extrabold tracking-tight text-white">
                        Recent alerts
                      </span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      {filteredAlerts.length}
                    </span>
                  </div>
                  <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                    {filteredAlerts.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                        <div className="text-sm font-semibold text-white/70">
                          No alerts for this scope
                        </div>
                        <div className="mt-1 text-xs text-white/40">
                          Try lowering the threshold or switching to a longer range.
                        </div>
                      </div>
                    ) : (
                      filteredAlerts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setSelectedFieldId(a.fieldId);
                            setDetailsOpen(true);
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <SeverityBadge severity={a.severity} />
                                <span className="text-sm font-extrabold tracking-tight text-white">
                                  {a.type}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-white/50 line-clamp-2">
                                {a.message}
                              </div>
                            </div>
                            <div className="text-[10px] text-white/30 whitespace-nowrap">
                              {new Date(a.occurredAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Analytics Tab ─────────────── */}
              {activeTab === "analytics" && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-extrabold tracking-tight text-white">
                      Alert intensity
                    </span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsSeries}
                        margin={{ left: 6, right: 10, top: 10, bottom: 0 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
                        <XAxis
                          dataKey="i"
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <ReTooltip
                          contentStyle={{
                            background: "rgba(15,15,20,0.92)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 16,
                          }}
                          labelFormatter={(l) => `Event ${l}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="severity"
                          stroke="url(#riskGrad)"
                          strokeWidth={2.4}
                          dot={false}
                        />
                        <defs>
                          <linearGradient id="riskGrad" x1="0" x2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Stats Tab ─────────────────── */}
              {activeTab === "stats" && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-extrabold tracking-tight text-white">
                      Scope stats
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "Fields", value: filteredFields.length },
                      {
                        label: "Regions",
                        value: new Set(filteredFields.map((f) => f.regionId)).size,
                      },
                      {
                        label: "Stressed fields",
                        value: filteredFields.filter((f) => f.waterStressIdx > 0.5).length,
                      },
                      {
                        label: "High risk",
                        value: filteredFields.filter((f) => f.riskScore > 70).length,
                      },
                    ] as const).map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          {stat.label}
                        </div>
                        <div className="mt-1 text-xl font-extrabold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT PANEL (Charts + Map) ──────────────────────────── */}
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            {/* Sparkline chart row */}
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {/* Selected field trend */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-extrabold tracking-tight text-white">
                      Selected field trend
                    </span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                    {selectedFieldId ? `${selectedFieldId.slice(0, 8)}…` : "None"}
                  </span>
                </div>
                <div className="h-40">
                  {!selectedFieldId ? (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-sm text-white/40">
                      Click a field on the map to preview NDVI &amp; risk.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedTimeSeries}
                        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={dateTick}
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          minTickGap={22}
                        />
                        <YAxis
                          domain={[0, 1]}
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <ReTooltip
                          contentStyle={{
                            background: "rgba(15,15,20,0.92)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 16,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="ndvi"
                          stroke="#10b981"
                          strokeWidth={2.2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="riskScore"
                          stroke="#ef4444"
                          strokeWidth={1.6}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Layer notes */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-extrabold tracking-tight text-white">
                      Layer notes
                    </span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                    {showFields ? "Polygons on" : "Polygons off"}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="font-semibold text-white">NDVI</span> emphasizes
                    vegetation vigor;{" "}
                    <span className="text-emerald-400">higher is healthier</span>.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="font-semibold text-white">Risk layers</span> surface
                    potential flooding or stress patterns. Pair with alerts to prioritize
                    scouting.
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 h-[700px] bg-white/[0.03] shadow-2xl shadow-black/50">
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
              <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

              {/* Map badges */}
              <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
                  Layer: <span className="text-emerald-400 ml-1">{layer}</span>
                </span>
              </div>
              <div className="absolute bottom-4 right-4 z-20">
                <div className="rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/50 backdrop-blur-md">
                  Click field polygons for details
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Field Detail Dialog ────────────────────────────────────── */}
      <AnimatePresence>
        {detailsOpen &&
          selectedFieldId &&
          (() => {
            const field = DEMO_FIELDS.find((f) => f.id === selectedFieldId);
            if (!field) return null;
            const fieldAlerts = DEMO_ALERTS.filter((a) => a.fieldId === field.id);
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedFieldId(null);
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-3xl w-full bg-gradient-to-b from-gray-900 to-gray-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                  {/* Dialog Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-white">
                        {field.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white/70">
                          {field.commodity}
                        </span>
                        <span className="text-xs">Region</span>
                        <span className="font-semibold text-white/80">{field.regionId}</span>
                        <span className="text-xs ml-2">{field.areaHa} ha</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDetailsOpen(false);
                        setSelectedFieldId(null);
                      }}
                      className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-5 p-5 md:grid-cols-3">
                    {/* NDVI Chart */}
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-sm font-bold tracking-tight text-white mb-1">
                          NDVI trend
                        </div>
                        <div className="text-xs text-white/40 mb-3">
                          Normalized Difference Vegetation Index
                        </div>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={selectedTimeSeries}
                              margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="4 6"
                              />
                              <XAxis
                                dataKey="date"
                                tickFormatter={dateTick}
                                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                                minTickGap={22}
                              />
                              <YAxis
                                domain={[0, 1]}
                                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                              />
                              <ReTooltip
                                contentStyle={{
                                  background: "rgba(15,15,20,0.92)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: 16,
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="ndvi"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#ndviFill)"
                              />
                              <Line
                                type="monotone"
                                dataKey="riskScore"
                                stroke="#ef4444"
                                strokeWidth={1.6}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Metrics sidebar */}
                    <div className="space-y-3">
                      {([
                        {
                          label: "NDVI",
                          value: field.latestNdvi.toFixed(2),
                          icon: <Leaf className="h-4 w-4 text-emerald-400" />,
                        },
                        {
                          label: "Water stress",
                          value: `${(field.waterStressIdx * 100).toFixed(0)}%`,
                          icon: <Droplets className="h-4 w-4 text-blue-400" />,
                        },
                        {
                          label: "Flood risk",
                          value: `${(field.floodRiskIdx * 100).toFixed(0)}%`,
                          icon: <Waves className="h-4 w-4 text-cyan-400" />,
                        },
                        {
                          label: "Risk score",
                          value: `${field.riskScore}`,
                          icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
                        },
                      ] as const).map((m) => (
                        <div
                          key={m.label}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {m.icon}
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                              {m.label}
                            </span>
                          </div>
                          <div className="text-lg font-extrabold text-white">{m.value}</div>
                        </div>
                      ))}

                      {fieldAlerts.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                            Active alerts
                          </div>
                          <div className="space-y-1.5">
                            {fieldAlerts.map((a) => (
                              <div key={a.id} className="flex items-center gap-2">
                                <SeverityBadge severity={a.severity} />
                                <span className="text-xs text-white/60 truncate">{a.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
