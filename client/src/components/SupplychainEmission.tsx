import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, PieChart, Pie, Legend as RLegend,
} from "recharts";
import {
  Leaf, Eye, EyeOff, Layers, MapPin, ChevronDown, ChevronRight,
  ChevronLeft, ChevronUp, X, ArrowLeft, HelpCircle, MousePointer2,
  Info, Truck, Factory, Users, Coffee, Map as MapIcon, Globe2,
  BarChart3, Search, Download, Copy, TreePine, ArrowDown,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA — Simulating a supply chain traceability + emission scenario
// ═══════════════════════════════════════════════════════════════════════════

// Actor types
type ActorType = "producer" | "trader" | "warehouse";

interface DemoActor {
  id: string;
  displayId: string;
  name: string;
  type: ActorType;
  lat: number;
  lng: number;
  district: string;
  details: Record<string, string | number>;
  emission?: EmissionBreakdown;
}

interface DemoTransaction {
  id: string;
  from: string; // actor id
  to: string;   // actor id
  commodity: string;
  grossKg: number;
  date: string;
}

interface EmissionBreakdown {
  totalCo2eq: number;
  sources: { source: string; value: number }[];
  ghg: { category: string; value: number }[];
}

// 10 Emission Sources (CoolFarmTool)
const EMISSION_SOURCES = [
  "Seed production",
  "Residue management",
  "Fertiliser production",
  "Soil / fertiliser",
  "Crop protection",
  "Carbon stock changes",
  "Energy use (field)",
  "Energy use (processing)",
  "Waste water",
  "Off-farm transport",
] as const;

// ── Demo Actors (Central Sulawesi — cocoa supply chain) ─────────────────

const DEMO_PRODUCERS: DemoActor[] = [
  {
    id: "P001", displayId: "FARM-001", name: "Ahmad Suleiman", type: "producer",
    lat: -1.435, lng: 120.780, district: "Parigi Moutong",
    details: { Gender: "Male", Age: 48, FarmArea: "2.5 ha", Commodity: "Cocoa", Transactions: 12, "Gross (MT)": "1.840" },
    emission: {
      totalCo2eq: 312.45,
      sources: [
        { source: "Seed production", value: 18.2 }, { source: "Residue management", value: -45.6 },
        { source: "Fertiliser production", value: 52.3 }, { source: "Soil / fertiliser", value: 89.7 },
        { source: "Crop protection", value: 12.4 }, { source: "Carbon stock changes", value: -28.9 },
        { source: "Energy use (field)", value: 35.8 }, { source: "Energy use (processing)", value: 78.2 },
        { source: "Waste water", value: 22.1 }, { source: "Off-farm transport", value: 78.25 },
      ],
      ghg: [{ category: "CO2", value: 198.5 }, { category: "N2O", value: 85.3 }, { category: "CH4", value: 28.65 }],
    },
  },
  {
    id: "P002", displayId: "FARM-002", name: "Budi Hartono", type: "producer",
    lat: -1.520, lng: 120.850, district: "Parigi Moutong",
    details: { Gender: "Male", Age: 55, FarmArea: "3.1 ha", Commodity: "Cocoa", Transactions: 8, "Gross (MT)": "2.150" },
    emission: {
      totalCo2eq: 445.80,
      sources: [
        { source: "Seed production", value: 22.1 }, { source: "Residue management", value: -38.2 },
        { source: "Fertiliser production", value: 68.5 }, { source: "Soil / fertiliser", value: 112.3 },
        { source: "Crop protection", value: 18.9 }, { source: "Carbon stock changes", value: -15.4 },
        { source: "Energy use (field)", value: 48.2 }, { source: "Energy use (processing)", value: 92.1 },
        { source: "Waste water", value: 31.5 }, { source: "Off-farm transport", value: 105.8 },
      ],
      ghg: [{ category: "CO2", value: 285.2 }, { category: "N2O", value: 112.4 }, { category: "CH4", value: 48.2 }],
    },
  },
  {
    id: "P003", displayId: "FARM-003", name: "Siti Aminah", type: "producer",
    lat: -1.380, lng: 120.720, district: "Donggala",
    details: { Gender: "Female", Age: 42, FarmArea: "1.8 ha", Commodity: "Cocoa", Transactions: 15, "Gross (MT)": "1.320" },
    emission: {
      totalCo2eq: 198.30,
      sources: [
        { source: "Seed production", value: 12.5 }, { source: "Residue management", value: -52.8 },
        { source: "Fertiliser production", value: 35.2 }, { source: "Soil / fertiliser", value: 62.1 },
        { source: "Crop protection", value: 8.7 }, { source: "Carbon stock changes", value: -42.3 },
        { source: "Energy use (field)", value: 28.4 }, { source: "Energy use (processing)", value: 55.6 },
        { source: "Waste water", value: 18.9 }, { source: "Off-farm transport", value: 72.0 },
      ],
      ghg: [{ category: "CO2", value: 125.8 }, { category: "N2O", value: 52.1 }, { category: "CH4", value: 20.4 }],
    },
  },
  {
    id: "P004", displayId: "FARM-004", name: "Muhammad Rizki", type: "producer",
    lat: -1.600, lng: 120.900, district: "Sigi",
    details: { Gender: "Male", Age: 38, FarmArea: "4.2 ha", Commodity: "Cocoa", Transactions: 10, "Gross (MT)": "3.450" },
    emission: {
      totalCo2eq: 578.20,
      sources: [
        { source: "Seed production", value: 28.4 }, { source: "Residue management", value: -32.1 },
        { source: "Fertiliser production", value: 85.6 }, { source: "Soil / fertiliser", value: 145.2 },
        { source: "Crop protection", value: 24.8 }, { source: "Carbon stock changes", value: -18.6 },
        { source: "Energy use (field)", value: 58.9 }, { source: "Energy use (processing)", value: 112.4 },
        { source: "Waste water", value: 38.2 }, { source: "Off-farm transport", value: 135.3 },
      ],
      ghg: [{ category: "CO2", value: 378.4 }, { category: "N2O", value: 142.8 }, { category: "CH4", value: 57.0 }],
    },
  },
  {
    id: "P005", displayId: "FARM-005", name: "Dewi Lestari", type: "producer",
    lat: -1.420, lng: 121.000, district: "Poso",
    details: { Gender: "Female", Age: 35, FarmArea: "2.0 ha", Commodity: "Cocoa", Transactions: 6, "Gross (MT)": "1.580" },
    emission: {
      totalCo2eq: 265.40,
      sources: [
        { source: "Seed production", value: 15.8 }, { source: "Residue management", value: -48.2 },
        { source: "Fertiliser production", value: 42.1 }, { source: "Soil / fertiliser", value: 78.9 },
        { source: "Crop protection", value: 10.5 }, { source: "Carbon stock changes", value: -35.7 },
        { source: "Energy use (field)", value: 32.6 }, { source: "Energy use (processing)", value: 68.3 },
        { source: "Waste water", value: 24.8 }, { source: "Off-farm transport", value: 76.3 },
      ],
      ghg: [{ category: "CO2", value: 168.5 }, { category: "N2O", value: 68.2 }, { category: "CH4", value: 28.7 }],
    },
  },
  {
    id: "P006", displayId: "FARM-006", name: "Hasan Basri", type: "producer",
    lat: -1.550, lng: 120.700, district: "Donggala",
    details: { Gender: "Male", Age: 52, FarmArea: "3.5 ha", Commodity: "Cocoa", Transactions: 9, "Gross (MT)": "2.780" },
    emission: {
      totalCo2eq: 485.60,
      sources: [
        { source: "Seed production", value: 25.1 }, { source: "Residue management", value: -35.8 },
        { source: "Fertiliser production", value: 72.4 }, { source: "Soil / fertiliser", value: 128.6 },
        { source: "Crop protection", value: 20.2 }, { source: "Carbon stock changes", value: -22.4 },
        { source: "Energy use (field)", value: 52.8 }, { source: "Energy use (processing)", value: 98.5 },
        { source: "Waste water", value: 35.6 }, { source: "Off-farm transport", value: 110.6 },
      ],
      ghg: [{ category: "CO2", value: 312.8 }, { category: "N2O", value: 118.5 }, { category: "CH4", value: 54.3 }],
    },
  },
  {
    id: "P007", displayId: "FARM-007", name: "Nurul Hidayah", type: "producer",
    lat: -1.350, lng: 120.950, district: "Poso",
    details: { Gender: "Female", Age: 29, FarmArea: "1.5 ha", Commodity: "Coffee", Transactions: 7, "Gross (MT)": "0.950" },
    emission: {
      totalCo2eq: 152.80,
      sources: [
        { source: "Seed production", value: 9.8 }, { source: "Residue management", value: -58.4 },
        { source: "Fertiliser production", value: 28.5 }, { source: "Soil / fertiliser", value: 48.2 },
        { source: "Crop protection", value: 6.8 }, { source: "Carbon stock changes", value: -48.6 },
        { source: "Energy use (field)", value: 22.1 }, { source: "Energy use (processing)", value: 45.8 },
        { source: "Waste water", value: 15.2 }, { source: "Off-farm transport", value: 83.3 },
      ],
      ghg: [{ category: "CO2", value: 95.2 }, { category: "N2O", value: 38.8 }, { category: "CH4", value: 18.8 }],
    },
  },
  {
    id: "P008", displayId: "FARM-008", name: "Andi Prasetyo", type: "producer",
    lat: -1.480, lng: 120.650, district: "Donggala",
    details: { Gender: "Male", Age: 44, FarmArea: "2.8 ha", Commodity: "Cocoa", Transactions: 11, "Gross (MT)": "2.220" },
    emission: {
      totalCo2eq: 395.10,
      sources: [
        { source: "Seed production", value: 20.5 }, { source: "Residue management", value: -40.2 },
        { source: "Fertiliser production", value: 58.8 }, { source: "Soil / fertiliser", value: 102.4 },
        { source: "Crop protection", value: 16.2 }, { source: "Carbon stock changes", value: -25.8 },
        { source: "Energy use (field)", value: 42.5 }, { source: "Energy use (processing)", value: 85.2 },
        { source: "Waste water", value: 28.4 }, { source: "Off-farm transport", value: 107.1 },
      ],
      ghg: [{ category: "CO2", value: 252.4 }, { category: "N2O", value: 98.5 }, { category: "CH4", value: 44.2 }],
    },
  },
];

const DEMO_TRADERS: DemoActor[] = [
  {
    id: "T001", displayId: "TRAD-001", name: "CV. Sulawesi Cocoa Trade", type: "trader",
    lat: -1.400, lng: 120.800, district: "Parigi Moutong",
    details: { Company: "CV. Sulawesi Cocoa Trade", Phone: "+62 812-XXXX-XXX", Type: "Collector/Trader", Address: "Jl. Raya Parigi No. 45", Transactions: 35, "Volume (MT)": "8.120" },
    emission: {
      totalCo2eq: 1245.30,
      sources: [
        { source: "Seed production", value: 0 }, { source: "Residue management", value: 0 },
        { source: "Fertiliser production", value: 0 }, { source: "Soil / fertiliser", value: 0 },
        { source: "Crop protection", value: 0 }, { source: "Carbon stock changes", value: 0 },
        { source: "Energy use (field)", value: 0 }, { source: "Energy use (processing)", value: 485.2 },
        { source: "Waste water", value: 128.4 }, { source: "Off-farm transport", value: 631.7 },
      ],
      ghg: [{ category: "CO2", value: 892.5 }, { category: "N2O", value: 245.8 }, { category: "CH4", value: 107.0 }],
    },
  },
  {
    id: "T002", displayId: "TRAD-002", name: "PT. Agro Palu Sejahtera", type: "trader",
    lat: -1.500, lng: 120.750, district: "Donggala",
    details: { Company: "PT. Agro Palu Sejahtera", Phone: "+62 813-XXXX-XXX", Type: "Collector/Trader", Address: "Jl. Trans Sulawesi Km. 12", Transactions: 28, "Volume (MT)": "6.850" },
    emission: {
      totalCo2eq: 985.60,
      sources: [
        { source: "Seed production", value: 0 }, { source: "Residue management", value: 0 },
        { source: "Fertiliser production", value: 0 }, { source: "Soil / fertiliser", value: 0 },
        { source: "Crop protection", value: 0 }, { source: "Carbon stock changes", value: 0 },
        { source: "Energy use (field)", value: 0 }, { source: "Energy use (processing)", value: 382.1 },
        { source: "Waste water", value: 95.8 }, { source: "Off-farm transport", value: 507.7 },
      ],
      ghg: [{ category: "CO2", value: 712.8 }, { category: "N2O", value: 185.2 }, { category: "CH4", value: 87.6 }],
    },
  },
];

const DEMO_WAREHOUSE: DemoActor = {
  id: "W001", displayId: "WH-001", name: "Palu Export Warehouse", type: "warehouse",
  lat: -0.900, lng: 119.870, district: "Palu",
  details: { Company: "PT. Cargill Indonesia", Phone: "+62 451-XXXX-XXX", Type: "Warehouse / Export", Address: "Pelabuhan Pantoloan, Palu", Transactions: 63, "Volume (MT)": "14.970", Capacity: "5,000 MT" },
  emission: {
    totalCo2eq: 2845.20,
    sources: [
      { source: "Seed production", value: 0 }, { source: "Residue management", value: 0 },
      { source: "Fertiliser production", value: 0 }, { source: "Soil / fertiliser", value: 0 },
      { source: "Crop protection", value: 0 }, { source: "Carbon stock changes", value: 0 },
      { source: "Energy use (field)", value: 0 }, { source: "Energy use (processing)", value: 1285.4 },
      { source: "Waste water", value: 342.8 }, { source: "Off-farm transport", value: 1217.0 },
    ],
    ghg: [{ category: "CO2", value: 1985.2 }, { category: "N2O", value: 582.4 }, { category: "CH4", value: 277.6 }],
  },
};

const ALL_ACTORS: DemoActor[] = [...DEMO_PRODUCERS, ...DEMO_TRADERS, DEMO_WAREHOUSE];

// Demo transactions: producers → traders → warehouse
const DEMO_TRANSACTIONS: DemoTransaction[] = [
  // Producers → Trader 1
  { id: "TX001", from: "P001", to: "T001", commodity: "Cocoa", grossKg: 500, date: "2025-01-15" },
  { id: "TX002", from: "P002", to: "T001", commodity: "Cocoa", grossKg: 620, date: "2025-01-18" },
  { id: "TX003", from: "P004", to: "T001", commodity: "Cocoa", grossKg: 850, date: "2025-01-20" },
  { id: "TX004", from: "P005", to: "T001", commodity: "Cocoa", grossKg: 380, date: "2025-01-22" },
  // Producers → Trader 2
  { id: "TX005", from: "P003", to: "T002", commodity: "Cocoa", grossKg: 440, date: "2025-01-16" },
  { id: "TX006", from: "P006", to: "T002", commodity: "Cocoa", grossKg: 720, date: "2025-01-19" },
  { id: "TX007", from: "P007", to: "T002", commodity: "Coffee", grossKg: 280, date: "2025-01-21" },
  { id: "TX008", from: "P008", to: "T002", commodity: "Cocoa", grossKg: 580, date: "2025-01-23" },
  // Traders → Warehouse
  { id: "TX009", from: "T001", to: "W001", commodity: "Cocoa", grossKg: 2350, date: "2025-01-28" },
  { id: "TX010", from: "T002", to: "W001", commodity: "Cocoa", grossKg: 2020, date: "2025-01-30" },
];

// Farm polygons (simplified rectangles around producer locations)
function generateFarmPolygon(lat: number, lng: number, sizeKm: number): [number, number][] {
  const d = sizeKm / 111.0; // rough degree conversion
  return [
    [lng - d, lat - d],
    [lng + d, lat - d],
    [lng + d, lat + d],
    [lng - d, lat + d],
    [lng - d, lat - d],
  ];
}

// Actor color scheme
const ACTOR_COLORS: Record<ActorType, string> = {
  producer: "#2BBE72",
  trader: "#E28D00",
  warehouse: "#5C0E16",
};

const LINE_COLORS: Record<string, string> = {
  "producer-trader": "#2BBE72",
  "trader-warehouse": "#E28D00",
};

const EMISSION_COLORS = {
  positive: "#814c46",
  negative: "#2bbe72",
} as const;

const EMISSION_GRADIENT = [
  { stop: 0, color: "#2bbe72" },
  { stop: 0.3, color: "#f5e653" },
  { stop: 0.6, color: "#f5a623" },
  { stop: 1.0, color: "#d0021b" },
];

// Calculate aggregate emission summary
function calcEmissionSummary() {
  const total = ALL_ACTORS.reduce((sum, a) => sum + (a.emission?.totalCo2eq ?? 0), 0);
  const bySource: Record<string, number> = {};
  EMISSION_SOURCES.forEach(s => { bySource[s] = 0; });
  ALL_ACTORS.forEach(a => {
    a.emission?.sources.forEach(src => {
      bySource[src.source] = (bySource[src.source] ?? 0) + src.value;
    });
  });
  return {
    total,
    chartSource: EMISSION_SOURCES.map(s => ({
      source: s,
      value: Math.round((bySource[s] ?? 0) * 100) / 100,
    })),
  };
}

type BasemapKey = "osm" | "satellite" | "dark";

const BASEMAPS: Record<BasemapKey, { label: string; tiles: string; attr: string }> = {
  osm: { label: "Street", tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OSM" },
  satellite: { label: "Satellite", tiles: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  dark: { label: "Dark", tiles: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: "© CARTO" },
};

type CalculationType = "AVERAGE PER FARMER" | "AVERAGE PER HECTARE" | "AVERAGE PER TON CROP" | "SUM OF ALL FARMERS";

const CALCULATION_TYPES: CalculationType[] = [
  "AVERAGE PER FARMER", "AVERAGE PER HECTARE", "AVERAGE PER TON CROP", "SUM OF ALL FARMERS",
];

function getEmissionUnit(calc: CalculationType): string {
  switch (calc) {
    case "AVERAGE PER FARMER": return "kgCO2eq/Farmer";
    case "AVERAGE PER HECTARE": return "kgCO2eq/Hectare";
    case "AVERAGE PER TON CROP": return "kgCO2eq/Ton Crop";
    case "SUM OF ALL FARMERS": return "kgCO2eq";
  }
}

// GHG donut colors
const GHG_COLORS = ["#ff6384", "#36a2eb", "#ffce56"];

// ═══════════════════════════════════════════════════════════════════════════
// GUIDE STEPS
// ═══════════════════════════════════════════════════════════════════════════

const GUIDE_STEPS = [
  { title: "Supply Chain Map", description: "Interactive map showing producers, traders, and warehouses connected through commodity transactions.", icon: MapIcon },
  { title: "Click Actors", description: "Click on any marker to see actor profile, transaction history, and carbon emission breakdown.", icon: MousePointer2 },
  { title: "Emission Overlay", description: "Toggle the emission heatmap to visualize CO2 intensity across the supply chain.", icon: Leaf },
  { title: "Emission Dashboard", description: "View total emissions by source with detailed charts in the bottom panel.", icon: BarChart3 },
  { title: "Legend Panel", description: "Use the legend panel on the left to toggle data layers on/off.", icon: Layers },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SupplychainEmission({ fullPage = false }: { fullPage?: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [isActivated, setIsActivated] = useState(fullPage);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemap, setBasemap] = useState<BasemapKey>("osm");

  // Panels
  const [showLegend, setShowLegend] = useState(true);
  const [showEmissionDash, setShowEmissionDash] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [guideStep, setGuideStep] = useState(0);

  // Selection
  const [selectedActor, setSelectedActor] = useState<DemoActor | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "transaction" | "emission">("profile");

  // Layer visibility
  const [showProducers, setShowProducers] = useState(true);
  const [showTraders, setShowTraders] = useState(true);
  const [showWarehouse, setShowWarehouse] = useState(true);
  const [showPolylines, setShowPolylines] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showEmissionHeatmap, setShowEmissionHeatmap] = useState(true);

  // Emission filter state
  const [emissionYear] = useState(2025);
  const [emissionCalc, setEmissionCalc] = useState<CalculationType>("AVERAGE PER FARMER");

  // Filter state (simulated)
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const emissionSummary = useMemo(() => calcEmissionSummary(), []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getActorTransactions = useCallback((actorId: string) => {
    return DEMO_TRANSACTIONS.filter(t => t.from === actorId || t.to === actorId);
  }, []);

  const getActorById = useCallback((id: string) => ALL_ACTORS.find(a => a.id === id), []);

  // ── Map Init ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActivated || !mapContainer.current || mapRef.current) return;

    const bm = BASEMAPS[basemap];
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "Supplychain Emission",
        sources: {
          basemap: { type: "raster", tiles: [bm.tiles], tileSize: 256, attribution: bm.attr },
        },
        layers: [
          { id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } },
        ],
      },
      center: [120.5, -1.3],
      zoom: 8,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-right");
    map.on("load", () => {
      setMapLoaded(true);
      // Auto-render supply chain on initial load
      setTimeout(() => {
        setIsProcessed(true);
      }, 100);
    });
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; setMapLoaded(false); };
  }, [isActivated]);

  // ── Switch Basemap ──────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const bm = BASEMAPS[basemap];
    if (map.getLayer("basemap")) map.removeLayer("basemap");
    if (map.getSource("basemap")) map.removeSource("basemap");
    map.addSource("basemap", { type: "raster", tiles: [bm.tiles], tileSize: 256, attribution: bm.attr });
    const firstLayer = map.getStyle().layers?.[0]?.id;
    map.addLayer({ id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } }, firstLayer);
  }, [basemap, mapLoaded]);

  // ── Auto-render supply chain when processed ────────────────────────────

  useEffect(() => {
    if (isProcessed && mapLoaded && mapRef.current) {
      renderSupplyChain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessed, mapLoaded]);

  // ── Render Supply Chain Data ────────────────────────────────────────────

  const renderSupplyChain = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove previous layers/sources
    const layerIds = [
      "farm-polygons-fill", "farm-polygons-outline",
      "transactions-line", "actors-circle", "actors-label",
      "emission-heatmap",
    ];
    layerIds.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    ["farms", "transactions", "actors", "emission-heat"].forEach(id => { if (map.getSource(id)) map.removeSource(id); });

    // 1. Farm Polygons
    const farmGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: DEMO_PRODUCERS.map(p => ({
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [generateFarmPolygon(p.lat, p.lng, 0.8)] },
        properties: { id: p.id, name: p.name },
      })),
    };

    map.addSource("farms", { type: "geojson", data: farmGeoJson });
    map.addLayer({
      id: "farm-polygons-fill", type: "fill", source: "farms",
      paint: { "fill-color": "#1F4788", "fill-opacity": showPolygons ? 0.25 : 0 },
    });
    map.addLayer({
      id: "farm-polygons-outline", type: "line", source: "farms",
      paint: { "line-color": "#1F4788", "line-width": 1.5, "line-opacity": showPolygons ? 0.6 : 0 },
    });

    // 2. Transaction Polylines
    const txGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: DEMO_TRANSACTIONS.map(tx => {
        const from = getActorById(tx.from)!;
        const to = getActorById(tx.to)!;
        const fromType = from.type;
        const toType = to.type;
        const colorKey = `${fromType}-${toType}`;
        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
          },
          properties: { id: tx.id, color: LINE_COLORS[colorKey] ?? "#999" },
        };
      }),
    };

    map.addSource("transactions", { type: "geojson", data: txGeoJson });
    map.addLayer({
      id: "transactions-line", type: "line", source: "transactions",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": showPolylines ? 0.8 : 0,
        "line-dasharray": [4, 2],
      },
    });

    // 3. Actor markers
    const actorGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: ALL_ACTORS.filter(a => {
        if (a.type === "producer" && !showProducers) return false;
        if (a.type === "trader" && !showTraders) return false;
        if (a.type === "warehouse" && !showWarehouse) return false;
        return true;
      }).map(a => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [a.lng, a.lat] },
        properties: {
          id: a.id,
          name: a.name,
          type: a.type,
          color: ACTOR_COLORS[a.type],
          radius: a.type === "warehouse" ? 10 : a.type === "trader" ? 8 : 6,
          emission: a.emission?.totalCo2eq ?? 0,
        },
      })),
    };

    map.addSource("actors", { type: "geojson", data: actorGeoJson });
    map.addLayer({
      id: "actors-circle", type: "circle", source: "actors",
      paint: {
        "circle-color": showEmissionHeatmap
          ? [
              "interpolate", ["linear"], ["get", "emission"],
              0, "#2bbe72",
              300, "#f5e653",
              500, "#f5a623",
              800, "#d0021b",
            ] as any
          : ["get", "color"],
        "circle-radius": ["get", "radius"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });
    map.addLayer({
      id: "actors-label", type: "symbol", source: "actors",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
        "text-optional": true,
      },
      paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 1 },
    });

    // 4. Emission Heatmap (separate layer)
    const heatGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: ALL_ACTORS.filter(a => a.emission).map(a => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [a.lng, a.lat] },
        properties: { emission: a.emission!.totalCo2eq },
      })),
    };

    map.addSource("emission-heat", { type: "geojson", data: heatGeoJson });
    map.addLayer({
      id: "emission-heatmap", type: "heatmap", source: "emission-heat",
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "emission"], 0, 0, 3000, 1],
        "heatmap-intensity": 1.2,
        "heatmap-radius": 40,
        "heatmap-opacity": showEmissionHeatmap ? 0.55 : 0,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(43,190,114,0)",
          0.2, "rgb(43,190,114)",
          0.4, "rgb(245,230,83)",
          0.6, "rgb(245,166,35)",
          0.8, "rgb(208,2,27)",
          1, "rgb(139,0,0)",
        ],
      },
    }, "actors-circle");

    // 5. Click handler
    map.on("click", "actors-circle", (e) => {
      if (e.features?.[0]) {
        const actorId = e.features[0].properties?.id;
        const actor = ALL_ACTORS.find(a => a.id === actorId);
        if (actor) {
          setSelectedActor(actor);
          setDetailTab("profile");
        }
      }
    });
    map.on("mouseenter", "actors-circle", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "actors-circle", () => { map.getCanvas().style.cursor = ""; });

    // Fit bounds
    const lngs = ALL_ACTORS.map(a => a.lng);
    const lats = ALL_ACTORS.map(a => a.lat);
    map.fitBounds(
      [[Math.min(...lngs) - 0.2, Math.min(...lats) - 0.2], [Math.max(...lngs) + 0.2, Math.max(...lats) + 0.2]],
      { padding: 60, maxZoom: 10, duration: 1500 },
    );

    setIsProcessed(true);
  }, [mapLoaded, showProducers, showTraders, showWarehouse, showPolylines, showPolygons, showEmissionHeatmap, getActorById]);

  // Update layer visibility without full re-render
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !isProcessed) return;
    renderSupplyChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProducers, showTraders, showWarehouse, showPolylines, showPolygons, showEmissionHeatmap]);

  // ── Placeholder (click to activate) ─────────────────────────────────────

  if (!isActivated) {
    return (
      <div
        className="relative w-full h-[500px] rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setIsActivated(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-amber-900/60 to-red-900/50 z-10 flex flex-col items-center justify-center gap-4">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
              <Leaf className="w-10 h-10 text-emerald-400" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-white">Supplychain Emission Tracker</h3>
          <p className="text-sm text-white/70 max-w-md text-center">
            Interactive supply chain traceability map with integrated CoolFarmTool carbon emission analysis
          </p>
          <span className="text-xs text-emerald-300 font-mono mt-2">Click to activate</span>
        </div>
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=60&w=1200"
          alt="Supply chain"
          className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
        />
      </div>
    );
  }

  // ── Active Actor Transactions ───────────────────────────────────────────

  const actorTxs = selectedActor ? getActorTransactions(selectedActor.id) : [];

  // ── Render ──────────────────────────────────────────────────────────────

  const sz = fullPage ? "text-sm" : "text-xs";
  const szSm = fullPage ? "text-xs" : "text-[10px]";
  const szTitle = fullPage ? "text-base font-semibold" : "text-xs font-semibold";
  const szLabel = fullPage ? "text-sm" : "text-[10px]";
  const szInput = fullPage ? "text-sm h-9 px-2.5 py-1.5 rounded-lg" : "text-[10px] px-1.5 py-1 rounded";
  const panelPad = fullPage ? "p-4" : "p-3";
  const sectionPad = fullPage ? "p-3.5" : "p-2.5";
  const sectionGap = fullPage ? "space-y-3" : "space-y-2";

  return (
    <div className={`relative w-full ${fullPage ? "h-screen" : "h-[500px] rounded-xl"} overflow-hidden bg-gray-900`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          {fullPage && (
            <Link href="/">
              <button className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Leaf className={`${fullPage ? "w-4 h-4" : "w-3.5 h-3.5"} text-emerald-400`} />
            <span className={`${szTitle} text-white`}>Supplychain Emission Tracker</span>
          </div>
          <span className={`${szSm} text-white/40 hidden sm:inline`}>
            Central Sulawesi · Cocoa & Coffee
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Basemap Switcher */}
          {(Object.keys(BASEMAPS) as BasemapKey[]).map(key => (
            <button
              key={key}
              onClick={() => setBasemap(key)}
              className={`px-2 py-1 rounded ${szSm} transition-colors ${
                basemap === key
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {BASEMAPS[key].label}
            </button>
          ))}

          <button
            onClick={() => setShowGuide(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 ml-2 ${szSm}`}
            title="View Guide - Click actors on map to see details"
          >
            <HelpCircle className={fullPage ? "w-4 h-4" : "w-3.5 h-3.5"} />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>

      {/* ─── Filter / Legend Panel (Left) ─────────────────────────────── */}
      <div
        className={`absolute z-10 transition-all duration-300 ${
          fullPage ? "top-[52px] left-3" : "top-[44px] left-2"
        } ${filterCollapsed ? "w-[32px]" : fullPage ? "w-[320px]" : "w-[240px]"}`}
      >
        <div className="bg-black/70 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden max-h-[calc(100vh-70px)]">
          {filterCollapsed ? (
            <button
              onClick={() => setFilterCollapsed(false)}
              className="p-2 text-white/60 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className={`${panelPad} overflow-y-auto max-h-[calc(100vh-70px)] scrollbar-thin`}>
              {/* Header */}
              <div className={`flex items-center justify-between ${fullPage ? "mb-4" : "mb-3"}`}>
                <span className={`${szTitle} text-white`}>Filter & Legend</span>
                <button onClick={() => setFilterCollapsed(true)} className="text-white/40 hover:text-white">
                  <ChevronLeft className={fullPage ? "w-5 h-5" : "w-4 h-4"} />
                </button>
              </div>

              {/* Simulated Filter */}
              <div className={`bg-white/5 rounded-xl ${sectionPad} ${fullPage ? "mb-4" : "mb-3"} ${sectionGap}`}>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>From</label>
                  <input type="date" defaultValue="2025-01-01" className={`w-full ${szInput} bg-white/10 text-white border border-white/10`} />
                </div>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>To</label>
                  <input type="date" defaultValue="2025-12-31" className={`w-full ${szInput} bg-white/10 text-white border border-white/10`} />
                </div>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>Commodity</label>
                  <select className={`w-full ${szInput} bg-white/10 text-white border border-white/10`}>
                    <option value="cocoa">Cocoa</option>
                    <option value="coffee">Coffee</option>
                  </select>
                </div>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>Destination</label>
                  <select className={`w-full ${szInput} bg-white/10 text-white border border-white/10`}>
                    <option value="palu">Palu Export WH</option>
                  </select>
                </div>
                <button
                  onClick={() => renderSupplyChain()}
                  className={`w-full ${fullPage ? "py-2.5 text-sm" : "py-1.5 text-[10px]"} bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors`}
                >
                  Process
                </button>
              </div>

              {/* Emission Filter */}
              <div className={`bg-white/5 rounded-xl ${sectionPad} ${fullPage ? "mb-4" : "mb-3"} ${sectionGap}`}>
                <div className={`flex items-center gap-1.5 ${fullPage ? "mb-1.5" : "mb-1"}`}>
                  <Leaf className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-emerald-400`} />
                  <span className={`${szLabel} text-emerald-300 font-medium`}>Emission (CFT)</span>
                </div>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>Year</label>
                  <select className={`w-full ${szInput} bg-white/10 text-white border border-white/10`} value={emissionYear} onChange={() => {}}>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
                <div>
                  <label className={`${szLabel} text-white/50 block ${fullPage ? "mb-1" : "mb-0.5"}`}>Calculation</label>
                  <select
                    className={`w-full ${szInput} bg-white/10 text-white border border-white/10`}
                    value={emissionCalc}
                    onChange={e => setEmissionCalc(e.target.value as CalculationType)}
                  >
                    {CALCULATION_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Legend - Actors */}
              <div className={`${fullPage ? "space-y-2 mb-4" : "space-y-1.5 mb-3"}`}>
                <span className={`${szLabel} text-white/40 font-medium uppercase tracking-wider`}>Actors</span>
                {([
                  { label: `Producers (${DEMO_PRODUCERS.length})`, color: ACTOR_COLORS.producer, visible: showProducers, toggle: setShowProducers },
                  { label: `Traders (${DEMO_TRADERS.length})`, color: ACTOR_COLORS.trader, visible: showTraders, toggle: setShowTraders },
                  { label: `Warehouse (1)`, color: ACTOR_COLORS.warehouse, visible: showWarehouse, toggle: setShowWarehouse },
                ] as const).map(item => (
                  <button
                    key={item.label}
                    onClick={() => item.toggle(!item.visible)}
                    className={`flex items-center gap-2 w-full ${fullPage ? "px-2.5 py-1.5" : "px-2 py-1"} rounded-lg text-left transition-colors ${
                      item.visible ? "bg-white/5" : "opacity-40"
                    }`}
                  >
                    <div className={`${fullPage ? "w-3.5 h-3.5" : "w-3 h-3"} rounded-full border border-white/30`} style={{ backgroundColor: item.color }} />
                    <span className={`${szLabel} text-white/80 flex-1`}>{item.label}</span>
                    {item.visible ? <Eye className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-white/40`} /> : <EyeOff className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-white/20`} />}
                  </button>
                ))}
              </div>

              {/* Legend - Layers */}
              <div className={`${fullPage ? "space-y-2 mb-4" : "space-y-1.5 mb-3"}`}>
                <span className={`${szLabel} text-white/40 font-medium uppercase tracking-wider`}>Layers</span>
                {([
                  { label: "Farm Polygons", color: "#1F4788", visible: showPolygons, toggle: setShowPolygons },
                  { label: "Transaction Lines", color: "#2BBE72", visible: showPolylines, toggle: setShowPolylines },
                ] as const).map(item => (
                  <button
                    key={item.label}
                    onClick={() => item.toggle(!item.visible)}
                    className={`flex items-center gap-2 w-full ${fullPage ? "px-2.5 py-1.5" : "px-2 py-1"} rounded-lg text-left transition-colors ${
                      item.visible ? "bg-white/5" : "opacity-40"
                    }`}
                  >
                    <div className={`${fullPage ? "w-3.5 h-3.5" : "w-3 h-3"} rounded`} style={{ backgroundColor: item.color, opacity: 0.6 }} />
                    <span className={`${szLabel} text-white/80 flex-1`}>{item.label}</span>
                    {item.visible ? <Eye className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-white/40`} /> : <EyeOff className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-white/20`} />}
                  </button>
                ))}

                {/* Emission Heatmap Toggle */}
                <button
                  onClick={() => setShowEmissionHeatmap(!showEmissionHeatmap)}
                  className={`flex items-center gap-2 w-full ${fullPage ? "px-2.5 py-1.5" : "px-2 py-1"} rounded-lg text-left transition-colors ${
                    showEmissionHeatmap ? "bg-emerald-500/10 border border-emerald-500/20" : "opacity-40"
                  }`}
                >
                  <Leaf className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-emerald-400`} />
                  <span className={`${szLabel} text-emerald-300 flex-1`}>Emission Heatmap</span>
                  {showEmissionHeatmap ? <Eye className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-emerald-400/60`} /> : <EyeOff className={`${fullPage ? "w-4 h-4" : "w-3 h-3"} text-white/20`} />}
                </button>
              </div>

              {/* Emission Gradient Legend */}
              {showEmissionHeatmap && (
                <div className={`${fullPage ? "space-y-1.5 mb-4" : "space-y-1 mb-3"}`}>
                  <span className={`${szLabel} text-white/40`}>Emission Intensity</span>
                  <div className={`${fullPage ? "h-3" : "h-2"} rounded-full`} style={{
                    background: `linear-gradient(90deg, ${EMISSION_GRADIENT.map(g => g.color).join(", ")})`,
                  }} />
                  <div className="flex justify-between">
                    <span className={`${szLabel} text-emerald-400`}>Low</span>
                    <span className={`${szLabel} text-red-400`}>High</span>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              {isProcessed && (
                <div className={`mt-3 bg-white/5 rounded-xl ${sectionPad} ${fullPage ? "space-y-1.5" : "space-y-1"}`}>
                  <span className={`${szLabel} text-white/40 font-medium`}>Summary</span>
                  <div className={`${szLabel} text-white/70`}>Producers: <strong className="text-white">{DEMO_PRODUCERS.length}</strong></div>
                  <div className={`${szLabel} text-white/70`}>Traders: <strong className="text-white">{DEMO_TRADERS.length}</strong></div>
                  <div className={`${szLabel} text-white/70`}>Warehouses: <strong className="text-white">1</strong></div>
                  <div className={`${szLabel} text-white/70`}>Transactions: <strong className="text-white">{DEMO_TRANSACTIONS.length}</strong></div>
                  <div className={`${szLabel} text-emerald-300`}>
                    Total CO₂eq: <strong>{emissionSummary.total.toLocaleString("en", { maximumFractionDigits: 1 })} kg</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Actor Detail Panel (Right) ──────────────────────────────── */}
      <AnimatePresence>
        {selectedActor && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className={`absolute z-20 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden ${
              fullPage
                ? "top-[60px] right-3 w-[380px] max-h-[calc(100vh-80px)]"
                : "top-[50px] right-2 w-[320px] max-h-[calc(100%-60px)]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-white/10">
              <div className={`${fullPage ? "w-10 h-10" : "w-8 h-8"} rounded-full bg-white/10 flex items-center justify-center`}>
                {selectedActor.type === "producer" ? <Users className={`${fullPage ? "w-5 h-5" : "w-4 h-4"} text-emerald-400`} /> :
                 selectedActor.type === "trader" ? <Truck className={`${fullPage ? "w-5 h-5" : "w-4 h-4"} text-amber-400`} /> :
                 <Factory className={`${fullPage ? "w-5 h-5" : "w-4 h-4"} text-red-400`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`${sz} font-semibold text-white truncate`}>{selectedActor.name}</div>
                <div className={`${szSm} text-white/50 flex items-center gap-1`}>
                  {selectedActor.displayId}
                  <button onClick={() => navigator.clipboard.writeText(selectedActor.displayId)} className="hover:text-white/80">
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedActor(null)} className="text-white/40 hover:text-white">
                <X className={fullPage ? "w-5 h-5" : "w-4 h-4"} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {([
                { key: "profile" as const, label: "Profile" },
                { key: "transaction" as const, label: "Transaction" },
                { key: "emission" as const, label: "Emission", icon: <Leaf className="w-3 h-3" /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`flex-1 py-2 ${szSm} font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                    detailTab === tab.key
                      ? "border-emerald-400 text-emerald-400"
                      : "border-transparent text-white/40 hover:text-white/60"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className={`p-3 overflow-y-auto ${fullPage ? "max-h-[calc(100vh-220px)]" : "max-h-[300px]"}`}>
              {/* Profile Tab */}
              {detailTab === "profile" && (
                <div className="space-y-3">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(selectedActor.details).map(([key, value]) => (
                        <tr key={key} className="border-b border-white/5">
                          <td className={`py-1.5 pr-3 ${szSm} text-white/40 whitespace-nowrap`}>{key}</td>
                          <td className={`py-1.5 ${szSm} text-white/90`}>{String(value)}</td>
                        </tr>
                      ))}
                      <tr className="border-b border-white/5">
                        <td className={`py-1.5 pr-3 ${szSm} text-white/40`}>District</td>
                        <td className={`py-1.5 ${szSm} text-white/90`}>{selectedActor.district}</td>
                      </tr>
                      <tr>
                        <td className={`py-1.5 pr-3 ${szSm} text-white/40`}>Location</td>
                        <td className={`py-1.5 ${szSm} text-white/90`}>
                          {selectedActor.lat.toFixed(4)}, {selectedActor.lng.toFixed(4)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transaction Tab */}
              {detailTab === "transaction" && (
                <div className="space-y-2">
                  {actorTxs.length === 0 ? (
                    <p className={`${szSm} text-white/40 text-center py-4`}>No transactions found</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className={`py-1.5 px-1 text-left ${szSm} text-white/40`}>#</th>
                              <th className={`py-1.5 px-1 text-left ${szSm} text-white/40`}>Date</th>
                              <th className={`py-1.5 px-1 text-left ${szSm} text-white/40`}>Commodity</th>
                              <th className={`py-1.5 px-1 text-left ${szSm} text-white/40`}>From</th>
                              <th className={`py-1.5 px-1 text-left ${szSm} text-white/40`}>To</th>
                              <th className={`py-1.5 px-1 text-right ${szSm} text-white/40`}>Kg</th>
                            </tr>
                          </thead>
                          <tbody>
                            {actorTxs.map((tx, i) => {
                              const fromA = getActorById(tx.from);
                              const toA = getActorById(tx.to);
                              return (
                                <tr key={tx.id} className="border-b border-white/5">
                                  <td className={`py-1 px-1 ${szSm} text-white/50`}>{i + 1}</td>
                                  <td className={`py-1 px-1 ${szSm} text-white/80`}>{tx.date}</td>
                                  <td className={`py-1 px-1 ${szSm} text-white/80`}>{tx.commodity}</td>
                                  <td className={`py-1 px-1 ${szSm} text-white/80`}>{fromA?.displayId}</td>
                                  <td className={`py-1 px-1 ${szSm} text-white/80`}>{toA?.displayId}</td>
                                  <td className={`py-1 px-1 ${szSm} text-white/80 text-right`}>{tx.grossKg.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button className={`flex items-center gap-1 ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white ${szSm} font-semibold rounded-lg`}>
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Emission Tab */}
              {detailTab === "emission" && (
                <div className="space-y-3">
                  {selectedActor.emission ? (
                    <>
                      {/* Total Badge */}
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-3 text-center">
                        <div className={`${fullPage ? "text-2xl" : "text-xl"} font-bold text-white`}>
                          {selectedActor.emission.totalCo2eq.toLocaleString("en", { maximumFractionDigits: 1 })}
                        </div>
                        <div className={`${szSm} text-white/70`}>{getEmissionUnit(emissionCalc)}</div>
                      </div>

                      {/* Bar Chart */}
                      <div>
                        <h4 className={`${szSm} font-semibold text-white/70 mb-1`}>Emission by Source</h4>
                        <ResponsiveContainer width="100%" height={fullPage ? 220 : 180}>
                          <BarChart
                            data={selectedActor.emission.sources}
                            layout="vertical"
                            margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis type="number" tick={{ fontSize: 9, fill: "#ffffff80" }} />
                            <YAxis type="category" dataKey="source" width={fullPage ? 100 : 80} tick={{ fontSize: fullPage ? 9 : 8, fill: "#ffffff80" }} />
                            <Tooltip
                              contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 11 }}
                              labelStyle={{ color: "#fff" }}
                              formatter={(v: number) => [`${v.toFixed(1)} ${getEmissionUnit(emissionCalc)}`, "Emission"]}
                            />
                            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                              {selectedActor.emission.sources.map((s, i) => (
                                <Cell key={i} fill={s.value >= 0 ? EMISSION_COLORS.positive : EMISSION_COLORS.negative} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* GHG Donut */}
                      <div>
                        <h4 className={`${szSm} font-semibold text-white/70 mb-1`}>GHG Breakdown</h4>
                        <ResponsiveContainer width="100%" height={fullPage ? 180 : 150}>
                          <PieChart>
                            <Pie
                              data={selectedActor.emission.ghg}
                              dataKey="value"
                              nameKey="category"
                              cx="50%" cy="50%"
                              outerRadius={fullPage ? 55 : 45}
                              innerRadius={fullPage ? 28 : 22}
                              label={({ category, percent }: { category: string; percent: number }) =>
                                `${category} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {selectedActor.emission.ghg.map((_: { category: string; value: number }, i: number) => (
                                <Cell key={i} fill={GHG_COLORS[i % GHG_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 11 }}
                              formatter={(v: number) => [`${v.toFixed(1)} kgCO2eq`, ""]}
                            />
                            <RLegend wrapperStyle={{ fontSize: 10, color: "#ffffffa0" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <p className={`${szSm} text-white/40 text-center py-4`}>No emission data available</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Emission Dashboard Panel (Bottom) ───────────────────────── */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-10 ${fullPage ? "w-[85%] max-w-[950px]" : "w-[80%] max-w-[700px]"}`}>
        <button
          onClick={() => setShowEmissionDash(!showEmissionDash)}
          className={`mx-auto flex items-center gap-2 bg-black/70 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-t-lg ${szSm} font-medium text-white/70 hover:text-white hover:bg-black/80 transition-colors`}
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          Total: <strong className="text-emerald-300">{emissionSummary.total.toLocaleString("en", { maximumFractionDigits: 1 })}</strong> {getEmissionUnit(emissionCalc)}
          {showEmissionDash ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showEmissionDash && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/80 backdrop-blur-md rounded-t-xl border-x border-t border-white/10 overflow-hidden"
            >
              <div className="p-4 flex gap-4">
                {/* Total Card */}
                <div className="w-44 shrink-0 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-4 flex flex-col justify-center text-center">
                  <div className={`${fullPage ? "text-2xl" : "text-xl"} font-bold text-white`}>
                    {emissionSummary.total.toLocaleString("en", { maximumFractionDigits: 0 })}
                  </div>
                  <div className={`${szSm} text-white/70 mt-1`}>Total ({getEmissionUnit(emissionCalc)})</div>
                  <div className={`${szSm} text-white/40 mt-2`}>
                    {ALL_ACTORS.length} actors · {DEMO_TRANSACTIONS.length} txns
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="flex-1 min-w-0">
                  <h4 className={`${szSm} font-semibold text-white/70 mb-1`}>
                    Total Emission by Source ({getEmissionUnit(emissionCalc)})
                  </h4>
                  <ResponsiveContainer width="100%" height={fullPage ? 200 : 160}>
                    <BarChart data={emissionSummary.chartSource}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="source" tick={{ fontSize: 7, fill: "#ffffff60" }} angle={-45} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 9, fill: "#ffffff80" }} />
                      <Tooltip
                        contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(v: number) => [`${v.toFixed(1)} ${getEmissionUnit(emissionCalc)}`, "Emission"]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {emissionSummary.chartSource.map((s, i) => (
                          <Cell key={i} fill={s.value >= 0 ? EMISSION_COLORS.positive : EMISSION_COLORS.negative} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Guide Overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`bg-gray-900 border border-white/10 rounded-2xl ${fullPage ? "p-6 max-w-lg" : "p-4 max-w-sm"} w-full`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Leaf className={`${fullPage ? "w-5 h-5" : "w-4 h-4"} text-emerald-400`} />
                  <span className={`${sz} font-bold text-white`}>Supplychain Emission</span>
                </div>
                <button onClick={() => setShowGuide(false)} className="text-white/40 hover:text-white">
                  <X className={fullPage ? "w-5 h-5" : "w-4 h-4"} />
                </button>
              </div>

              <div className="space-y-3">
                {GUIDE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        i === guideStep ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5"
                      }`}
                      onClick={() => setGuideStep(i)}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        i === guideStep ? "bg-emerald-500/20" : "bg-white/5"
                      }`}>
                        <Icon className={`w-4 h-4 ${i === guideStep ? "text-emerald-400" : "text-white/40"}`} />
                      </div>
                      <div>
                        <div className={`${szSm} font-semibold ${i === guideStep ? "text-emerald-300" : "text-white/70"}`}>
                          {step.title}
                        </div>
                        <div className={`${szSm} ${i === guideStep ? "text-white/60" : "text-white/30"}`}>
                          {step.description}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                  {GUIDE_STEPS.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                      i === guideStep ? "bg-emerald-400" : "bg-white/20"
                    }`} />
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (guideStep < GUIDE_STEPS.length - 1) setGuideStep(g => g + 1);
                    else setShowGuide(false);
                  }}
                  className={`px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white ${szSm} font-semibold rounded-lg transition-colors`}
                >
                  {guideStep < GUIDE_STEPS.length - 1 ? "Next" : "Start Exploring"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
