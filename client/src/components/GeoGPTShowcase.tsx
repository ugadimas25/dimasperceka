import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Send, MapPin, BarChart3, Globe2, Download, MessageSquare,
  Bot, User, Loader2, Sparkles, TreePine, AlertTriangle,
  Map as MapIcon, ChevronDown, X, ArrowRight, ArrowDown,
  ArrowLeft, HelpCircle, Layers, Search, Shield
} from "lucide-react";

// ── Demo Data ────────────────────────────────────────────────────────────────

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
  mapHtml?: string;
  mapScenario?: "flood_commodity" | "landslide" | "flood_hazard";
  stats?: Record<string, string | number>;
  geojsonSummary?: string;
}

const SAMPLE_QUERIES_ID = [
  "Show flood areas in Aceh Barat overlapping with cocoa plantations",
  "What is the landslide-affected area in Pidie, Nov–Dec 2025?",
  "Analyze flood hazard index in Aceh Selatan from Sentinel-1 SAR",
  "Compare oil palm vs rubber commodity probability in Aceh Utara",
  "Find intersection between flood zones and coffee farms in Aceh Besar",
];

const SAMPLE_QUERIES_EN = [
  "Show flood areas in Aceh Barat overlapping with cocoa plantations",
  "What is the landslide-affected area in Pidie, Nov–Dec 2025?",
  "Analyze flood hazard index in Aceh Selatan from Sentinel-1 SAR",
  "Compare oil palm vs rubber commodity probability in Aceh Utara",
  "Find intersection between flood zones and coffee farms in Aceh Besar",
];

const GEE_API = "https://api-v2.sustainit.id/api/v1/gee";

// Build real GEE tile layer map HTML matching Operational Flood & Disaster layers
function buildDemoMapHtml(scenario: "flood_commodity" | "landslide" | "flood_hazard", large = false): string {
  const configs = {
    flood_commodity: {
      center: [4.45, 96.15],
      zoom: 10,
      layers: [
        {
          name: "Flood Hazard",
          url: `${GEE_API}/flood/tiles/flood_hazard/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Aceh+Barat`,
          opacity: 0.7,
        },
        {
          name: "Cocoa Commodity",
          url: `${GEE_API}/commodity/tiles/cocoa/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Aceh+Barat`,
          opacity: 0.6,
        },
        {
          name: "Cocoa × Flood Intersection",
          url: `${GEE_API}/intersection/tiles/commodity_flood/cocoa/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Aceh+Barat`,
          opacity: 0.7,
        },
      ],
      legend: [
        { color: "#FC9272", label: "Flood Hazard" },
        { color: "#018571", label: "Cocoa Probability" },
        { color: "#7b3294", label: "Cocoa × Flood" },
      ],
    },
    landslide: {
      center: [5.30, 96.10],
      zoom: 10,
      layers: [
        {
          name: "Landslide SAR",
          url: `${GEE_API}/landslide/tiles/landslide_nov_dec_2025/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Pidie`,
          opacity: 0.7,
        },
        {
          name: "Landslide NDVI",
          url: `${GEE_API}/landslide/tiles/landslide_ndvi_nov_dec_2025/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Pidie`,
          opacity: 0.6,
        },
      ],
      legend: [
        { color: "#e66101", label: "SAR Detection" },
        { color: "#d8b365", label: "NDVI Detection" },
      ],
    },
    flood_hazard: {
      center: [3.18, 97.30],
      zoom: 10,
      layers: [
        {
          name: "Flood Hazard Index",
          url: `${GEE_API}/flood/tiles/flood_hazard/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Aceh+Selatan`,
          opacity: 0.7,
        },
        {
          name: "Permanent Water",
          url: `${GEE_API}/flood/tiles/permanent_water/{z}/{x}/{y}?country=Indonesia&province=Aceh&district=Aceh+Selatan`,
          opacity: 0.5,
        },
      ],
      legend: [
        { color: "#DE2D26", label: "Flood Hazard" },
        { color: "#2171b5", label: "Permanent Water" },
      ],
    },
  };

  const cfg = configs[scenario];

  const layerCode = cfg.layers.map((l, i) => `
    L.tileLayer('${l.url}', { opacity: ${l.opacity}, attribution: 'GEE' }).addTo(map);
  `).join("\n");

  const legendHtml = cfg.legend.map(l =>
    `<div style="display:flex;align-items:center;gap:${large ? '10px' : '6px'};margin-bottom:${large ? '5px' : '3px'}">` +
    `<div style="width:${large ? '16px' : '12px'};height:${large ? '16px' : '12px'};border-radius:2px;background:${l.color};border:1px solid rgba(255,255,255,0.3)"></div>` +
    `<span>${l.label}</span></div>`
  ).join("");

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>
      body{margin:0;padding:0}
      #map{width:100%;height:100%}
      .legend{position:absolute;bottom:${large ? '20px' : '16px'};right:${large ? '20px' : '16px'};z-index:1000;background:rgba(15,15,20,0.9);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:${large ? '14px 18px' : '10px 14px'};color:#e5e7eb;font-family:monospace;font-size:${large ? '14px' : '11px'}}
      .legend-title{font-weight:700;margin-bottom:${large ? '8px' : '6px'};font-size:${large ? '13px' : '10px'};text-transform:uppercase;letter-spacing:1px;color:#10b981}
    </style>
  </head><body>
    <div id="map" style="height:100vh"></div>
    <div class="legend">
      <div class="legend-title">GEE Layers</div>
      ${legendHtml}
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([${cfg.center[0]},${cfg.center[1]}], ${cfg.zoom});
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO'
      }).addTo(map);
      ${layerCode}
    </script>
  </body></html>`;
}

const DEMO_CONVERSATIONS: DemoMessage[] = [
  {
    role: "user",
    content: "Show flood areas in Aceh Barat overlapping with cocoa plantations",
  },
  {
    role: "assistant",
    content: `## Intersection Analysis: Flood × Cocoa Plantation — Aceh Barat

Based on Sentinel-1 SAR (Flood Hazard Index) and Forest Data Partnership 2025a (Cocoa Probability):

### Key Findings:
- **Total flood hazard area**: 4,287 Ha (FAO GAUL boundary: Aceh Barat)
- **Total cocoa area**: 2,156 Ha (probability > 0.5)
- **Overlap area**: 847 Ha (39.3% of cocoa plantations affected)

### Intersection Detail:
| Zone | Area (Ha) | Severity |
|------|-----------|----------|
| High Hazard × Cocoa | 312 | 🔴 Critical |
| Medium Hazard × Cocoa | 418 | 🟡 Moderate |
| Low Hazard × Cocoa | 117 | 🟢 Low |

### Recommendations:
1. 🔴 Prioritize 312 Ha critical area for early warning system deployment
2. 🌊 Enable real-time Sentinel-1 SAR monitoring for intersection zones
3. 🌱 Assess cocoa crop resilience to periodic flooding impact`,
    mapHtml: buildDemoMapHtml("flood_commodity"),
    mapScenario: "flood_commodity" as const,
    stats: {
      "Flood Hazard Area": "4,287 Ha",
      "Cocoa Plantation": "2,156 Ha",
      "Intersection Area": "847 Ha",
      "Risk Level": "HIGH",
    },
    geojsonSummary: "3 polygons (flood zone, cocoa, intersection)",
  },
  {
    role: "user",
    content: "What is the landslide-affected area in Pidie, Nov–Dec 2025?",
  },
  {
    role: "assistant",
    content: `## Landslide Detection Report — Pidie District (Nov–Dec 2025)

Dual-sensor analysis using Sentinel-1 SAR backscatter change and Sentinel-2 NDVI anomaly:

### Landslide Statistics:
- 📡 **SAR Detection** (backscatter change): 156 Ha detected
- 🌿 **NDVI Detection** (vegetation loss): 198 Ha detected
- 🔄 **Confirmed (both sensors)**: 124 Ha (overlap area)

### Distribution by Sub-district:
| Sub-district | SAR (Ha) | NDVI (Ha) | Confirmed |
|--------------|----------|-----------|-----------|
| Tangse | 67 | 82 | 54 |
| Geumpang | 48 | 61 | 38 |
| Mane | 41 | 55 | 32 |

### Resolution & Data Sources:
- Sentinel-1: 10m SAR, descending orbit, VV+VH polarization
- Sentinel-2: 10m optical, cloud-free composite Nov–Dec 2025
- Boundary: FAO GAUL 2024, Level 2 (District)

### Recommendations:
1. ⚠️ Tangse is the most affected area — field verification needed urgently
2. 📡 Continue SAR monitoring for secondary landslide detection
3. 🗺️ Update district landslide risk map based on these findings`,
    mapHtml: buildDemoMapHtml("landslide"),
    mapScenario: "landslide" as const,
    stats: {
      "SAR Detection": "156 Ha",
      "NDVI Detection": "198 Ha",
      "Confirmed Area": "124 Ha",
      "Period": "Nov–Dec 2025",
    },
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function GeoGPTShowcase({ fullPage = false }: { fullPage?: boolean }) {
  const [isActivated, setIsActivated] = useState(fullPage);
  const [activeTab, setActiveTab] = useState<"chat" | "map" | "stats">("chat");
  const [demoIndex, setDemoIndex] = useState(0);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [guideStep, setGuideStep] = useState(0);
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, typingMessage]);

  // Type out assistant messages character by character
  const typeOutMessage = (msg: DemoMessage, onDone: () => void) => {
    setIsTyping(true);
    let i = 0;
    const speed = 8; // ms per char
    const text = msg.content;
    const interval = setInterval(() => {
      i += 3; // type 3 chars at a time for speed
      setTypingMessage(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTypingMessage("");
        setIsTyping(false);
        setVisibleMessages(prev => [...prev, msg]);
        onDone();
      }
    }, speed);
  };

  // Play next demo message pair
  const playNextPair = () => {
    const pairStart = demoIndex;
    if (pairStart >= DEMO_CONVERSATIONS.length) return;

    const userMsg = DEMO_CONVERSATIONS[pairStart];
    if (!userMsg || userMsg.role !== "user") return;

    // Show user message immediately
    setVisibleMessages(prev => [...prev, userMsg]);

    // Then type assistant response
    const assistantMsg = DEMO_CONVERSATIONS[pairStart + 1];
    if (assistantMsg && assistantMsg.role === "assistant") {
      setTimeout(() => {
        typeOutMessage(assistantMsg, () => {
          setDemoIndex(pairStart + 2);
        });
      }, 800);
    } else {
      setDemoIndex(pairStart + 1);
    }
  };

  // Get current assistant message (last one with map/stats)
  const currentAssistant = [...visibleMessages].reverse().find(m => m.role === "assistant");

  const sampleQueries = language === "id" ? SAMPLE_QUERIES_ID : SAMPLE_QUERIES_EN;

  const GUIDE_STEPS = [
    {
      title: "GeoGPT Analyst",
      description: "AI-powered geospatial assistant that uses OpenAI GPT-4o function calling with Turf.js spatial operations to analyze flood, landslide, and commodity data in Aceh, Indonesia.",
      position: "center" as const,
    },
    {
      title: "Natural Language Query",
      description: "Ask questions about flood hazard, landslide detection, commodity mapping, or intersection analysis. GeoGPT interprets your query and calls the appropriate GEE spatial functions.",
      position: "left" as const,
      arrow: "left" as const,
    },
    {
      title: "Interactive Map",
      description: "Results include Leaflet map with GeoJSON polygons showing flood zones, landslide detections, commodity plantations, and their intersections across Aceh districts.",
      position: "right" as const,
      arrow: "right" as const,
    },
    {
      title: "Statistics & Insights",
      description: "Area calculations from GEE (in hectares), sensor details (Sentinel-1 SAR, Sentinel-2), boundary info (FAO GAUL 2024), and AI-generated recommendations.",
      position: "bottom" as const,
      arrow: "down" as const,
    },
  ];

  // ── Placeholder (before activation) ──────────────────────────────────

  if (!isActivated) {
    return (
      <div className={`relative w-full overflow-hidden border border-border/50 shadow-2xl bg-gradient-to-br from-violet-950/30 via-slate-950/50 to-indigo-950/30 ${fullPage ? '' : 'rounded-xl'}`} style={{ height: fullPage ? '100vh' : '600px' }}>
        {/* Grid background */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="geogpt-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-violet-400" />
            </pattern>
            <rect width="100" height="100" fill="url(#geogpt-grid)" />
          </svg>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <div className="flex items-center justify-center gap-4 mb-5">
              <Bot className="w-7 h-7 text-violet-400" />
              <Sparkles className="w-10 h-10 text-indigo-400" />
              <MapPin className="w-7 h-7 text-violet-400" />
            </div>

            <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
              GeoGPT Analyst
            </h3>

            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Natural language geospatial query system powered by OpenAI GPT-4o function calling,
              Turf.js spatial operations, and interactive Leaflet map visualization.
              Analyze EUDR compliance, deforestation alerts, and supply chain risks.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["OpenAI GPT-4o", "Turf.js Spatial", "Leaflet Maps", "EUDR Compliance", "GFW Integration", "Bilingual AI"].map(t => (
                <span key={t} className="text-xs font-mono text-violet-400/80 bg-violet-400/10 px-3 py-1 rounded-full border border-violet-400/20">
                  {t}
                </span>
              ))}
            </div>

            <motion.button
              onClick={() => setIsActivated(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 font-bold px-6 py-3 rounded-lg border border-violet-500/30 transition-all shadow-lg hover:shadow-violet-500/20"
            >
              <Sparkles className="w-5 h-5" />
              Launch GeoGPT Demo
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
            </motion.button>

            <p className="text-xs text-muted-foreground/60 mt-4">
              Interactive demo with simulated AI responses
            </p>
          </motion.div>
        </div>

        {/* Feature strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent backdrop-blur-sm border-t border-border/30 p-4">
          <div className="grid grid-cols-4 gap-4 text-center max-w-lg mx-auto">
            <div>
              <Bot className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">AI Analyst</p>
            </div>
            <div>
              <MapPin className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Spatial Query</p>
            </div>
            <div>
              <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">EUDR Check</p>
            </div>
            <div>
              <BarChart3 className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] font-mono text-muted-foreground">Risk Analysis</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Dashboard ──────────────────────────────────────────────────

  return (
    <div className={`relative w-full overflow-hidden border border-border/50 shadow-2xl bg-background ${fullPage ? '' : 'rounded-xl'}`} style={{ height: fullPage ? '100vh' : '600px' }}>
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 flex items-center justify-between ${fullPage ? 'px-5 py-3' : 'px-4 py-2.5'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center ${fullPage ? 'w-9 h-9' : 'w-7 h-7'}`}>
            <Sparkles className={`text-violet-400 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
          </div>
          <div>
            <h3 className={`font-display font-bold text-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>GeoGPT Analyst</h3>
            <p className={`text-muted-foreground font-mono ${fullPage ? 'text-xs' : 'text-[9px]'}`}>OpenAI GPT-4o · Turf.js · Leaflet</p>
          </div>
        </div>

        <div className={`flex items-center ${fullPage ? 'gap-3' : 'gap-2'}`}>
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            className={`flex items-center gap-1.5 rounded font-mono border border-border/40 text-muted-foreground hover:text-foreground transition-colors ${fullPage ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]'}`}
          >
            <Globe2 className={fullPage ? 'w-4 h-4' : 'w-3 h-3'} />
            {language === "id" ? "ID" : "EN"}
          </button>

          {/* Tabs */}
          <div className={`flex bg-muted/30 rounded-lg border border-border/30 ${fullPage ? 'p-1' : 'p-0.5'}`}>
            {(["chat", "map", "stats"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded font-mono font-bold transition-all ${fullPage ? 'px-4 py-1.5 text-xs' : 'px-2.5 py-1 text-[10px]'} ${
                  activeTab === tab
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : tab === "map"
                      ? "text-violet-300/60 hover:text-violet-300 border border-transparent"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "chat" ? "Chat" : tab === "map" ? (
                  <span className="flex items-center gap-1">
                    <MapIcon className={fullPage ? 'w-4 h-4' : 'w-3 h-3'} />
                    Map
                  </span>
                ) : "Stats"}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowGuide(true); setGuideStep(0); }}
            className={`rounded border border-border/40 text-muted-foreground hover:text-violet-400 transition-colors ${fullPage ? 'p-2' : 'p-1.5'}`}
            title="Show guide"
          >
            <HelpCircle className={fullPage ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} />
          </button>
          {fullPage && (
            <Link href="/">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/40 text-muted-foreground hover:text-violet-400 hover:border-violet-500/30 transition-colors group">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">Back</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`absolute bottom-0 left-0 right-0 flex ${fullPage ? 'top-[58px]' : 'top-[52px]'}`}>
        {/* Chat Panel */}
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {visibleMessages.length === 0 && !isTyping && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <Bot className={`text-violet-400/30 mb-4 ${fullPage ? 'w-16 h-16' : 'w-12 h-12'}`} />
                    <h4 className={`font-display font-bold text-foreground mb-2 ${fullPage ? 'text-lg' : 'text-sm'}`}>
                      {language === "id" ? "Start Asking" : "Start Asking"}
                    </h4>
                    <p className={`text-muted-foreground mb-4 max-w-sm ${fullPage ? 'text-sm' : 'text-xs'}`}>
                      {language === "id"
                        ? "Use natural language to analyze flood, landslide, and commodity data in Aceh."
                        : "Use natural language to analyze flood, landslide, and commodity data in Aceh."}
                    </p>
                    <div className="space-y-1.5 w-full max-w-md">
                      <p className={`font-mono text-muted-foreground/60 mb-1 ${fullPage ? 'text-xs' : 'text-[10px]'}`}>
                        {language === "id" ? "Sample queries:" : "Sample queries:"}
                      </p>
                      {sampleQueries.slice(0, 3).map((sq, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (demoIndex < DEMO_CONVERSATIONS.length) playNextPair();
                          }}
                          className={`w-full text-left px-3 py-2 bg-muted/30 hover:bg-violet-500/10 border border-border/30 hover:border-violet-500/30 rounded-lg text-muted-foreground hover:text-foreground transition-all ${fullPage ? 'text-sm' : 'text-[11px]'}`}
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {visibleMessages.map((msg, i) => (
                  <div key={i} className={`flex ${fullPage ? 'gap-3' : 'gap-2.5'} ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className={`rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5 ${fullPage ? 'w-9 h-9' : 'w-7 h-7'}`}>
                        <Bot className={`text-violet-400 ${fullPage ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-xl leading-relaxed ${fullPage ? 'p-4 text-sm' : 'p-3 text-xs'} ${
                      msg.role === "user"
                        ? "bg-violet-500/15 border border-violet-500/25 text-foreground"
                        : "bg-muted/30 border border-border/30 text-foreground"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className={`prose prose-invert max-w-none whitespace-pre-wrap ${fullPage ? 'prose-sm [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_p]:text-sm [&_p]:mb-2 [&_li]:text-sm [&_table]:text-xs' : 'prose-xs [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mb-1 [&_p]:text-xs [&_p]:mb-1.5 [&_li]:text-xs [&_table]:text-[10px]'}`}>
                          {msg.content}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      {msg.stats && (
                        <div className={`grid grid-cols-2 mt-2 pt-2 border-t border-border/30 ${fullPage ? 'gap-2' : 'gap-1.5'}`}>
                          {Object.entries(msg.stats).map(([k, v]) => (
                            <div key={k} className="bg-background/50 rounded px-2 py-1">
                              <p className={`text-muted-foreground ${fullPage ? 'text-xs' : 'text-[9px]'}`}>{k}</p>
                              <p className={`font-bold font-mono text-violet-400 ${fullPage ? 'text-sm' : 'text-[11px]'}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.mapHtml && (
                        <button
                          onClick={() => setActiveTab("map")}
                          className={`mt-2 flex items-center gap-1.5 font-mono text-violet-400 hover:text-violet-300 transition-colors ${fullPage ? 'text-xs' : 'text-[10px]'}`}
                        >
                          <MapIcon className={fullPage ? 'w-4 h-4' : 'w-3 h-3'} />
                          View on map →
                        </button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className={`rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 ${fullPage ? 'w-9 h-9' : 'w-7 h-7'}`}>
                        <User className={`text-indigo-400 ${fullPage ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className={`flex ${fullPage ? 'gap-3' : 'gap-2.5'}`}>
                    <div className={`rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5 ${fullPage ? 'w-9 h-9' : 'w-7 h-7'}`}>
                      <Bot className={`text-violet-400 ${fullPage ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <div className={`max-w-[85%] rounded-xl bg-muted/30 border border-border/30 text-foreground leading-relaxed whitespace-pre-wrap ${fullPage ? 'p-4 text-sm' : 'p-3 text-xs'}`}>
                      {typingMessage}
                      <span className={`inline-block bg-violet-400 ml-0.5 animate-pulse ${fullPage ? 'w-2 h-4' : 'w-1.5 h-3.5'}`} />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className={`border-t border-border/50 bg-background/80 ${fullPage ? 'p-4' : 'p-3'}`}>
                <div className={`flex ${fullPage ? 'gap-3' : 'gap-2'}`}>
                  <button
                    onClick={() => {
                      if (!isTyping && demoIndex < DEMO_CONVERSATIONS.length) playNextPair();
                    }}
                    disabled={isTyping || demoIndex >= DEMO_CONVERSATIONS.length}
                    className={`flex-1 text-left bg-muted/30 border border-border/40 rounded-lg text-muted-foreground hover:border-violet-500/40 hover:text-foreground transition-all disabled:opacity-40 ${fullPage ? 'px-4 py-3 text-sm' : 'px-3 py-2.5 text-xs'}`}
                  >
                    {demoIndex >= DEMO_CONVERSATIONS.length
                      ? (language === "id" ? "Demo complete — all queries shown" : "Demo complete — all queries shown")
                      : isTyping
                        ? (language === "id" ? "GeoGPT is responding..." : "GeoGPT is responding...")
                        : (language === "id" ? "Click to run next demo query..." : "Click to run next demo query...")}
                  </button>
                  <button
                    onClick={() => {
                      if (!isTyping && demoIndex < DEMO_CONVERSATIONS.length) playNextPair();
                    }}
                    disabled={isTyping || demoIndex >= DEMO_CONVERSATIONS.length}
                    className={`bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40 ${fullPage ? 'px-4 py-3' : 'px-3 py-2'}`}
                  >
                    <Send className={fullPage ? 'w-5 h-5' : 'w-4 h-4'} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              {currentAssistant?.mapHtml ? (
                <iframe
                  srcDoc={currentAssistant.mapScenario ? buildDemoMapHtml(currentAssistant.mapScenario, fullPage) : currentAssistant.mapHtml}
                  className="w-full h-full"
                  title="GeoGPT Map"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MapPin className={`text-muted-foreground/20 mb-3 ${fullPage ? 'w-16 h-16' : 'w-12 h-12'}`} />
                  <p className={`text-muted-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>
                    {language === "id" ? "Run a query to see map results" : "Run a query to see map results"}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-4 overflow-y-auto"
            >
              {currentAssistant?.stats ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className={`text-violet-400 ${fullPage ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    <span className={`font-bold text-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>Analysis Statistics</span>
                  </div>
                  <div className={`grid grid-cols-2 ${fullPage ? 'gap-4' : 'gap-3'}`}>
                    {Object.entries(currentAssistant.stats).map(([k, v]) => (
                      <div key={k} className={`bg-muted/20 border border-border/30 rounded-lg ${fullPage ? 'p-4' : 'p-3'}`}>
                        <p className={`text-muted-foreground mb-1 ${fullPage ? 'text-xs' : 'text-[10px]'}`}>{k}</p>
                        <p className={`font-bold font-mono text-foreground ${fullPage ? 'text-xl' : 'text-lg'}`}>{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className={`text-violet-400 ${fullPage ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'}`} />
                      <span className={`font-bold text-foreground ${fullPage ? 'text-xs' : 'text-[10px]'}`}>Available Functions (10)</span>
                    </div>
                    <div className={`grid grid-cols-2 ${fullPage ? 'gap-2' : 'gap-1.5'}`}>
                      {[
                        "get_flood_hazard", "get_landslide_detection", "get_commodity_probability",
                        "get_flood_commodity_intersection", "get_administrative_boundary", "get_sentinel1_sar",
                        "get_sentinel2_ndvi", "get_gaul_boundary", "analyze_flood_stats",
                        "analyze_intersection_stats"
                      ].map(fn => (
                        <div key={fn} className={`flex items-center gap-1.5 rounded bg-violet-500/5 border border-violet-500/10 ${fullPage ? 'px-3 py-1.5' : 'px-2 py-1'}`}>
                          <div className={`rounded-full bg-violet-400 ${fullPage ? 'w-1.5 h-1.5' : 'w-1 h-1'}`} />
                          <span className={`font-mono text-muted-foreground ${fullPage ? 'text-xs' : 'text-[9px]'}`}>{fn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BarChart3 className={`text-muted-foreground/20 mb-3 ${fullPage ? 'w-16 h-16' : 'w-12 h-12'}`} />
                  <p className={`text-muted-foreground ${fullPage ? 'text-sm' : 'text-xs'}`}>
                    {language === "id" ? "Statistics appear after running a query" : "Statistics appear after running a query"}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Onboarding Guide Overlay ── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowGuide(false)} />

            <motion.div
              key={guideStep}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute z-40 ${
                GUIDE_STEPS[guideStep].position === "center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :
                GUIDE_STEPS[guideStep].position === "left" ? "top-[120px] left-[40px]" :
                GUIDE_STEPS[guideStep].position === "right" ? "top-[80px] right-[40px]" :
                "bottom-[60px] left-1/2 -translate-x-1/2"
              }`}
            >
              {GUIDE_STEPS[guideStep].arrow === "left" && (
                <motion.div animate={{ x: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute top-4 -left-8">
                  <ArrowLeft className="w-5 h-5 text-violet-400" />
                </motion.div>
              )}
              {GUIDE_STEPS[guideStep].arrow === "right" && (
                <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute top-4 -right-8">
                  <ArrowRight className="w-5 h-5 text-violet-400" />
                </motion.div>
              )}
              {GUIDE_STEPS[guideStep].arrow === "down" && (
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                  <ArrowDown className="w-5 h-5 text-violet-400" />
                </motion.div>
              )}

              <div className="bg-background/95 backdrop-blur-md rounded-xl border border-violet-500/30 shadow-2xl shadow-violet-500/10 p-4 max-w-[280px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 text-xs font-bold font-mono">
                      {guideStep + 1}
                    </div>
                    <h4 className="font-display font-bold text-sm text-foreground">{GUIDE_STEPS[guideStep].title}</h4>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {GUIDE_STEPS[guideStep].description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {GUIDE_STEPS.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === guideStep ? "bg-violet-400" : i < guideStep ? "bg-violet-400/40" : "bg-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {guideStep > 0 && (
                      <button onClick={() => setGuideStep(guideStep - 1)} className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border/40">
                        Back
                      </button>
                    )}
                    {guideStep < GUIDE_STEPS.length - 1 ? (
                      <button onClick={() => setGuideStep(guideStep + 1)} className="text-[10px] font-mono text-violet-400 bg-violet-500/15 hover:bg-violet-500/25 px-3 py-1 rounded border border-violet-500/30 font-bold">
                        Next →
                      </button>
                    ) : (
                      <button onClick={() => setShowGuide(false)} className="text-[10px] font-mono text-violet-400 bg-violet-500/15 hover:bg-violet-500/25 px-3 py-1 rounded border border-violet-500/30 font-bold">
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
