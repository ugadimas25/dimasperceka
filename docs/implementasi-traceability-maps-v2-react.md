# Dokumentasi Implementasi: Traceability Maps V2 + CFT Crop Emission — React/TypeScript Stack

> **Sumber**: `maps/maps_traceability_v2` + `dboard/cft_crop` pada KoltiTrace MIS (CodeIgniter + jQuery + Google Maps)
> **Target**: Aplikasi web baru dengan stack React 18 · TypeScript · Vite 7 · MapLibre GL · Tailwind CSS 3 · Express 5 · PostgreSQL + Drizzle ORM
> **Integrasi**: Penggabungan visualisasi supply-chain (traceability map) dengan data emisi karbon CoolFarmTool (CFT) per chain actor

---

## Daftar Isi

1. [Ringkasan Fitur](#1-ringkasan-fitur)
2. [Arsitektur Original vs Target](#2-arsitektur-original-vs-target)
3. [Data Model & Database Schema (PostgreSQL)](#3-data-model--database-schema-postgresql)
4. [Backend — Express 5 API](#4-backend--express-5-api)
5. [Frontend — React Components](#5-frontend--react-components)
6. [State Management & Data Flow](#6-state-management--data-flow)
7. [Map Layer — MapLibre GL](#7-map-layer--maplibre-gl)
8. [Kode Contoh Lengkap](#8-kode-contoh-lengkap)
9. [Mapping File Original → File Baru](#9-mapping-file-original--file-baru)
10. [Catatan Migrasi & Tips](#10-catatan-migrasi--tips)
11. [Integrasi CFT Crop Emission per Supply Chain](#11-integrasi-cft-crop-emission-per-supply-chain)

---

## 1. Ringkasan Fitur

Fitur **Traceability Maps V2 + CFT Emission** menampilkan peta interaktif supply-chain yang diperkaya dengan data emisi karbon per chain actor:

| Fitur | Deskripsi |
|---|---|
| **Filter Panel** | Date range (From/To), Commodity, Delivery Destination, hingga 6 level Tier aggregator, dan Search by Farmer ID/Name |
| **Emission Filter** | Year of Reporting, Calculation Type (per Farmer/Hectare/Ton Crop/Sum), Country, Crop Type |
| **Map Rendering** | Marker (producers, vessels, traders, warehouses) dengan color-coding emisi, Polyline (transaksi), Polygon (farm area) |
| **Emission Heatmap** | Layer heatmap berdasarkan total CO2eq per producer/area |
| **Legend Panel** | Toggle visibility per layer: Polygon, Actors, Admin Boundary (WMS), Landuse KLHK (WMS), Emission Overlay |
| **Actor Detail Popup** | Klik marker → tampilkan profil + tabel transaksi + **carbon emission breakdown** |
| **Emission Chart** | Bar chart total emission by source per actor/area yang diklik |
| **Emission Detail Grid** | Tabel detail per emission source dengan breakdown CO2, N2O, CH4, CO2eq |
| **Show/Hide Producers** | Dari trader → toggle tampilkan producer yang memasok ke trader tsb |
| **Show/Hide Polygons** | Toggle farm polygon per producer |
| **Show/Hide Harvest** | Toggle harvest location points per producer |
| **Export Excel** | Download transaksi + emission data ke format XLSX |
| **Reload Data** | Regenerate report data (`generate_rpt_maps`) |

### Alur Kerja Utama

```
── TRACEABILITY FLOW ──
User mengisi filter → Klik "Process"
  → POST /api/traceability/trace (params filter)
  → Backend query RptMapsRelation + join ViewOrg
  → Return: { producers, trader, warehouse, transactions, ... }
  → Frontend transform data ke points/polylines/polygons 
  → Render ke peta (marker, polyline, polygon)
  → Klik marker → POST /api/traceability/details/:id 
  → Tampilkan popup profil + tabel transaksi

── EMISSION FLOW (integrated) ──
Setelah traceability data loaded:
  → GET /api/emission/summary (params: year, calculation, country, crop)
  → Return: { totalEmission, chartSource[], emissionByDistrict[] }
  → Overlay emission data ke peta (color-coded markers / heatmap)
  → Klik actor → GET /api/emission/by-entity/:entityId
  → Tampilkan emission breakdown per source di detail panel
  → Detail grid: CO2, N2O, CH4, CO2eq per emission source
```

---

## 2. Arsitektur Original vs Target

### Original Stack (KoltiTrace MIS)

```
┌─────────────────────────────────────┐
│ Frontend (View)                     │
│  v_maps_traceability_v2.php         │
│  + cft_crop.php (emission dash)     │
│  + jQuery + ExtJS + gmap3           │
│  + Google Maps API                  │
├─────────────────────────────────────┤
│ JS Modules                          │
│  main.js        → orchestrator      │
│  variables.js   → config & consts   │
│  class_feature.js → TraceabilityData│
│  components.js  → legend builder    │
│  events.js      → map init & events │
│  gmap_style.js  → map themes        │
│  cft_crop.js    → emission dashboard│
├─────────────────────────────────────┤
│ API Controller (REST)               │
│  maps_traceability_v2.php           │
│  dboard/cft_crop.php (emission API) │
│  Endpoints: trace, details,         │
│  get_commodity, get_combo_aggregator│
│  display_dash, detail_emission_grid │
├─────────────────────────────────────┤
│ Model                               │
│  mtraceability_maps_v2.php          │
│  mcft_crop.php (emission queries)   │
│  Tables: rpt_maps_relation,         │
│          dash_cft_crop,             │
│          dash_cft_crop_ent          │
└─────────────────────────────────────┘
```

### Target Stack (React + Express)

```
┌───────────────────────────────────────────────────────────────┐
│ Frontend (React 18 + TypeScript + Vite 7)                     │
│                                                               │
│  pages/                                                       │
│    TraceabilityMapPage.tsx          → main page                │
│                                                               │
│  features/traceability-map/                                   │
│    components/                                                │
│      FilterPanel.tsx                → filter form (RHF + Zod) │
│      EmissionFilterPanel.tsx        → emission filter controls│
│      MapView.tsx                    → MapLibre GL wrapper      │
│      LegendPanel.tsx                → layer toggles            │
│      ActorDetailPanel.tsx           → popup profil + transaksi│
│      EmissionPanel.tsx              → emission breakdown panel│
│      EmissionChart.tsx              → Recharts bar/column chart│
│      ActorMarker.tsx                → custom marker component │
│    hooks/                                                     │
│      useTraceData.ts                → TanStack Query hooks     │
│      useEmissionData.ts             → emission query hooks     │
│      useMapLayers.ts                → layer management         │
│    lib/                                                       │
│      traceability-data.ts           → class TraceabilityData  │
│      emission-data.ts               → emission utilities       │
│      map-styles.ts                  → silver/dark themes       │
│      constants.ts                   → colors, icons, tiles     │
│    types/                                                     │
│      index.ts                       → TypeScript interfaces    │
│      emission.ts                    → Emission type defs       │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Backend (Express 5 + PostgreSQL + Drizzle ORM)                │
│                                                               │
│  routes/traceability.ts                                       │
│  routes/emission.ts                 → emission API routes      │
│  controllers/traceability.controller.ts                       │
│  controllers/emission.controller.ts → emission handlers        │
│  services/traceability.service.ts                             │
│  services/emission.service.ts       → emission business logic  │
│  db/schema/                                                   │
│    rpt-maps-relation.ts                                       │
│    dash-cft-crop.ts                 → emission data schema     │
│    dash-cft-crop-ent.ts             → entity emission schema   │
│    ref-supplier.ts                                            │
│    ref-commodity.ts                                           │
│    view-org.ts                                                │
│    farm-polygon.ts                                            │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Database Schema (PostgreSQL)

### 3.1 Tabel Utama: `rpt_maps_relation`

Tabel denormalisasi yang menyimpan relasi supply-chain hingga 7 level.

```sql
-- Migrasi dari MySQL ke PostgreSQL
CREATE TABLE rpt_maps_relation (
  id                    SERIAL PRIMARY KEY,
  
  -- Producer (level 0)
  farmer_id             VARCHAR(50) NOT NULL,
  farmer_display_id     VARCHAR(100),
  farmer_name           VARCHAR(255),
  trans_supply_uid      VARCHAR(100),
  trans_supply_type_id  INTEGER DEFAULT 1, -- 1=farmer, 4=vessel
  commo_id              INTEGER,
  lat_0                 DECIMAL(10,6),
  long_0                DECIMAL(10,6),
  
  -- Supply chain level 1-7
  supplychain_id_1      INTEGER,
  org_id_1              INTEGER,
  ent_id_1              INTEGER,
  name_1                VARCHAR(255),
  lat_1                 DECIMAL(10,6),
  long_1                DECIMAL(10,6),
  display_id_1          VARCHAR(100),
  delivery_id_1         INTEGER,
  
  supplychain_id_2      INTEGER,
  org_id_2              INTEGER,
  ent_id_2              INTEGER,
  name_2                VARCHAR(255),
  lat_2                 DECIMAL(10,6),
  long_2                DECIMAL(10,6),
  display_id_2          VARCHAR(100),
  delivery_id_2         INTEGER,

  -- ... sampai level 7 (pattern sama)
  supplychain_id_3      INTEGER,
  lat_3                 DECIMAL(10,6),
  long_3                DECIMAL(10,6),
  -- dst...
  
  -- Destination filter (end destination per level)
  end_destination_1     INTEGER,
  end_destination_2     INTEGER,
  end_destination_3     INTEGER,
  end_destination_4     INTEGER,
  end_destination_5     INTEGER,
  end_destination_6     INTEGER,
  end_destination_7     INTEGER,
  
  partner_id_1          INTEGER,
  date_transaction      TIMESTAMPTZ,
  supply_trans_id       INTEGER,
  
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rpt_maps_date ON rpt_maps_relation(date_transaction);
CREATE INDEX idx_rpt_maps_commo ON rpt_maps_relation(commo_id);
CREATE INDEX idx_rpt_maps_partner ON rpt_maps_relation(partner_id_1);
CREATE INDEX idx_rpt_maps_farmer ON rpt_maps_relation(farmer_id);
```

### 3.2 Tabel Referensi

```sql
CREATE TABLE ref_commodity (
  commo_id    SERIAL PRIMARY KEY,
  commo_name  VARCHAR(100) NOT NULL
);

CREATE TABLE ref_supplier (
  supplier_id           VARCHAR(50) PRIMARY KEY,
  supplier_display_id   VARCHAR(100),
  supplier_name         VARCHAR(255),
  gender                CHAR(1),      -- 'm'/'f'
  birthdate             DATE,
  reg_id                VARCHAR(50),  -- region hierarchy ID
  phone                 VARCHAR(50),
  address               TEXT
);

CREATE TABLE view_org (
  supplychain_id  INTEGER PRIMARY KEY,
  org_id          INTEGER,
  display_id      VARCHAR(100),
  name            VARCHAR(255),
  company_name    VARCHAR(255),
  org_type        VARCHAR(50),  -- 'trader' / 'warehouse'
  phone           VARCHAR(50),
  address         TEXT,
  -- Location fields
  country_name    VARCHAR(100),
  province_name   VARCHAR(100),
  district_name   VARCHAR(100),
  sub_district_name VARCHAR(100),
  village_name    VARCHAR(100),
  latitude        DECIMAL(10,6),
  longitude       DECIMAL(10,6)
);

CREATE TABLE farm_polygon (
  id              SERIAL PRIMARY KEY,
  supplier_id     VARCHAR(50),
  farm_nr         INTEGER,
  commo_id        INTEGER,
  revision        INTEGER,
  polygon         GEOMETRY(Polygon, 4326),  -- PostGIS
  center_lat      DECIMAL(10,6),
  center_long     DECIMAL(10,6),
  farm_area       DECIMAL(10,4)
);

CREATE INDEX idx_farm_polygon_supplier ON farm_polygon(supplier_id);
```

### 3.3 Tabel Emisi CFT Crop

Tabel untuk menyimpan data emisi karbon dari CoolFarmTool, terintegrasi per area geografis dan per entity chain.

```sql
-- Tabel utama emisi per area (aggregated per province/district)
CREATE TABLE dash_cft_crop (
  id                SERIAL PRIMARY KEY,
  partner_id        INTEGER NOT NULL,
  country_id        VARCHAR(10),
  country_name      VARCHAR(100),
  province_id       VARCHAR(20),
  district_id       VARCHAR(20),
  crop_type         VARCHAR(100),
  survey_yr         INTEGER,
  emission_source   VARCHAR(100) NOT NULL,
  -- Breakdown gas rumah kaca
  co2               DECIMAL(18,6) DEFAULT 0, -- Carbon Dioxide
  n2o               DECIMAL(18,6) DEFAULT 0, -- Nitrous Oxide
  ch4               DECIMAL(18,6) DEFAULT 0, -- Methane
  co2e              DECIMAL(18,6) DEFAULT 0, -- CO2 equivalent (total)
  -- Pembagi kalkulasi
  total_farmer      INTEGER DEFAULT 0,
  total_crop_ha     DECIMAL(18,6) DEFAULT 0,  -- hectare
  total_fg_ton      DECIMAL(18,6) DEFAULT 0,  -- ton crop
  generated_date    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cft_crop_partner ON dash_cft_crop(partner_id);
CREATE INDEX idx_cft_crop_country ON dash_cft_crop(country_id);
CREATE INDEX idx_cft_crop_district ON dash_cft_crop(district_id);
CREATE INDEX idx_cft_crop_year ON dash_cft_crop(survey_yr);

-- Tabel emisi per entity/actor (chain-level detail)
CREATE TABLE dash_cft_crop_ent (
  id                    SERIAL PRIMARY KEY,
  entity_id             INTEGER NOT NULL, -- FK ke supply chain entity
  type_of_calculation   VARCHAR(50),      -- 'AVERAGE PER FARMER', etc.
  country_name          VARCHAR(100),
  crop_type             VARCHAR(100),
  survey_yr             INTEGER,
  emission_source       VARCHAR(100) NOT NULL,
  calculation           VARCHAR(50) DEFAULT 'ORIGINAL', -- 'ORIGINAL' / 'SCENARIO'
  total_co2eq           DECIMAL(18,6) DEFAULT 0
);

CREATE INDEX idx_cft_ent_entity ON dash_cft_crop_ent(entity_id);
CREATE INDEX idx_cft_ent_calc ON dash_cft_crop_ent(type_of_calculation);

-- Tabel produk emisi breakdown (donut chart source)
CREATE TABLE crop_product_dash3_ent (
  id                    SERIAL PRIMARY KEY,
  entity_id             INTEGER NOT NULL,
  type_of_calculation   VARCHAR(50),
  country_name          VARCHAR(100),
  crop_type             VARCHAR(100),
  survey_yr             INTEGER,
  emission_source       VARCHAR(100),
  value                 DECIMAL(18,6) DEFAULT 0,
  percentage            DECIMAL(5,2)
);

-- Tabel GHG breakdown per kategori  
CREATE TABLE crop_product_dash4_ent (
  id                    SERIAL PRIMARY KEY,
  entity_id             INTEGER NOT NULL,
  type_of_calculation   VARCHAR(50),
  country_name          VARCHAR(100),
  crop_type             VARCHAR(100),
  survey_yr             INTEGER,
  category              VARCHAR(100),   -- e.g. 'CO2', 'N2O', 'CH4'
  value                 DECIMAL(18,6) DEFAULT 0,
  percentage            DECIMAL(5,2)
);
```

**Emission Sources (10 jenis):**
| # | Emission Source | Deskripsi |
|---|---|---|
| 1 | Seed production | Emisi dari produksi benih |
| 2 | Residue management | Pengelolaan sisa tanaman |
| 3 | Fertiliser production | Produksi pupuk |
| 4 | Soil / fertiliser | Emisi tanah akibat pupuk |
| 5 | Crop protection | Pestisida & perlindungan tanaman |
| 6 | Carbon stock changes | Perubahan stok karbon |
| 7 | Energy use (field) | Energi di lapangan |
| 8 | Energy use (processing) | Energi untuk pengolahan |
| 9 | Waste water | Limbah air |
| 10 | Off-farm transport | Transportasi dari kebun |

**Tipe Kalkulasi:**
| Tipe | Formula | Satuan |
|---|---|---|
| AVERAGE PER FARMER | `SUM(co2e) / COUNT(DISTINCT farmer)` | kgCO2eq/Farmer |
| AVERAGE PER HECTARE | `SUM(co2e) / SUM(crop_ha)` | kgCO2eq/Hectare |
| AVERAGE PER TON CROP | `SUM(co2e) / SUM(fg_ton)` | kgCO2eq/Ton Crop |
| SUM OF ALL FARMERS | `SUM(co2e)` | kgCO2eq |

### 3.4 Drizzle ORM Schema

```typescript
// db/schema/rpt-maps-relation.ts
import { pgTable, serial, varchar, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

export const rptMapsRelation = pgTable('rpt_maps_relation', {
  id: serial('id').primaryKey(),
  farmerId: varchar('farmer_id', { length: 50 }).notNull(),
  farmerDisplayId: varchar('farmer_display_id', { length: 100 }),
  farmerName: varchar('farmer_name', { length: 255 }),
  transSupplyUid: varchar('trans_supply_uid', { length: 100 }),
  transSupplyTypeId: integer('trans_supply_type_id').default(1),
  commoId: integer('commo_id'),
  lat0: decimal('lat_0', { precision: 10, scale: 6 }),
  long0: decimal('long_0', { precision: 10, scale: 6 }),
  
  supplychainId1: integer('supplychain_id_1'),
  lat1: decimal('lat_1', { precision: 10, scale: 6 }),
  long1: decimal('long_1', { precision: 10, scale: 6 }),
  displayId1: varchar('display_id_1', { length: 100 }),
  
  // ... repeat pattern for levels 2-7
  
  endDestination1: integer('end_destination_1'),
  endDestination2: integer('end_destination_2'),
  endDestination3: integer('end_destination_3'),
  endDestination4: integer('end_destination_4'),
  endDestination5: integer('end_destination_5'),
  endDestination6: integer('end_destination_6'),
  endDestination7: integer('end_destination_7'),
  
  partnerId1: integer('partner_id_1'),
  dateTransaction: timestamp('date_transaction', { withTimezone: true }),
});
```

```typescript
// db/schema/dash-cft-crop.ts
import { pgTable, serial, varchar, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

export const dashCftCrop = pgTable('dash_cft_crop', {
  id: serial('id').primaryKey(),
  partnerId: integer('partner_id').notNull(),
  countryId: varchar('country_id', { length: 10 }),
  countryName: varchar('country_name', { length: 100 }),
  provinceId: varchar('province_id', { length: 20 }),
  districtId: varchar('district_id', { length: 20 }),
  cropType: varchar('crop_type', { length: 100 }),
  surveyYr: integer('survey_yr'),
  emissionSource: varchar('emission_source', { length: 100 }).notNull(),
  co2: decimal('co2', { precision: 18, scale: 6 }).default('0'),
  n2o: decimal('n2o', { precision: 18, scale: 6 }).default('0'),
  ch4: decimal('ch4', { precision: 18, scale: 6 }).default('0'),
  co2e: decimal('co2e', { precision: 18, scale: 6 }).default('0'),
  totalFarmer: integer('total_farmer').default(0),
  totalCropHa: decimal('total_crop_ha', { precision: 18, scale: 6 }).default('0'),
  totalFgTon: decimal('total_fg_ton', { precision: 18, scale: 6 }).default('0'),
  generatedDate: timestamp('generated_date', { withTimezone: true }).defaultNow(),
});

// db/schema/dash-cft-crop-ent.ts
export const dashCftCropEnt = pgTable('dash_cft_crop_ent', {
  id: serial('id').primaryKey(),
  entityId: integer('entity_id').notNull(),
  typeOfCalculation: varchar('type_of_calculation', { length: 50 }),
  countryName: varchar('country_name', { length: 100 }),
  cropType: varchar('crop_type', { length: 100 }),
  surveyYr: integer('survey_yr'),
  emissionSource: varchar('emission_source', { length: 100 }).notNull(),
  calculation: varchar('calculation', { length: 50 }).default('ORIGINAL'),
  totalCo2eq: decimal('total_co2eq', { precision: 18, scale: 6 }).default('0'),
});
```

---

## 4. Backend — Express 5 API

### 4.1 Route Definitions

```typescript
// routes/traceability.ts
import { Router } from 'express';
import { TraceabilityController } from '../controllers/traceability.controller';
import { authenticate } from '../middleware/auth'; // Passport.js

const router = Router();
const ctrl = new TraceabilityController();

// Filter data
router.get('/commodity',           authenticate, ctrl.getCommodity);
router.get('/aggregator',          authenticate, ctrl.getComboAggregator);

// Main trace
router.post('/trace',              authenticate, ctrl.trace);

// Actor detail
router.post('/details/:id',       authenticate, ctrl.getActorDetails);

// Export
router.post('/export-excel',       authenticate, ctrl.exportExcel);

// Regenerate report
router.post('/generate-report',    authenticate, ctrl.generateReport);

export default router;
```

```typescript
// routes/emission.ts
import { Router } from 'express';
import { EmissionController } from '../controllers/emission.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const ctrl = new EmissionController();

// Filter combos
router.get('/combo/year',          authenticate, ctrl.getComboYear);
router.get('/combo/calculation',   authenticate, ctrl.getComboCalculation);
router.get('/combo/country',       authenticate, ctrl.getComboCountry);
router.get('/combo/crop',          authenticate, ctrl.getComboCrop);

// Dashboard summary (total emission + chart by source)
router.get('/summary',             authenticate, ctrl.getDisplayDash);

// Emission per entity/chain actor
router.get('/by-entity/:entityId', authenticate, ctrl.getEntityEmission);

// Detail grid (paginated table: co2, n2o, ch4, co2e per source)
router.get('/detail-grid',         authenticate, ctrl.getDetailEmissionGrid);

// Emission data mapped to traceability actors (per district)
router.get('/by-district',         authenticate, ctrl.getEmissionByDistrict);

export default router;
```

### 4.2 API Endpoints Detail

#### `GET /api/traceability/commodity`

Mengembalikan daftar commodity yang memiliki transaksi dalam range waktu tertentu.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` (YYYY-MM-DD) | Ya | Tanggal mulai |
| `endDate` | `string` (YYYY-MM-DD) | Ya | Tanggal akhir |

**Response:**
```json
[
  { "id": 1, "label": "Cocoa" },
  { "id": 2, "label": "Coffee" },
  { "id": 103, "label": "Tuna" }
]
```

**SQL Original (dikonversi ke PostgreSQL):**
```sql
SELECT c.commo_id AS id, c.commo_name AS label
FROM rpt_maps_relation rmr
LEFT JOIN ref_commodity c ON c.commo_id = rmr.commo_id
WHERE rmr.partner_id_1 = ANY($1)
  AND DATE(rmr.date_transaction) >= $2
  AND DATE(rmr.date_transaction) <= $3
GROUP BY rmr.commo_id, c.commo_name
ORDER BY c.commo_name;
```

---

#### `GET /api/traceability/aggregator`

Mengembalikan daftar aggregator berdasarkan level cascading.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | Ya | |
| `endDate` | `string` | Ya | |
| `commoId` | `number` | Ya | |
| `aggregator1Id` | `number` | Tidak | Jika ada → query level 2 |
| `aggregator2Id` | `number` | Tidak | Jika ada → query level 3 |
| ... dst sampai `aggregator6Id` | | | |

**Logika Cascading:**
```
Tidak ada aggregatorId    → return list EndDestination1
aggregator1Id ada         → return list EndDestination2 WHERE EndDestination1 = aggregator1Id
aggregator1Id + 2Id ada   → return list EndDestination3 WHERE EndDestination2 = aggregator2Id
... dst
```

**Response:**
```json
[
  { "id": 123, "label": "PT. Example Corp" },
  { "id": 456, "label": "CV. Distributor ABC" }
]
```

---

#### `POST /api/traceability/trace`

**Endpoint utama** — mengembalikan seluruh data actors, transaksi, dan farm polygons.

**Body (JSON):**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "commoId": 1,
  "key": "",
  "aggregator1Id": null,
  "aggregator2Id": null,
  "aggregator3Id": null,
  "aggregator4Id": null,
  "aggregator5Id": null,
  "aggregator6Id": null,
  "aggregator7Id": null
}
```

**Response:**
```typescript
interface TraceResponse {
  success: boolean;
  message: string;
  producers: Actor[];           // tipe = 'producer' | 'vessel'
  producer_farms: FarmActor[];  // polygon data
  producer_farm_transactions: Transaction[];
  trader: Actor[];              // tipe = 'trader'
  warehouse: Actor[];           // tipe = 'warehouse'
  transactions: Transaction[];  // polyline data
  producer_harvest: Actor[];
  producer_harvest_transactions: Transaction[];
  totalActors: {
    producer?: number;
    vessel?: number;
    trader: number;
    warehouse: number;
  };
}

interface Actor {
  SupplierID: string;
  FarmerID: string;
  LocationID: string;
  Latitude: string;
  Longitude: string;
  Tipe: 'producer' | 'vessel' | 'trader' | 'warehouse' | 'farmproducer' | 'harvest';
  LatitudeParent: string;
  LongitudeParent: string;
  TransSupplyUID?: string;
  isShow: '0' | '1';
  PolyGeoJson?: string;      // GeoJSON string untuk farm
  Category?: string;
}

interface Transaction {
  ID_Trans: string;
  From: Actor;
  To: Actor;
}
```

**Logika Backend (Pseudocode):**
```
1. Query rpt_maps_relation dengan filter (date, commo, aggregators, key)
2. JOIN view_org untuk mendapat org_type (trader/warehouse) per supply chain level
3. Loop result → bangun array actors berdasarkan lat/long per level:
   - Level 0: Producer/Vessel (isShow = '0' jika tidak ada search key, '1' jika ada)
   - Level 1-7: Trader/Warehouse (isShow = '1')
   - Untuk setiap pasangan actor berurutan → buat Transaction { From, To }
4. Filter actors by type → producers, traders, warehouses
5. Dari producers, ambil:
   - Farm polygons (query farm_polygon table) → producer_farms + producer_farm_transactions
   - Harvest locations (query transaction_detail_location) → producer_harvest + producer_harvest_transactions
6. Return semua data
```

---

#### `POST /api/traceability/details/:id`

Mengembalikan detail profil actor + tabel transaksi saat marker diklik.

**Body:**
```json
{
  "id": "12345",
  "type": "actors-producer",
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "commoId": 1,
  "transSupplyUID": "12345_67890",
  "markerdata": { "FarmNr": 1 }
}
```

**Response:**
```json
[
  {
    "caption": "profile",
    "data": {
      "ID": "12345",
      "DisplayID": "FARM-001",
      "Name": "John Doe",
      "Gender": "Male",
      "Age": 45,
      "Location": "Desa X, Kec. Y, Kab. Z, Jawa Barat, Indonesia",
      "Tipe": "producer",
      "Transactions": 15,
      "Gross": "1.234 MT",
      "Net Weight": "1.100 MT",
      "polygon": "Yes",
      "harvest": "No"
    }
  },
  {
    "caption": "transaction",
    "data": [
      {
        "Date Transaction": "2024-03-15",
        "Transaction Number": "TRX-001",
        "Commodity Name": "Cocoa",
        "Commodity Type": "Fermented",
        "Plot Number": "1",
        "Gross (kg)": 500,
        "Nett (kg)": 480,
        "Type": "Farmer - Transaction",
        "Sold to": "TRAD-001 - PT. Example"
      }
    ]
  }
]
```

**Logika per Tipe Actor:**

| Tipe | Profil Query | Field Tampilan |
|---|---|---|
| `actors-producer` | `ref_supplier` by SupplierID | DisplayID, Name, Gender, Age, Location |
| `actors-vessel` | `ktv_entity` by UID | EntityDisplayID, EntityName, ExternalID |
| `actors-trader` | `view_org` by SupplychainID | DisplayID, Name/CompanyName, Phone, Address |
| `actors-farmproducer` | `farm_status + supplier` by SupplierID + FarmNr | DisplayID, Name, CommoName, FarmArea |
| `actors-harvest` | `transaction_detail_location` | DisplayID, Name, HarvestDate, LatLong |

---

#### `POST /api/traceability/export-excel`

Menghasilkan file XLSX dari data transaksi.

**Body:** Sama seperti `/trace` + tambahan `id`, `type`

**Response:**
```json
{
  "success": true,
  "fileUrl": "https://example.com/files/export/Traceability-Maps-2024.xlsx"
}
```

---

### 4.3 Emission API Endpoints Detail

#### `GET /api/emission/combo/year`

Mengembalikan daftar tahun survey yang memiliki data emisi.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `partnerId` | `number` | Ya | Partner ID user |

**Response:**
```json
[
  { "id": 2024, "label": "2024" },
  { "id": 2023, "label": "2023" }
]
```

---

#### `GET /api/emission/combo/calculation`

Mengembalikan tipe kalkulasi yang tersedia.

**Response:**
```json
[
  { "id": "AVERAGE PER FARMER", "label": "AVERAGE PER FARMER" },
  { "id": "AVERAGE PER HECTARE", "label": "AVERAGE PER HECTARE" },
  { "id": "AVERAGE PER TON CROP", "label": "AVERAGE PER TON CROP" },
  { "id": "SUM OF ALL FARMERS", "label": "SUM OF ALL FARMERS" }
]
```

---

#### `GET /api/emission/combo/country`

Mengembalikan daftar negara yang memiliki data emisi untuk tahun tertentu.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `partnerId` | `number` | Ya | Partner ID |
| `year` | `number` | Ya | Survey year |

**Response:**
```json
[
  { "id": "ID", "label": "Indonesia" },
  { "id": "VN", "label": "Vietnam" }
]
```

---

#### `GET /api/emission/combo/crop`

Mengembalikan daftar crop type untuk tahun tertentu.

**Query Params:** sama dengan `/combo/country`

**Response:**
```json
[
  { "id": "Cocoa", "label": "Cocoa" },
  { "id": "Coffee", "label": "Coffee" }
]
```

---

#### `GET /api/emission/summary`

**Endpoint utama emission** — mengembalikan total emisi & breakdown per source.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `fyear` | `number` | Ya | Survey year |
| `fcalculation` | `string` | Ya | Tipe kalkulasi |
| `fcountry` | `string` | Ya | Country ID |
| `fcrop` | `string` | Ya | Crop type |
| `Seed` | `string` | Tidak | Calculation filter per source (ORIGINAL/SCENARIO) |
| `Residue` | `string` | Tidak | " |
| `Fertiliser` | `string` | Tidak | " |
| `Soil` | `string` | Tidak | " |
| `Crop` | `string` | Tidak | " |
| `Carbon` | `string` | Tidak | " |
| `EnergyUseField` | `string` | Tidak | " |
| `EnergyUseProc` | `string` | Tidak | " |
| `WasteWater` | `string` | Tidak | " |
| `OffFarm` | `string` | Tidak | " |

**Response:**
```typescript
interface EmissionSummaryResponse {
  success: boolean;
  totalemission: number;        // Total CO2eq
  chart_source: {
    emissionsource: string;     // e.g. "Seed production"
    totalemission: number;      // CO2eq per source
  }[];
  updated_on_cft_crops: string; // "Jan 15 2025, 10:30:00 AM"
}
```

**Logika Kalkulasi Backend (per tipe):**
```sql
-- AVERAGE PER FARMER:
SELECT emissionsource, ROUND(SUM(co2e) / SUM(totalfarmer), 2) AS totalemission
FROM dash_cft_crop
WHERE partnerid = $1 AND districtid IN ($groupAccess) 
      AND countryid = $2 AND croptype = $3 AND SurveyYr = $4
GROUP BY emissionsource

-- AVERAGE PER HECTARE:  
-- Same but divide by SUM(totalcropha)

-- AVERAGE PER TON CROP:
-- Same but divide by SUM(totalfgton)

-- SUM OF ALL FARMERS:
SELECT emissionsource, ROUND(SUM(co2e), 2) AS totalemission
FROM dash_cft_crop WHERE ...
GROUP BY emissionsource
```

---

#### `GET /api/emission/by-entity/:entityId`

Mengembalikan detail emisi per entity (chain actor), termasuk chart dan donut data.

**Query Params:** sama dengan `/summary` + `entityId` di URL path

**Response:**
```typescript
interface EntityEmissionResponse {
  success: boolean;
  chart_source: {
    source: string;   // emission source name 
    value: number;    // total CO2eq
  }[];
  donat_source: {
    source: string;
    value: number;
  }[];
  donat_ghg: {
    category: string; // 'CO2', 'N2O', 'CH4'
    value: number;
  }[];
}
```

**SQL Key:**
```sql
SELECT `emission source` AS source, SUM(`Total CO2eq`) AS value 
FROM dash_cft_crop_ent
WHERE EntityID = $1 AND TypeofCalculation = $2 
      AND Countryname = $3 AND CropType = $4 AND SurveyYr = $5
GROUP BY `emission source`
ORDER BY (CASE 
    WHEN `emission source` = 'Seed production' THEN 1
    WHEN `emission source` = 'Residue management' THEN 2
    -- ... dst sampai 'Off-farm transport' = 10
END) ASC
```

---

#### `GET /api/emission/detail-grid`

Mengembalikan detail tabel emisi per source dengan breakdown gas (CO2, N2O, CH4, CO2eq), paginated.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `fyear` | `number` | Ya | |
| `fcalculation` | `string` | Ya | |
| `fcountry` | `string` | Ya | |
| `fcrop` | `string` | Ya | |
| `start` | `number` | Ya | Pagination offset |
| `limit` | `number` | Ya | Page size |
| `sort` | `string` | Tidak | JSON sort config |

**Response:**
```typescript
interface EmissionGridResponse {
  data: {
    emissionsource: string;
    co2: number;
    n2o: number;
    ch4: number;
    co2e: number;
  }[];
  total: number;  // total rows for pagination
}
```

---

#### `GET /api/emission/by-district`

**Endpoint baru — bridging** antara traceability map dan emission. Mengembalikan emisi teraggregasi per district untuk overlay pada peta.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `fyear` | `number` | Ya | |
| `fcalculation` | `string` | Ya | |
| `fcountry` | `string` | Ya | |
| `fcrop` | `string` | Ya | |

**Response:**
```typescript
interface EmissionByDistrictResponse {
  success: boolean;
  data: {
    districtId: string;
    provinceId: string;
    countryId: string;
    totalEmission: number;       // total CO2eq
    emissionPerFarmer: number;
    emissionPerHectare: number;
    emissionPerTonCrop: number;
    topSources: {
      source: string;
      value: number;
    }[];
  }[];
}
```

Endpoint ini memungkinkan overlay emission data di peta: actor yang berada di district tertentu bisa di-color-coded berdasarkan total emisi di district tsb.

---

## 5. Frontend — React Components

### 5.1 Hirarki Component

```
TraceabilityMapPage
├── FilterPanel              ← collapsible side panel
│   ├── DateRangePicker      (startDate, endDate)
│   ├── CommoditySelect      (react-select / Radix Select)
│   ├── AggregatorSelect[]   (cascading 1-7)
│   ├── SearchInput          (farmer ID/name)
│   └── ActionButtons        (Process, Clear, Reload)
│
├── EmissionFilterPanel      ← emission-specific filters
│   ├── YearSelect           (survey year)
│   ├── CalculationSelect    (per Farmer/Hectare/Ton/Sum)
│   ├── CountrySelect        (cascading dari year)
│   ├── CropSelect           (cascading dari year)
│   └── SearchButton + CalculationFilterBtn
│
├── MapView                  ← MapLibre GL container
│   ├── MarkerLayer          (producers, traders, warehouses, vessels)
│   │   └── EmissionColorOverlay  (marker color = emission level)
│   ├── PolylineLayer        (transactions)
│   ├── PolygonLayer         (farm areas)
│   ├── EmissionHeatmapLayer (heatmap CO2eq per area)
│   ├── WMSTileLayer[]       (admin boundary, KLHK landuse)
│   └── MapControls          (zoom, style switcher)
│
├── LegendPanel              ← inside map as overlay
│   ├── PolygonToggle
│   ├── ActorsCounts
│   ├── EmissionOverlayToggle ← NEW: toggle emission layer
│   ├── EmissionLegend        ← NEW: gradient scale for emission
│   ├── AdminBoundaryToggles
│   └── LanduseKLHKToggles
│
├── ActorDetailPanel         ← slide-in panel (right side)
│   ├── ProfileTab           (info table)
│   │   └── ActionButtons    (See Profile, Show/Hide Polygon/Harvest/Producer)
│   ├── TransactionTab       (data table + download button)
│   └── EmissionTab          ← NEW: per-actor emission breakdown
│       ├── EmissionSummaryCard   (total CO2eq badge)
│       ├── EmissionBarChart      (Recharts - by source)
│       ├── EmissionDonutChart    (Recharts - GHG breakdown)
│       └── EmissionDetailGrid    (paginated table)
│
└── EmissionDashboardPanel   ← collapsible bottom panel
    ├── TotalEmissionCard     (big number: kgCO2eq/unit)
    ├── EmissionBySourceChart (bar chart all 10 sources)
    └── LastUpdatedLabel
```

### 5.2 TypeScript Interfaces

```typescript
// features/traceability-map/types/index.ts

// ─── Filter ───────────────────────────────
export interface TraceFilter {
  startDate: string;          // YYYY-MM-DD
  endDate: string;
  commoId: number | null;
  key: string;
  aggregatorIds: (number | null)[];  // max 7 levels
}

// ─── Map Data ─────────────────────────────
export interface MapPoint {
  id: string;                 // "{tipe}-{supplierID}"
  latLng: [number, number];   // [lat, lng]
  data: ActorData;
  tag: string;                // "actors-producer" | "actors-trader" | etc
  iconUrl: string;
}

export interface MapPolyline {
  id: string;                 // "{fromTipe}-{fromID}-{toTipe}-{toID}" 
  path: [number, number][];
  data: TransactionData;
  tag: string;
  color: string;
}

export interface MapPolygon {
  id: string;                 // "farm-{tipe}-{supplierID}-{farmNr}"
  coordinates: [number, number][][];  // GeoJSON polygon coords
  data: FarmData;
  tag: string;
}

export interface ActorData {
  SupplierID: string;
  FarmerID: string;
  Latitude: string;
  Longitude: string;
  Tipe: ActorType;
  TransSupplyUID?: string;
  isShow: '0' | '1';
  PolyGeoJson?: string;
  FarmNr?: number;
  Category?: string;
}

export type ActorType = 
  | 'producer' 
  | 'vessel' 
  | 'trader' 
  | 'warehouse' 
  | 'farmproducer' 
  | 'harvest';

export interface TransactionData {
  ID_Trans: string;
  From: ActorData;
  To: ActorData;
}

export interface FarmData {
  SupplierID: string;
  FarmerID: string;
  Tipe: string;
  FarmNr: number;
  isShow: '0' | '1';
  PolyGeoJson: string;
}

// ─── Actor Detail ─────────────────────────
export interface ActorProfile {
  caption: 'profile';
  data: Record<string, string | number>;
}

export interface ActorTransaction {
  caption: 'transaction';
  data: Record<string, string | number>[];
}

export type ActorDetail = [ActorProfile, ActorTransaction];

// ─── Tile Layers ──────────────────────────
export interface TileLayerConfig {
  key: string;
  url: string;
  layers: string;
  caption: string;
  group: string;
  legend?: { type: string; color: string };
  items?: { color: string; value: string }[];
  order: number;
}

// ─── Line Colors ──────────────────────────
export const LINE_COLORS: Record<string, string> = {
  'actors-producer':       '#2BBE72',
  'actors-trader':         '#E28D00',
  'actors-warehouse':      '#5C0E16',
  'actors-farmproducer':   '#1F4788',
  'actors-vessel':         '#DB4D4E',
  'actors-harvest':        '#05DFD7',
};
```

### 5.2b Emission TypeScript Interfaces

```typescript
// features/traceability-map/types/emission.ts

// ─── Emission Filter ──────────────────────
export interface EmissionFilter {
  fyear: number;
  fcalculation: CalculationType;
  fcountry: string;
  fcrop: string;
  calculationFilters?: CalculationFilterPerSource;
}

export type CalculationType = 
  | 'AVERAGE PER FARMER'
  | 'AVERAGE PER HECTARE'
  | 'AVERAGE PER TON CROP'
  | 'SUM OF ALL FARMERS';

export interface CalculationFilterPerSource {
  Seed: 'ORIGINAL' | 'SCENARIO';
  Residue: 'ORIGINAL' | 'SCENARIO';
  Fertiliser: 'ORIGINAL' | 'SCENARIO';
  Soil: 'ORIGINAL' | 'SCENARIO';
  Crop: 'ORIGINAL' | 'SCENARIO';
  Carbon: 'ORIGINAL' | 'SCENARIO';
  EnergyUseField: 'ORIGINAL' | 'SCENARIO';
  EnergyUseProc: 'ORIGINAL' | 'SCENARIO';
  WasteWater: 'ORIGINAL' | 'SCENARIO';
  OffFarm: 'ORIGINAL' | 'SCENARIO';
}

// ─── Emission Data ────────────────────────
export interface EmissionSummary {
  success: boolean;
  totalemission: number;
  chart_source: EmissionSourceData[];
  updated_on_cft_crops: string;
}

export interface EmissionSourceData {
  emissionsource: string;
  totalemission: number;
}

export interface EmissionGridRow {
  emissionsource: string;
  co2: number;
  n2o: number;
  ch4: number;
  co2e: number;
}

export interface EmissionGridResponse {
  data: EmissionGridRow[];
  total: number;
}

// ─── Entity Emission (per chain actor) ────
export interface EntityEmission {
  success: boolean;
  chart_source: { source: string; value: number }[];
  donat_source: { source: string; value: number }[];
  donat_ghg: { category: string; value: number }[];
}

// ─── District Emission (for map overlay) ──
export interface DistrictEmission {
  districtId: string;
  provinceId: string;
  countryId: string;
  totalEmission: number;
  emissionPerFarmer: number;
  emissionPerHectare: number;
  emissionPerTonCrop: number;
  topSources: { source: string; value: number }[];
}

// ─── Emission Colors ──────────────────────
export const EMISSION_COLORS = {
  positive: '#814c46',   // emisi positif (polusi) → merah-coklat
  negative: '#2bbe72',   // emisi negatif (sequestrasi) → hijau
  neutral:  '#999999',
} as const;

// ─── Emission Gradient (untuk heatmap) ────
export const EMISSION_GRADIENT_STOPS = [
  { stop: 0.0, color: '#2bbe72' },    // low emission → hijau
  { stop: 0.3, color: '#f5e653' },    // medium → kuning
  { stop: 0.6, color: '#f5a623' },    // medium-high → oranye
  { stop: 1.0, color: '#d0021b' },    // high emission → merah
] as const;

// ─── Label Unit Helper ────────────────────
export function getEmissionUnitLabel(calculation: CalculationType): string {
  const base = 'kgCO2eq';
  switch (calculation) {
    case 'AVERAGE PER FARMER':   return `${base}/Farmer`;
    case 'AVERAGE PER HECTARE':  return `${base}/Hectare`;
    case 'AVERAGE PER TON CROP': return `${base}/Ton Crop`;
    case 'SUM OF ALL FARMERS':   return base;
  }
}

// ─── Emission Source Order (for sorting) ──
export const EMISSION_SOURCE_ORDER: Record<string, number> = {
  'Seed production': 1,
  'Residue management': 2,
  'Fertiliser production': 3,
  'Soil / fertiliser': 4,
  'Crop protection': 5,
  'Carbon stock changes': 6,
  'Energy use (field)': 7,
  'Energy use (processing)': 8,
  'Waste water': 9,
  'Off-farm transport': 10,
};
```

### 5.3 Zod Schema untuk Filter Form

```typescript
// features/traceability-map/lib/filter-schema.ts
import { z } from 'zod';

export const traceFilterSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commoId: z.number().nullable(),
  key: z.string().optional().default(''),
  aggregator1Id: z.number().nullable().optional(),
  aggregator2Id: z.number().nullable().optional(),
  aggregator3Id: z.number().nullable().optional(),
  aggregator4Id: z.number().nullable().optional(),
  aggregator5Id: z.number().nullable().optional(),
  aggregator6Id: z.number().nullable().optional(),
  aggregator7Id: z.number().nullable().optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End Date tidak boleh lebih kecil dari Start Date', path: ['endDate'] }
);

export type TraceFilterForm = z.infer<typeof traceFilterSchema>;
```

---

## 6. State Management & Data Flow

### 6.1 TanStack React Query Hooks

```typescript
// features/traceability-map/hooks/useTraceData.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { TraceFilter, ActorDetail } from '../types';

// 1. Commodity list
export function useCommodities(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['traceability', 'commodities', startDate, endDate],
    queryFn: () => api.get('/traceability/commodity', { 
      params: { startDate, endDate } 
    }),
    enabled: !!startDate && !!endDate,
  });
}

// 2. Aggregators (cascading)
export function useAggregators(params: {
  startDate: string;
  endDate: string;
  commoId: number | null;
  aggregatorIds: (number | null)[];
}) {
  return useQuery({
    queryKey: ['traceability', 'aggregators', params],
    queryFn: () => api.get('/traceability/aggregator', { params }),
    enabled: !!params.commoId,
  });
}

// 3. Main trace data
export function useTraceData() {
  return useMutation({
    mutationKey: ['traceability', 'trace'],
    mutationFn: (filter: TraceFilter) => 
      api.post('/traceability/trace', filter),
  });
}

// 4. Actor details
export function useActorDetails() {
  return useMutation({
    mutationKey: ['traceability', 'details'],
    mutationFn: (params: { 
      id: string; 
      type: string; 
      filter: TraceFilter;
      markerdata?: Record<string, any>;
      transSupplyUID?: string;
    }) => api.post(`/traceability/details/${params.id}`, params),
  });
}

// 5. Export Excel
export function useExportExcel() {
  return useMutation({
    mutationFn: (params: TraceFilter & { id: string; type: string }) =>
      api.post('/traceability/export-excel', params),
  });
}

// 6. Regenerate report
export function useRegenerateReport() {
  return useMutation({
    mutationFn: () => api.post('/traceability/generate-report'),
  });
}
```

### 6.1b Emission Query Hooks

```typescript
// features/traceability-map/hooks/useEmissionData.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { 
  EmissionFilter, EmissionSummary, EntityEmission, 
  EmissionGridResponse, DistrictEmission 
} from '../types/emission';

// 1. Combo filters
export function useEmissionYears(partnerId: number) {
  return useQuery({
    queryKey: ['emission', 'years', partnerId],
    queryFn: () => api.get<{ id: number; label: string }[]>(
      '/emission/combo/year', { params: { partnerId } }
    ),
    enabled: !!partnerId,
  });
}

export function useEmissionCalculations() {
  return useQuery({
    queryKey: ['emission', 'calculations'],
    queryFn: () => api.get<{ id: string; label: string }[]>(
      '/emission/combo/calculation'
    ),
  });
}

export function useEmissionCountries(partnerId: number, year: number) {
  return useQuery({
    queryKey: ['emission', 'countries', partnerId, year],
    queryFn: () => api.get<{ id: string; label: string }[]>(
      '/emission/combo/country', { params: { partnerId, Year: year } }
    ),
    enabled: !!partnerId && !!year,
  });
}

export function useEmissionCrops(partnerId: number, year: number) {
  return useQuery({
    queryKey: ['emission', 'crops', partnerId, year],
    queryFn: () => api.get<{ id: string; label: string }[]>(
      '/emission/combo/crop', { params: { partnerId, Year: year } }
    ),
    enabled: !!partnerId && !!year,
  });
}

// 2. Emission summary (total + chart by source)
export function useEmissionSummary(filter: EmissionFilter | null) {
  return useQuery({
    queryKey: ['emission', 'summary', filter],
    queryFn: () => api.get<EmissionSummary>('/emission/summary', {
      params: {
        fyear: filter!.fyear,
        fcalculation: filter!.fcalculation,
        fcountry: filter!.fcountry,
        fcrop: filter!.fcrop,
        ...filter!.calculationFilters,
      },
    }),
    enabled: !!filter?.fyear && !!filter?.fcountry && !!filter?.fcrop,
  });
}

// 3. Entity-level emission (per chain actor)
export function useEntityEmission(entityId: number | null, filter: EmissionFilter | null) {
  return useQuery({
    queryKey: ['emission', 'entity', entityId, filter],
    queryFn: () => api.get<EntityEmission>(
      `/emission/by-entity/${entityId}`, {
        params: {
          fyear: filter!.fyear,
          fcalculation: filter!.fcalculation,
          fcountry: filter!.fcountry,
          fcrop: filter!.fcrop,
          ...filter!.calculationFilters,
        },
      }
    ),
    enabled: !!entityId && !!filter,
  });
}

// 4. Detail grid (paginated)
export function useEmissionDetailGrid(filter: EmissionFilter | null, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['emission', 'grid', filter, page, pageSize],
    queryFn: () => api.get<EmissionGridResponse>('/emission/detail-grid', {
      params: {
        fyear: filter!.fyear,
        fcalculation: filter!.fcalculation,
        fcountry: filter!.fcountry,
        fcrop: filter!.fcrop,
        start: page * pageSize,
        limit: pageSize,
        ...filter!.calculationFilters,
      },
    }),
    enabled: !!filter,
  });
}

// 5. District-level emission (for map overlay)
export function useEmissionByDistrict(filter: EmissionFilter | null) {
  return useQuery({
    queryKey: ['emission', 'byDistrict', filter],
    queryFn: () => api.get<{ success: boolean; data: DistrictEmission[] }>(
      '/emission/by-district', {
        params: {
          fyear: filter!.fyear,
          fcalculation: filter!.fcalculation,
          fcountry: filter!.fcountry,
          fcrop: filter!.fcrop,
        },
      }
    ),
    enabled: !!filter?.fyear && !!filter?.fcountry,
  });
}
```

### 6.2 TraceabilityData Class (Port dari Original)

```typescript
// features/traceability-map/lib/traceability-data.ts
import type { 
  MapPoint, MapPolyline, MapPolygon, 
  ActorData, TransactionData, FarmData, 
  ActorType 
} from '../types';
import { LINE_COLORS } from '../types';

const ICON_BASE = '/images/icons/maps/';

export class TraceabilityData {
  points: MapPoint[] = [];
  polylines: MapPolyline[] = [];
  polygons: MapPolygon[] = [];

  // ─── Points ─────────────────────────────
  addPoint(point: MapPoint) {
    if (!this.points.find(p => p.id === point.id)) {
      this.points.push(point);
    }
  }

  // ─── Polylines ──────────────────────────
  addPolyline(line: MapPolyline) {
    if (!this.polylines.find(l => l.id === line.id)) {
      this.polylines.push(line);
    }
  }

  // ─── Polygons ───────────────────────────
  addPolygon(polygon: MapPolygon) {
    if (!this.polygons.find(p => p.id === polygon.id)) {
      this.polygons.push(polygon);
    }
  }

  // ─── Transform Actors → Points ──────────
  transformActors(actors: ActorData[]) {
    for (const actor of actors) {
      const lat = parseFloat(actor.Latitude);
      const lng = parseFloat(actor.Longitude);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) continue;

      this.addPoint({
        id: `${actor.Tipe}-${actor.SupplierID}`,
        latLng: [lat, lng],
        data: actor,
        tag: `actors-${actor.Tipe}`,
        iconUrl: `${ICON_BASE}${actor.Tipe}_small.png`,
      });
    }
  }

  // ─── Transform Transactions → Polylines ─
  transformTransactions(transactions: TransactionData[]) {
    for (const tx of transactions) {
      const fromLat = parseFloat(tx.From.Latitude);
      const fromLng = parseFloat(tx.From.Longitude);
      const toLat = parseFloat(tx.To.Latitude);
      const toLng = parseFloat(tx.To.Longitude);

      this.addPolyline({
        id: `${tx.From.Tipe}-${tx.From.SupplierID}-${tx.To.Tipe}-${tx.To.SupplierID}`,
        path: [[fromLat, fromLng], [toLat, toLng]],
        data: tx,
        tag: `transactions-${tx.From.Tipe}`,
        color: LINE_COLORS[`actors-${tx.From.Tipe}`] ?? '#999',
      });
    }
  }

  // ─── Transform Farm Polygons ────────────
  transformFarmPolygons(farms: FarmData[]) {
    for (const farm of farms) {
      if (!farm.PolyGeoJson) continue;
      
      const geoJson = JSON.parse(farm.PolyGeoJson);
      const coordinates = geoJson.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      );

      this.addPolygon({
        id: `farm-${farm.Tipe}-${farm.SupplierID}-${farm.FarmNr}`,
        coordinates: [coordinates],
        data: farm,
        tag: `actors-farm${farm.Tipe}`,
      });
    }
  }

  // ─── Visibility Helpers ─────────────────
  
  /** Tampilkan producer yang mensupply ke trader tertentu */
  showProducersForTrader(traderId: string) {
    const farmerIds: string[] = [];
    
    for (const line of this.polylines) {
      if (['producer', 'vessel'].includes(line.data.From.Tipe) 
          && line.data.To.SupplierID === traderId) {
        farmerIds.push(line.data.From.SupplierID);
        line.data.From.isShow = '1';
      }
    }

    for (const point of this.points) {
      if (farmerIds.includes(point.data.SupplierID)) {
        point.data.isShow = '1';
      }
    }

    for (const polygon of this.polygons) {
      if (farmerIds.includes(polygon.data.SupplierID)) {
        polygon.data.isShow = '1';
      }
    }
  }

  /** Sembunyikan producer dari trader tertentu */
  hideProducersForTrader(traderId: string) {
    const farmerIds: string[] = [];
    
    for (const line of this.polylines) {
      if (['producer', 'vessel'].includes(line.data.From.Tipe) 
          && line.data.To.SupplierID === traderId) {
        farmerIds.push(line.data.From.SupplierID);
        line.data.From.isShow = '0';
      }
    }

    for (const point of this.points) {
      if (farmerIds.includes(point.data.SupplierID)) {
        point.data.isShow = '0';
      }
    }

    for (const polygon of this.polygons) {
      if (farmerIds.includes(polygon.data.SupplierID)) {
        polygon.data.isShow = '0';
      }
    }
  }

  /** Toggle polygon visibility untuk producer tertentu */
  togglePolygon(farmerId: string, show: boolean) {
    for (const polygon of this.polygons) {
      if (polygon.data.SupplierID === farmerId) {
        polygon.data.isShow = show ? '1' : '0';
      }
    }
    // Also toggle farm-producer polylines
    for (const line of this.polylines) {
      if (line.data.From.Tipe === 'farmproducer' 
          && line.data.To.SupplierID === farmerId) {
        line.data.From.isShow = show ? '1' : '0';
      }
    }
  }

  /** Toggle semua polygon on/off */
  toggleAllPolygons(show: boolean) {
    const visibleProducers = this.points
      .filter(p => ['actors-producer', 'actors-vessel'].includes(p.tag) && p.data.isShow === '1')
      .map(p => p.data.FarmerID);

    const uniqueFarmerIds = [...new Set(visibleProducers)];

    for (const farmerId of uniqueFarmerIds) {
      this.togglePolygon(farmerId, show);
    }
  }

  // ─── Getters for Visible Data ───────────
  get visiblePoints() {
    return this.points.filter(p => p.data.isShow === '1');
  }

  get visiblePolylines() {
    return this.polylines.filter(l => l.data.From.isShow === '1');
  }

  get visiblePolygons() {
    return this.polygons.filter(p => p.data.isShow === '1');
  }

  /** Get unique producer count */
  get producerCount(): number {
    const unique = new Set(
      this.points
        .filter(p => ['actors-producer', 'actors-vessel'].includes(p.tag) && p.data.isShow === '1')
        .map(p => p.id.slice(p.id.indexOf('-') + 1, p.id.lastIndexOf('_')))
    );
    return unique.size;
  }

  get traderCount(): number {
    return this.points.filter(
      p => p.tag === 'actors-trader' && p.data.isShow === '1'
    ).length;
  }

  /** Fit bounds for all visible points */
  getBounds(): [[number, number], [number, number]] | null {
    const visible = this.visiblePoints;
    if (visible.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    for (const p of this.points) {
      const [lat, lng] = p.latLng;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return [[minLng, minLat], [maxLng, maxLat]];  // MapLibre format [sw, ne]
  }

  /** Reset semua data */
  clear() {
    this.points = [];
    this.polylines = [];
    this.polygons = [];
  }
}
```

---

## 7. Map Layer — MapLibre GL

### 7.1 Migrasi dari Google Maps ke MapLibre GL

| Google Maps (Original) | MapLibre GL (Target) |
|---|---|
| `google.maps.Map` | `maplibregl.Map` |
| `gmap3({ marker: {...} })` | `map.addSource()` + `map.addLayer({ type: 'symbol' })` |
| `gmap3({ polyline: {...} })` | `map.addLayer({ type: 'line' })` |
| `gmap3({ polygon: {...} })` | `map.addLayer({ type: 'fill' })` |
| `google.maps.ImageMapType` (WMS) | `map.addSource({ type: 'raster', tiles: [wmsUrl] })` |
| `google.maps.StyledMapType` | MapLibre style JSON (silver/dark) |
| `InfoBox` | `maplibregl.Popup` |
| `fitBounds()` | `map.fitBounds()` |
| `google.maps.LatLngBounds` | `maplibregl.LngLatBounds` |

### 7.2 MapView Component

```tsx
// features/traceability-map/components/MapView.tsx
import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TraceabilityData } from '../lib/traceability-data';

interface MapViewProps {
  traceData: TraceabilityData;
  onMarkerClick: (actorData: any, tag: string) => void;
  visibleLayers: Record<string, boolean>;
}

export function MapView({ traceData, onMarkerClick, visibleLayers }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Gunakan free tile seperti MapTiler, OSM, atau self-hosted
      style: 'https://demotiles.maplibre.org/style.json', 
      center: [119.949203, -4.433497],  // Indonesia center
      zoom: 3,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Render trace data whenever it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    renderMarkers(map, traceData);
    renderPolylines(map, traceData);
    renderPolygons(map, traceData);

    // Fit bounds
    const bounds = traceData.getBounds();
    if (bounds) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 17 });
    }
  }, [traceData, traceData.visiblePoints.length]);

  // ─── Render Markers as GeoJSON Source ───
  const renderMarkers = useCallback((map: maplibregl.Map, data: TraceabilityData) => {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.visiblePoints.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.latLng[1], point.latLng[0]], // [lng, lat]
        },
        properties: {
          id: point.id,
          tag: point.tag,
          icon: point.data.Tipe,
          ...point.data,
        },
      })),
    };

    if (map.getSource('actors')) {
      (map.getSource('actors') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('actors', { type: 'geojson', data: geojson });

      // Load icons terlebih dahulu
      const iconTypes = ['producer', 'vessel', 'trader', 'warehouse', 'farmproducer', 'harvest'];
      for (const type of iconTypes) {
        map.loadImage(`/images/icons/maps/${type}_small.png`, (error, image) => {
          if (error || !image) return;
          if (!map.hasImage(`icon-${type}`)) {
            map.addImage(`icon-${type}`, image);
          }
        });
      }

      map.addLayer({
        id: 'actors-layer',
        type: 'symbol',
        source: 'actors',
        layout: {
          'icon-image': ['concat', 'icon-', ['get', 'icon']],
          'icon-size': 0.8,
          'icon-allow-overlap': true,
        },
      });

      // Click handler
      map.on('click', 'actors-layer', (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties;
          onMarkerClick(props, props.tag);
        }
      });

      map.on('mouseenter', 'actors-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'actors-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [onMarkerClick]);

  // ─── Render Polylines ───────────────────
  const renderPolylines = useCallback((map: maplibregl.Map, data: TraceabilityData) => {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.visiblePolylines.map(line => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: line.path.map(([lat, lng]) => [lng, lat]),
        },
        properties: {
          id: line.id,
          tag: line.tag,
          color: line.color,
        },
      })),
    };

    if (map.getSource('transactions')) {
      (map.getSource('transactions') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('transactions', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'transactions-layer',
        type: 'line',
        source: 'transactions',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 1,
        },
      });
    }
  }, []);

  // ─── Render Polygons ────────────────────
  const renderPolygons = useCallback((map: maplibregl.Map, data: TraceabilityData) => {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.visiblePolygons.map(poly => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [poly.coordinates[0].map(([lat, lng]) => [lng, lat])],
        },
        properties: {
          id: poly.id,
          tag: poly.tag,
          ...poly.data,
        },
      })),
    };

    if (map.getSource('farms')) {
      (map.getSource('farms') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('farms', { type: 'geojson', data: geojson });
      
      // Fill layer
      map.addLayer({
        id: 'farms-fill',
        type: 'fill',
        source: 'farms',
        paint: {
          'fill-color': 'blue',
          'fill-opacity': 0.35,
        },
      });

      // Outline layer
      map.addLayer({
        id: 'farms-outline',
        type: 'line',
        source: 'farms',
        paint: {
          'line-color': 'blue',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Click handler for polygon
      map.on('click', 'farms-fill', (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties;
          onMarkerClick(props, props.tag);
        }
      });
    }
  }, [onMarkerClick]);

  // ─── WMS Tile Layers (Admin Boundary, KLHK) ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const wmsLayers: Record<string, { url: string; layers: string }> = {
      'adm-gadm_lv1': {
        url: 'https://geoserver.api.kolti.net/geoserver/Koltiva-Internal/wms',
        layers: 'Koltiva-Internal:lg_gis_int_gadm_lv1',
      },
      'adm-gadm_lv2': {
        url: 'https://geoserver.api.kolti.net/geoserver/Koltiva-Internal/wms',
        layers: 'Koltiva-Internal:lg_gis_int_gadm_lv2',
      },
      // ... dst
    };

    // Toggle WMS layers based on visibleLayers state
    for (const [key, config] of Object.entries(wmsLayers)) {
      const sourceId = `wms-${key}`;
      const layerId = `wms-layer-${key}`;

      if (visibleLayers[key] && !map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [
            `${config.url}?service=WMS&version=1.1.1&request=GetMap` +
            `&layers=${config.layers}&srs=EPSG:4326` +
            `&bbox={bbox-epsg-3857}&width=256&height=256` +
            `&format=image/png&transparent=true`
          ],
          tileSize: 256,
        });
        map.addLayer({ id: layerId, type: 'raster', source: sourceId });
      } else if (!visibleLayers[key] && map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }
    }
  }, [visibleLayers]);

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
  );
}
```

### 7.3 Map Style Themes

```typescript
// features/traceability-map/lib/map-styles.ts

// Untuk MapLibre, gunakan style JSON lengkap, bukan hanya array styling Google Maps.
// Contoh menggunakan MapTiler (atau self-hosted tile server)

export const MAP_STYLES = {
  roadmap: 'https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_KEY',
  satellite: 'https://api.maptiler.com/maps/satellite/style.json?key=YOUR_KEY',
  silver: 'https://api.maptiler.com/maps/positron/style.json?key=YOUR_KEY',
  dark: 'https://api.maptiler.com/maps/toner-v2/style.json?key=YOUR_KEY',
} as const;

// Atau gunakan free OSM-based styles
export const FREE_MAP_STYLES = {
  roadmap: 'https://demotiles.maplibre.org/style.json',
  // Untuk satellite, perlu Mapbox/MapTiler key
};
```

### 7.4 WMS Tile Layer Constants

```typescript
// features/traceability-map/lib/constants.ts

export const GEOSERVER_BASE = 'https://geoserver.api.kolti.net/geoserver';

export const WMS_ADM_BOUNDARY = [
  {
    key: 'gadm_lv1',
    group: 'adm-boundary',
    url: `${GEOSERVER_BASE}/Koltiva-Internal/wms`,
    layers: 'Koltiva-Internal:lg_gis_int_gadm_lv1',
    caption: 'Lv.1 Province',
    legend: { type: 'single', color: '#034e7b' },
    order: 94,
  },
  {
    key: 'gadm_lv2',
    group: 'adm-boundary',
    url: `${GEOSERVER_BASE}/Koltiva-Internal/wms`,
    layers: 'Koltiva-Internal:lg_gis_int_gadm_lv2',
    caption: 'Lv.2 District',
    legend: { type: 'single', color: '#0570b0' },
    order: 93,
  },
  {
    key: 'gadm_lv3',
    group: 'adm-boundary',
    url: `${GEOSERVER_BASE}/Koltiva-Internal/wms`,
    layers: 'Koltiva-Internal:lg_gis_int_gadm_lv3',
    caption: 'Lv.3 Sub District',
    legend: { type: 'single', color: '#74a9cf' },
    order: 92,
  },
  {
    key: 'gadm_lv4',
    group: 'adm-boundary',
    url: `${GEOSERVER_BASE}/Koltiva-Internal/wms`,
    layers: 'Koltiva-Internal:lg_gis_int_gadm_lv4',
    caption: 'Lv.4 Village',
    legend: { type: 'single', color: '#bdc9e1' },
    order: 91,
  },
] as const;

export const WMS_KLHK = [
  {
    key: 'klhk',
    group: 'Landuse-KLHK',
    url: `${GEOSERVER_BASE}/gwc/service/tms/1.0.0/Koltiva-Internal:Kawasan_Hutan_KLHK_IDN_2019@EPSG%3A900913@png/{z}/{x}/{y}.png`,
    layers: 'Koltiva-Internal:Kawasan_Hutan_KLHK_IDN_2019',
    caption: 'Forest Area (IDN, 2019)',
    order: 8,
    items: [
      { color: '#02AD00', value: 'Protected Forest' },
      { color: '#AD3FFF', value: 'Conservation Forest' },
      { color: '#8AF200', value: 'Fixed Production Forest' },
      { color: '#FFFF00', value: 'Limited Production Forest' },
      { color: '#FF5EFF', value: 'Conversion Production Forest' },
      { color: '#FFFFFF', value: 'Other Usage Area' },
    ],
  },
] as const;

export const TUNA_COMMODITY_ID = 103;

export const ACTOR_ICONS: Record<string, { icon: string; caption: string }> = {
  producer:     { icon: 'producer_medium',  caption: 'Producer' },
  vessel:       { icon: 'vessel_medium',    caption: 'Vessel' },
  'producer-farm': { icon: 'producer_farm', caption: 'Producer Farm Polygons' },
  trader:       { icon: 'trader_medium',    caption: 'Business' },
};
```

---

## 8. Kode Contoh Lengkap

### 8.1 FilterPanel.tsx

```tsx
// features/traceability-map/components/FilterPanel.tsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { traceFilterSchema, type TraceFilterForm } from '../lib/filter-schema';
import { useCommodities, useAggregators } from '../hooks/useTraceData';
import { TUNA_COMMODITY_ID } from '../lib/constants';

interface FilterPanelProps {
  onProcess: (data: TraceFilterForm) => void;
  onClear: () => void;
  onReload: () => void;
  isLoading: boolean;
}

export function FilterPanel({ onProcess, onClear, onReload, isLoading }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);

  const form = useForm<TraceFilterForm>({
    resolver: zodResolver(traceFilterSchema),
    defaultValues: {
      startDate: defaultStart.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      commoId: null,
      key: '',
    },
  });

  const watchStartDate = form.watch('startDate');
  const watchEndDate = form.watch('endDate');
  const watchCommoId = form.watch('commoId');

  // Fetch commodities
  const { data: commodities = [] } = useCommodities(watchStartDate, watchEndDate);

  // Cascading aggregators
  const maxTiers = 7;
  const [aggregatorLevels, setAggregatorLevels] = useState<(number | null)[]>(
    Array(maxTiers).fill(null)
  );

  const isTuna = watchCommoId === TUNA_COMMODITY_ID;

  return (
    <div className={`
      absolute top-2.5 left-2.5 z-10 bg-white rounded-2xl p-3 shadow-lg 
      transition-all duration-300 max-h-[calc(90vh-48px)] overflow-hidden
      ${collapsed ? 'w-[30px]' : 'w-[300px]'}
    `}>
      <AnimatePresence mode="wait">
        {collapsed ? (
          <button onClick={() => setCollapsed(false)}>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-semibold text-gray-800">Filter</span>
              <button onClick={() => setCollapsed(true)}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form 
              onSubmit={form.handleSubmit(onProcess)}
              className="bg-gray-100 rounded-lg p-3 space-y-2.5"
            >
              {/* Date Range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700">From</label>
                  <input
                    type="date"
                    {...form.register('startDate')}
                    className="w-full h-[30px] text-xs rounded-lg border-0 px-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700">To</label>
                  <input
                    type="date"
                    {...form.register('endDate')}
                    className="w-full h-[30px] text-xs rounded-lg border-0 px-2"
                  />
                </div>
              </div>

              {/* Commodity */}
              <div>
                <label className="text-xs font-medium text-gray-700">Commodity</label>
                <Controller
                  name="commoId"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-[30px] text-xs rounded-lg border-0 px-2"
                    >
                      <option value="">Choose Commodity</option>
                      {commodities.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Aggregators (cascading) — render dynamically */}
              {/* ... Level 1: Delivery Destination, Level 2-7: Tier 1-6 */}

              {/* Search */}
              <div>
                <label className="text-xs font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  {...form.register('key')}
                  placeholder={isTuna ? 'Search by Vessel Name/Vessel ID' : 'Search by Farmer ID/Name'}
                  className="w-full h-[30px] text-xs rounded-lg border-0 px-2"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-[30px] bg-[#2bbe72] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Process'}
                </button>
                <button type="button" onClick={onClear} className="h-[30px] w-[34px] bg-[#caeaff] rounded-lg">
                  <Trash2 className="w-4 h-4 mx-auto text-[#4a90e2]" />
                </button>
                <button type="button" onClick={onReload} className="h-[30px] w-[34px] bg-[#caeaff] rounded-lg">
                  <RefreshCw className="w-4 h-4 mx-auto text-[#4a90e2]" />
                </button>
              </div>
            </form>

            {/* Legend panel akan ditaruh di bawah sini */}
            <div className="mt-1.5 max-h-[44vh] overflow-y-auto">
              {/* <LegendPanel /> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 8.2 ActorDetailPanel.tsx

```tsx
// features/traceability-map/components/ActorDetailPanel.tsx
import { useState } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActorDetail } from '../types';

interface ActorDetailPanelProps {
  detail: ActorDetail | null;
  context: { data: any; tag: string } | null;
  onClose: () => void;
  onShowHideProducer: (id: string, show: boolean) => void;
  onShowHidePolygon: (farmerId: string, show: boolean) => void;
  onSeeProfile: (id: string, type: string) => void;
  onDownloadTransaction: () => void;
}

export function ActorDetailPanel({
  detail,
  context,
  onClose,
  onShowHideProducer,
  onShowHidePolygon,
  onSeeProfile,
  onDownloadTransaction,
}: ActorDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'transaction'>('profile');

  if (!detail || !context) return null;

  const [profileSection, transactionSection] = detail;
  const tipe = context.data.Tipe;
  const isProducer = ['producer', 'vessel'].includes(tipe);

  // Excluded keys dari tampilan profil
  const excludeKeys = ['ID', 'polygon', 'harvest'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute top-2.5 right-2.5 z-10 bg-white rounded-2xl shadow-lg w-[380px] max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <img
            src="/images/icons/maps/default-photo.png"
            alt="actor"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="font-semibold text-sm">{profileSection.data.Name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              ID: <span id="actor-display-id">{profileSection.data.DisplayID}</span>
              <button
                onClick={() => navigator.clipboard.writeText(String(profileSection.data.DisplayID))}
                className="hover:text-gray-800"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'transaction', label: 'Transaction' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#2bbe72] text-[#2bbe72]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(profileSection.data)
                    .filter(([key]) => !excludeKeys.includes(key))
                    .map(([key, value]) => (
                      <tr key={key}>
                        <td className="py-1 pr-3 text-gray-500 whitespace-nowrap w-28">{key}</td>
                        <td className="py-1 bg-emerald-50 px-2 rounded">{String(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!['farmproducer', 'vessel'].includes(tipe) && (
                  <button
                    onClick={() => onSeeProfile(profileSection.data.ID as string, tipe)}
                    className="flex-1 py-1.5 bg-[#2bbe72] text-white text-xs font-semibold rounded-lg"
                  >
                    See Profile
                  </button>
                )}

                {isProducer ? (
                  <button
                    onClick={() => onShowHidePolygon(context.data.FarmerID, true)}
                    disabled={profileSection.data.polygon === 'No'}
                    className="flex-1 py-1.5 bg-[#2bbe72] text-white text-xs font-semibold rounded-lg disabled:bg-gray-400"
                  >
                    Show Polygons
                  </button>
                ) : (
                  <button
                    onClick={() => onShowHideProducer(context.data.SupplierID, true)}
                    className="flex-1 py-1.5 bg-[#2bbe72] text-white text-xs font-semibold rounded-lg"
                  >
                    Show Producer
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transaction' && transactionSection.data.length > 0 && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-2 text-left">#</th>
                      {Object.keys(transactionSection.data[0]).map((header) => (
                        <th key={header} className="py-2 px-2 text-left capitalize">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactionSection.data.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-2">{index + 1}</td>
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="py-2 px-2">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={onDownloadTransaction}
                className="ml-auto flex items-center gap-1.5 py-1.5 px-3 bg-[#2bbe72] text-white text-xs font-semibold rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download Transaction
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### 8.3 TraceabilityMapPage.tsx (Halaman Utama)

```tsx
// pages/TraceabilityMapPage.tsx
import { useState, useCallback, useRef } from 'react';
import { FilterPanel } from '@/features/traceability-map/components/FilterPanel';
import { MapView } from '@/features/traceability-map/components/MapView';
import { LegendPanel } from '@/features/traceability-map/components/LegendPanel';
import { ActorDetailPanel } from '@/features/traceability-map/components/ActorDetailPanel';
import { TraceabilityData } from '@/features/traceability-map/lib/traceability-data';
import { useTraceData, useActorDetails, useExportExcel } from '@/features/traceability-map/hooks/useTraceData';
import type { TraceFilterForm } from '@/features/traceability-map/lib/filter-schema';
import type { ActorDetail } from '@/features/traceability-map/types';

export default function TraceabilityMapPage() {
  // State
  const [traceData] = useState(() => new TraceabilityData());
  const [renderKey, setRenderKey] = useState(0);          // force re-render
  const [activeFilter, setActiveFilter] = useState<TraceFilterForm | null>(null);
  const [selectedActor, setSelectedActor] = useState<any>(null);
  const [actorDetail, setActorDetail] = useState<ActorDetail | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});

  // Hooks
  const traceMutation = useTraceData();
  const detailMutation = useActorDetails();
  const exportMutation = useExportExcel();

  // ─── Process (btn click) ────────────────
  const handleProcess = useCallback((filter: TraceFilterForm) => {
    setActiveFilter(filter);
    traceData.clear();
    setActorDetail(null);

    traceMutation.mutate(filter as any, {
      onSuccess: (response) => {
        const {
          producers, producer_farms, producer_farm_transactions,
          trader, warehouse, transactions,
          producer_harvest, producer_harvest_transactions,
        } = response;

        // Transform data
        traceData.transformActors(producers ?? []);
        traceData.transformActors(trader ?? []);
        traceData.transformActors(warehouse ?? []);
        traceData.transformActors(producer_harvest ?? []);

        traceData.transformTransactions(transactions ?? []);
        traceData.transformTransactions(producer_farm_transactions ?? []);
        traceData.transformTransactions(producer_harvest_transactions ?? []);

        if (producer_farms) {
          traceData.transformFarmPolygons(producer_farms);
        }

        setRenderKey((k) => k + 1);  // trigger MapView re-render
      },
    });
  }, [traceData, traceMutation]);

  // ─── Marker Click ───────────────────────
  const handleMarkerClick = useCallback((actorData: any, tag: string) => {
    if (!activeFilter) return;

    setSelectedActor({ data: actorData, tag });

    detailMutation.mutate({
      id: actorData.SupplierID,
      type: tag,
      filter: activeFilter as any,
      markerdata: actorData,
      transSupplyUID: actorData.TransSupplyUID,
    }, {
      onSuccess: (response) => setActorDetail(response as ActorDetail),
    });
  }, [activeFilter, detailMutation]);

  // ─── Clear ──────────────────────────────
  const handleClear = useCallback(() => {
    traceData.clear();
    setActorDetail(null);
    setSelectedActor(null);
    setRenderKey((k) => k + 1);
  }, [traceData]);

  // ─── Show/Hide Producer ─────────────────
  const handleShowHideProducer = useCallback((id: string, show: boolean) => {
    if (show) {
      traceData.showProducersForTrader(id);
    } else {
      traceData.hideProducersForTrader(id);
    }
    setRenderKey((k) => k + 1);
    setActorDetail(null);
  }, [traceData]);

  // ─── Show/Hide Polygon ──────────────────
  const handleShowHidePolygon = useCallback((farmerId: string, show: boolean) => {
    traceData.togglePolygon(farmerId, show);
    setRenderKey((k) => k + 1);
    setActorDetail(null);
  }, [traceData]);

  // ─── Layer Toggle ───────────────────────
  const handleLayerToggle = useCallback((layerKey: string, visible: boolean) => {
    setVisibleLayers((prev) => ({ ...prev, [layerKey]: visible }));
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map (full screen background) */}
      <MapView
        key={renderKey}
        traceData={traceData}
        onMarkerClick={handleMarkerClick}
        visibleLayers={visibleLayers}
      />

      {/* Filter Panel (left overlay) */}
      <FilterPanel
        onProcess={handleProcess}
        onClear={handleClear}
        onReload={() => {/* call useRegenerateReport */}}
        isLoading={traceMutation.isPending}
      />

      {/* Legend Panel (inside FilterPanel, below filter form) */}
      <LegendPanel
        traceData={traceData}
        onLayerToggle={handleLayerToggle}
        onToggleAllPolygons={(show) => {
          traceData.toggleAllPolygons(show);
          setRenderKey((k) => k + 1);
        }}
      />

      {/* Actor Detail Panel (right overlay) */}
      <ActorDetailPanel
        detail={actorDetail}
        context={selectedActor}
        onClose={() => { setActorDetail(null); setSelectedActor(null); }}
        onShowHideProducer={handleShowHideProducer}
        onShowHidePolygon={handleShowHidePolygon}
        onSeeProfile={(id, type) => {
          window.open(`/printout/${type === 'producer' ? '' : 'sme_'}profile/${id}`, '_blank');
        }}
        onDownloadTransaction={() => {
          if (activeFilter && selectedActor) {
            exportMutation.mutate({
              ...activeFilter,
              id: selectedActor.data.SupplierID,
              type: selectedActor.tag,
            } as any);
          }
        }}
      />
    </div>
  );
}
```

### 8.4 Backend Service Example

```typescript
// services/traceability.service.ts
import { db } from '../db';
import { rptMapsRelation } from '../db/schema/rpt-maps-relation';
import { refCommodity } from '../db/schema/ref-commodity';
import { viewOrg } from '../db/schema/view-org';
import { eq, and, between, like, sql, inArray } from 'drizzle-orm';

export class TraceabilityService {

  async getCommodities(startDate: string, endDate: string, partnerIds: number[]) {
    const result = await db
      .select({
        id: refCommodity.commoId,
        label: refCommodity.commoName,
      })
      .from(rptMapsRelation)
      .leftJoin(refCommodity, eq(refCommodity.commoId, rptMapsRelation.commoId))
      .where(
        and(
          inArray(rptMapsRelation.partnerId1, partnerIds),
          sql`DATE(${rptMapsRelation.dateTransaction}) >= ${startDate}`,
          sql`DATE(${rptMapsRelation.dateTransaction}) <= ${endDate}`,
        )
      )
      .groupBy(rptMapsRelation.commoId, refCommodity.commoName)
      .orderBy(refCommodity.commoName);

    return result.length > 0 ? result : [{ id: null, label: '' }];
  }

  async getAggregators(params: {
    startDate: string;
    endDate: string;
    commoId: number;
    aggregatorIds: (number | null)[];
    partnerIds: number[];
    supplychainId?: number;
    isAdmin: boolean;
  }) {
    // Determine which EndDestination level to query based on aggregatorIds
    let level = 1;
    for (let i = 0; i < params.aggregatorIds.length; i++) {
      if (params.aggregatorIds[i]) {
        level = i + 2;
      } else {
        break;
      }
    }

    const destColumn = `end_destination_${level}` as keyof typeof rptMapsRelation;
    
    // Build dynamic query similar to original PHP model
    // ... (implementation depends on Drizzle ORM dynamic query building)
    
    return [];  // Placeholder
  }

  async trace(filter: {
    startDate: string;
    endDate: string;
    commoId: number;
    key: string;
    aggregatorIds: (number | null)[];
    partnerIds: number[];
    isAdmin: boolean;
    supplychainId?: number;
  }) {
    // 1. Query rpt_maps_relation with all JOINs
    // 2. Transform rows into actors + transactions 
    // 3. Get farm polygons for producers
    // 4. Get harvest data for producers
    // This mirrors the logic in trace_post() of the original controller

    // Pseudocode:
    const rows = await this.queryMarkerRelation(filter);
    
    const actors: any[] = [];
    const transactions: any[] = [];

    for (const row of rows) {
      // Level 0: Producer/Vessel
      if (row.lat_0) {
        actors.push({
          SupplierID: row.farmer_id,
          FarmerID: row.farmer_id,
          Latitude: row.lat_0,
          Longitude: row.long_0,
          Tipe: row.trans_supply_type_id === 4 ? 'vessel' : 'producer',
          isShow: filter.key ? '1' : '0',
        });
      }

      // Level 1-7: Iterate and create actors + transactions
      for (let lvl = 1; lvl <= 7; lvl++) {
        const lat = row[`lat_${lvl}`];
        const lng = row[`long_${lvl}`];
        const scId = row[`supplychain_id_${lvl}`];
        
        if (lat && lng && scId) {
          const orgType = row[`org_type_${lvl}`]; // from VIEW_ORG join
          actors.push({
            SupplierID: scId,
            Latitude: lat,
            Longitude: lng,
            Tipe: orgType ?? 'trader',
            isShow: '1',
          });
          
          // Transaction from previous level to this level
          // ...
        }
      }
    }

    // Deduplicate dan categorize
    const producers = actors.filter(a => ['producer', 'vessel'].includes(a.Tipe));
    const traders = actors.filter(a => a.Tipe === 'trader');
    const warehouses = actors.filter(a => a.Tipe === 'warehouse');

    // Get farm polygons
    const farmData = await this.getProducerFarms(producers.map(p => p.FarmerID), filter);

    return {
      success: true,
      producers,
      trader: traders,
      warehouse: warehouses,
      transactions,
      producer_farms: farmData.polygons,
      producer_farm_transactions: farmData.transactions,
      // ... harvest data
    };
  }

  private async queryMarkerRelation(filter: any) {
    // Complex SQL query — recommend using raw SQL via Drizzle's sql`` tag
    // since the original query is highly dynamic with comment-based conditionals
    return [];
  }

  private async getProducerFarms(farmerIds: string[], filter: any) {
    // Query farm_polygon table with PostGIS
    // SELECT ST_AsGeoJSON(polygon), ... WHERE supplier_id IN (...)
    return { polygons: [], transactions: [] };
  }
}
```

---

## 9. Mapping File Original → File Baru

| File Original | File Target (React) | Fungsi |
|---|---|---|
| `application/controllers/maps/maps_traceability_v2.php` | `pages/TraceabilityMapPage.tsx` | Halaman utama / routing |
| `application/views/maps/traceability/v_maps_traceability_v2.php` | `features/traceability-map/components/FilterPanel.tsx` + `MapView.tsx` | HTML template → React components |
| `api/application/controllers/map/maps_traceability_v2.php` | `routes/traceability.ts` + `controllers/traceability.controller.ts` | API routing + handler |
| `api/application/models/traceability/api/mtraceability_maps_v2.php` | `services/traceability.service.ts` + `db/schema/*.ts` | Data layer / ORM |
| `js/modules/maps/traceability_v2/main.js` | `pages/TraceabilityMapPage.tsx` + `hooks/useTraceData.ts` | Orchestrasi, event handler, API call |
| `js/modules/maps/traceability_v2/class_feature.js` | `lib/traceability-data.ts` | Class `TraceabilityData`, transform, visibility |
| `js/modules/maps/traceability_v2/variables.js` | `lib/constants.ts` + `types/index.ts` | Konfigurasi, tile layers, warna, icon |
| `js/modules/maps/traceability_v2/components.js` | `components/LegendPanel.tsx` | Legend builder (Polygon, Actors, ADM, KLHK) |
| `js/modules/maps/traceability_v2/events.js` | `components/MapView.tsx` (useEffect hooks) | Map init, panel toggle, clear, show/hide layer |
| `js/modules/maps/traceability_v2/gmap_style.js` | `lib/map-styles.ts` | Map themes (silver, dark) |
| `css/modules/map/maps_traceability_v2.css` | Tailwind classes in components | Styling |
| `application/views/dboard/cft_crop.php` | `features/traceability-map/components/EmissionFilterPanel.tsx` + `EmissionDashboardPanel.tsx` | Emission dashboard view |
| `api/application/controllers/dboard/cft_crop.php` | `routes/emission.ts` + `controllers/emission.controller.ts` | Emission API routing + handler |
| `api/application/models/dboard/mcft_crop.php` | `services/emission.service.ts` + `db/schema/dash-cft-crop.ts` | Emission data layer |
| `js/modules/dboard/cft_crop.js` | `hooks/useEmissionData.ts` + `components/EmissionChart.tsx` | Emission frontend logic |
| `js/app/store/Dboard/MainGridCftCrop.js` | `hooks/useEmissionData.ts` (`useEmissionDetailGrid`) | ExtJS Store → TanStack Query |

---

## 10. Catatan Migrasi & Tips

### 10.1 Google Maps → MapLibre GL

1. **Koordinat format**: Google Maps → `new google.maps.LatLng(lat, lng)` | MapLibre → `[lng, lat]` (GeoJSON standard). Perhatikan swap lat/lng!

2. **Marker icons**: Google Maps → inline `icon: { url, anchor }` | MapLibre → harus `loadImage()` + `addImage()` sebelum digunakan di layer.

3. **WMS tiles**: MapLibre mendukung WMS via `raster` source. Gunakan `{bbox-epsg-3857}` sebagai placeholder bbox di URL tiles.

4. **gmap3 plugin**: Tidak ada equivalent di MapLibre. Gunakan langsung `map.addSource()` + `map.addLayer()` API.

5. **InfoBox**: Diganti dengan `maplibregl.Popup` atau React portal overlay.

6. **Polyline arrows**: MapLibre line layer tidak support inline symbol repeat seperti Google Maps. Gunakan `line` layer + separate `symbol` layer dengan `symbol-placement: 'line'` dan custom arrow icon.

### 10.2 ExtJS → React

| ExtJS | React Equivalent |
|---|---|
| `Ext.Ajax.request()` | TanStack React Query `useMutation` / `useQuery` |
| `Ext.MessageBox.show()` | `sonner` toast atau Radix UI `AlertDialog` |
| `Ext.MessageBox.confirm()` | Radix UI `AlertDialog` dengan confirm/cancel |
| `Ext.create('Ext.Window', ...)` | Radix UI `Dialog` |
| `Ext.decode(response)` | `response.json()` (built-in fetch) |

### 10.3 jQuery → React

| jQuery | React |
|---|---|
| `$('#id').val()` | `useRef` / `form.watch('field')` (React Hook Form) |
| `$('#id').on('change', fn)` | `onChange` prop atau `useEffect` watching state |
| `$('#id').show()/hide()` | Conditional rendering `{visible && <Component />}` |
| `$('#id').html('')` | State update → re-render |
| `$.ajax({ ... })` | `fetch` / `axios` via TanStack Query |
| `$(selector).DataTable()` | `@tanstack/react-table` |

### 10.4 MySQL → PostgreSQL

| MySQL | PostgreSQL |
|---|---|
| `ST_ASGEOJSON(polygon)` | `ST_AsGeoJSON(polygon)` (sama, pakai PostGIS) |
| `IFNULL(a, b)` | `COALESCE(a, b)` |
| `DATE(timestamp)` | `DATE(timestamp)` atau `timestamp::date` |
| `JSON_EXTRACT(...)` | `json_extract_path_text(...)` atau `->>`/`#>>` |
| `GROUP_CONCAT(...)` | `STRING_AGG(... , ',')` |
| `SUBSTRING_INDEX(...)` | `SPLIT_PART(...)` atau regex |
| Comment toggle `/* ... */` | Gunakan conditional Drizzle query builder |

### 10.5 Dependency List

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "maplibre-gl": "^4.x",
    "wouter": "^3.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "framer-motion": "^11.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-select": "^2.x",
    "lucide-react": "^0.400+",
    "recharts": "^2.x",
    "sonner": "^1.x",
    "tailwindcss": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "xlsx": "^0.18+",
    "class-variance-authority": "^0.7+"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^7.x",
    "@types/react": "^18.x"
  }
}
```

### 10.6 Folder Structure (Complete)

```
src/
├── pages/
│   └── TraceabilityMapPage.tsx
│
├── features/
│   └── traceability-map/
│       ├── components/
│       │   ├── FilterPanel.tsx
│       │   ├── EmissionFilterPanel.tsx     ← NEW
│       │   ├── MapView.tsx
│       │   ├── LegendPanel.tsx
│       │   ├── ActorDetailPanel.tsx
│       │   ├── EmissionPanel.tsx           ← NEW: per-actor emission tab
│       │   ├── EmissionChart.tsx           ← NEW: Recharts bar/donut
│       │   ├── EmissionDashboardPanel.tsx  ← NEW: bottom panel summary
│       │   ├── EmissionDetailGrid.tsx      ← NEW: paginated table
│       │   └── StyleSwitcher.tsx
│       ├── hooks/
│       │   ├── useTraceData.ts
│       │   ├── useEmissionData.ts          ← NEW
│       │   └── useMapLayers.ts
│       ├── lib/
│       │   ├── traceability-data.ts
│       │   ├── emission-data.ts            ← NEW: utility functions
│       │   ├── map-styles.ts
│       │   ├── constants.ts
│       │   └── filter-schema.ts
│       └── types/
│           ├── index.ts
│           └── emission.ts                 ← NEW
│
├── lib/
│   └── api-client.ts          (axios/fetch wrapper)
│
├── App.tsx
└── main.tsx

server/
├── routes/
│   ├── traceability.ts
│   └── emission.ts                         ← NEW
├── controllers/
│   ├── traceability.controller.ts
│   └── emission.controller.ts              ← NEW
├── services/
│   ├── traceability.service.ts
│   └── emission.service.ts                 ← NEW
├── db/
│   ├── index.ts                (Drizzle connection)
│   └── schema/
│       ├── rpt-maps-relation.ts
│       ├── dash-cft-crop.ts                ← NEW
│       ├── dash-cft-crop-ent.ts            ← NEW
│       ├── ref-commodity.ts
│       ├── ref-supplier.ts
│       ├── view-org.ts
│       └── farm-polygon.ts
├── middleware/
│   └── auth.ts                 (Passport.js)
└── index.ts                    (Express app)
```

---

## Quick Start Checklist

- [ ] Setup Vite 7 + React 18 + TypeScript project
- [ ] Install dependencies (lihat 10.5)
- [ ] Setup PostgreSQL + PostGIS extension
- [ ] Migrate schema dari MySQL → PostgreSQL (lihat section 3)
- [ ] Migrate tabel emisi: `dash_cft_crop`, `dash_cft_crop_ent`, `crop_product_dash3_ent`, `crop_product_dash4_ent`
- [ ] Setup Drizzle ORM dengan schema files (termasuk emission schemas)
- [ ] Setup Express 5 server + routes (traceability + emission)
- [ ] Implement `TraceabilityService` (port logika dari PHP model)
- [ ] Implement `EmissionService` (port logika dari `mcft_crop.php`)
- [ ] Implement `TraceabilityData` class (port dari `class_feature.js`)
- [ ] Build `FilterPanel` component (port dari `v_maps_traceability_v2.php`)
- [ ] Build `EmissionFilterPanel` component (port dari `cft_crop.php` view)
- [ ] Build `MapView` component dengan MapLibre GL
- [ ] Build `EmissionHeatmapLayer` (emission overlay pada peta)
- [ ] Build `LegendPanel` (port dari `components.js` + emission toggle)
- [ ] Build `ActorDetailPanel` (port dari `showPopup()` + emission tab)
- [ ] Build `EmissionPanel` + `EmissionChart` (Recharts bar + donut)
- [ ] Build `EmissionDetailGrid` (paginated emission table)
- [ ] Build `EmissionDashboardPanel` (bottom summary panel)
- [ ] Integrate WMS layers (GeoServer KLHK + Admin Boundary)
- [ ] Implement export Excel (transaksi + emission data)
- [ ] Setup Passport.js authentication
- [ ] Testing end-to-end (traceability + emission integration)

---

## 11. Integrasi CFT Crop Emission per Supply Chain

### 11.1 Konsep Integrasi

Fitur `dboard/cft_crop` (CoolFarmTool) pada sistem original adalah dashboard terpisah yang menampilkan data emisi karbon per crop type & country. Dalam implementasi baru, data ini diintegrasikan langsung ke dalam peta traceability sehingga user bisa melihat **emisi per chain actor** dan **overlay emisi** pada peta supply chain.

**Titik Integrasi (Bridging):**

```
┌─────────────────────┐       ┌──────────────────────┐
│  TRACEABILITY DATA   │       │  EMISSION DATA (CFT) │
│                     │       │                      │
│  rpt_maps_relation  │       │  dash_cft_crop       │
│  ├ farmer_id        │       │  ├ district_id    ←──┼── Shared key: district
│  ├ lat/long per lvl │       │  ├ country_id     ←──┼── Shared key: country
│  ├ supplychain_id   │───┐   │  ├ emission_source│
│  └ org_id per level │   │   │  └ co2e           │
│                     │   │   │                      │
│  view_org           │   │   │  dash_cft_crop_ent   │
│  ├ supplychain_id ──┼───┘   │  ├ entity_id ─────── │── Entity = SupplychainID
│  ├ district_name    │       │  ├ emission_source │
│  └ org_type         │       │  └ total_co2eq     │
└─────────────────────┘       └──────────────────────┘
```

**Link Strategy:**
1. **Per District**: Actors di traceability map memiliki `district_id` (dari `view_org`). Data `dash_cft_crop` juga memiliki `district_id`. Ini memungkinkan overlay emisi regional pada peta.
2. **Per Entity**: `entity_id` di `dash_cft_crop_ent` bisa di-map ke `supplychain_id` atau `org_id` di traceability data, memungkinkan emission detail per actor.
3. **Per Country + Crop**: Filter emission (country, crop_type, year) digunakan bersamaan dengan filter traceability untuk menampilkan data dalam konteks yang sama.

### 11.2 Emission Service (Backend)

```typescript
// services/emission.service.ts
import { db } from '../db';
import { dashCftCrop } from '../db/schema/dash-cft-crop';
import { dashCftCropEnt } from '../db/schema/dash-cft-crop-ent';
import { eq, and, sql, inArray } from 'drizzle-orm';

type CalculationType = 'AVERAGE PER FARMER' | 'AVERAGE PER HECTARE' | 'AVERAGE PER TON CROP' | 'SUM OF ALL FARMERS';

export class EmissionService {

  // ─── Combo Filters ──────────────────────
  async getComboYear(partnerId: number) {
    const result = await db
      .selectDistinct({ id: dashCftCrop.surveyYr, label: dashCftCrop.surveyYr })
      .from(dashCftCrop)
      .where(eq(dashCftCrop.partnerId, partnerId))
      .orderBy(sql`${dashCftCrop.surveyYr} DESC`);
    return result;
  }

  async getComboCalculation() {
    return [
      { id: 'AVERAGE PER FARMER', label: 'AVERAGE PER FARMER' },
      { id: 'AVERAGE PER HECTARE', label: 'AVERAGE PER HECTARE' },
      { id: 'AVERAGE PER TON CROP', label: 'AVERAGE PER TON CROP' },
      { id: 'SUM OF ALL FARMERS', label: 'SUM OF ALL FARMERS' },
    ];
  }

  async getComboCountry(partnerId: number, year: number) {
    return db
      .selectDistinct({ 
        id: dashCftCrop.countryId, 
        label: dashCftCrop.countryName 
      })
      .from(dashCftCrop)
      .where(and(
        eq(dashCftCrop.partnerId, partnerId),
        eq(dashCftCrop.surveyYr, year),
      ));
  }

  async getComboCrop(partnerId: number, year: number) {
    return db
      .selectDistinct({ 
        id: dashCftCrop.cropType, 
        label: dashCftCrop.cropType 
      })
      .from(dashCftCrop)
      .where(and(
        eq(dashCftCrop.partnerId, partnerId),
        eq(dashCftCrop.surveyYr, year),
      ));
  }

  // ─── Total Emission (Dashboard Summary) ─
  async getDisplayDash(params: {
    fyear: number;
    fcalculation: CalculationType;
    fcountry: string;
    fcrop: string;
    partnerId: number;
    groupAccess: string;
  }) {
    const { fyear, fcalculation, fcountry, fcrop, partnerId, groupAccess } = params;

    // Total emission (scalar)
    const totalQuery = this.buildTotalEmissionQuery(fcalculation, partnerId, groupAccess);
    const totalResult = await db.execute(sql.raw(totalQuery), [fcountry, fcrop, fyear]);
    const totalEmission = totalResult.rows[0]?.totalemission ?? 0;

    // Chart by source
    const chartQuery = this.buildChartEmissionQuery(fcalculation, partnerId, groupAccess);
    const chartResult = await db.execute(sql.raw(chartQuery), [fcountry, fcrop, fyear]);

    // Last updated
    const updatedResult = await db
      .select({ updated: sql`MAX(${dashCftCrop.generatedDate})` })
      .from(dashCftCrop);

    return {
      success: true,
      totalemission: parseFloat(totalEmission),
      chart_source: chartResult.rows,
      updated_on_cft_crops: updatedResult[0]?.updated ?? '',
    };
  }

  // ─── Entity Emission (per chain actor) ──
  async getEntityEmission(params: {
    entityId: number;
    fyear: number;
    fcalculation: string;
    fcountry: string;
    fcrop: string;
    calculationFilters: Record<string, string>;
  }) {
    const { entityId, fyear, fcalculation, fcountry, fcrop, calculationFilters } = params;

    // Build WHERE clause with calculation filter per source
    const calcWhere = this.buildCalculationFilterWhere(calculationFilters, fyear);

    // Chart source (bar chart)
    const chartSource = await db.execute(sql`
      SELECT 
        emission_source AS source,
        SUM(total_co2eq) AS value
      FROM dash_cft_crop_ent
      WHERE entity_id = ${entityId}
        AND type_of_calculation = ${fcalculation}
        AND country_name = ${fcountry}
        AND crop_type = ${fcrop}
        ${sql.raw(calcWhere)}
      GROUP BY emission_source
      ORDER BY (CASE 
        WHEN emission_source = 'Seed production' THEN 1
        WHEN emission_source = 'Residue management' THEN 2
        WHEN emission_source = 'Fertiliser production' THEN 3
        WHEN emission_source = 'Soil / fertiliser' THEN 4
        WHEN emission_source = 'Crop protection' THEN 5
        WHEN emission_source = 'Carbon stock changes' THEN 6
        WHEN emission_source = 'Energy use (field)' THEN 7
        WHEN emission_source = 'Energy use (processing)' THEN 8
        WHEN emission_source = 'Waste water' THEN 9
        WHEN emission_source = 'Off-farm transport' THEN 10
      END) ASC
    `);

    // Donut product breakdown (from crop_product_dash3_ent)
    const donatSource = await db.execute(sql`
      SELECT emission_source AS source, SUM(value) AS value
      FROM crop_product_dash3_ent
      WHERE entity_id = ${entityId}
        AND type_of_calculation = ${fcalculation}
        AND country_name = ${fcountry}
        AND crop_type = ${fcrop}
        ${sql.raw(calcWhere)}
      GROUP BY emission_source
      ORDER BY value DESC
    `);

    // Donut GHG breakdown (from crop_product_dash4_ent) 
    const donatGhg = await db.execute(sql`
      SELECT category, SUM(value) AS value
      FROM crop_product_dash4_ent
      WHERE entity_id = ${entityId}
        AND type_of_calculation = ${fcalculation}
        AND country_name = ${fcountry}
        AND crop_type = ${fcrop}
        ${sql.raw(calcWhere)}
      GROUP BY category
      ORDER BY value DESC
    `);

    return {
      success: true,
      chart_source: chartSource.rows,
      donat_source: donatSource.rows,
      donat_ghg: donatGhg.rows,
    };
  }

  // ─── Emission by District (map overlay) ─
  async getEmissionByDistrict(params: {
    fyear: number;
    fcalculation: CalculationType;
    fcountry: string;
    fcrop: string;
    partnerId: number;
    groupAccess: string;
  }) {
    const { fyear, fcalculation, fcountry, fcrop, partnerId, groupAccess } = params;

    // Get emission aggregated per district
    const divisor = this.getDivisorColumn(fcalculation);
    
    const result = await db.execute(sql`
      WITH detail AS (
        SELECT * FROM dash_cft_crop
        WHERE partner_id = ${partnerId}
          AND district_id IN (${sql.raw(groupAccess)})
          AND country_id = ${fcountry}
          AND crop_type = ${fcrop}
          AND survey_yr = ${fyear}
      )
      SELECT 
        district_id,
        province_id,
        country_id,
        ROUND(SUM(co2e), 2) AS total_emission,
        ROUND(SUM(co2e) / NULLIF(SUM(DISTINCT total_farmer), 0), 2) AS emission_per_farmer,
        ROUND(SUM(co2e) / NULLIF(SUM(DISTINCT total_crop_ha), 0), 2) AS emission_per_hectare,
        ROUND(SUM(co2e) / NULLIF(SUM(DISTINCT total_fg_ton), 0), 2) AS emission_per_ton_crop
      FROM detail
      GROUP BY district_id, province_id, country_id
    `);

    return {
      success: true,
      data: result.rows,
    };
  }

  // ─── Helper: Build dynamic total emission query ──
  private buildTotalEmissionQuery(
    calc: CalculationType, partnerId: number, groupAccess: string
  ): string {
    const divisor = {
      'AVERAGE PER FARMER': 'SUM(b.total)',
      'AVERAGE PER HECTARE': 'SUM(b.total)', 
      'AVERAGE PER TON CROP': 'SUM(b.total)',
      'SUM OF ALL FARMERS': '1',
    }[calc];

    const divisorColumn = {
      'AVERAGE PER FARMER': 'total_farmer',
      'AVERAGE PER HECTARE': 'total_crop_ha',
      'AVERAGE PER TON CROP': 'total_fg_ton',
      'SUM OF ALL FARMERS': null,
    }[calc];

    if (!divisorColumn) {
      return `
        SELECT ROUND(SUM(co2e), 2) AS totalemission
        FROM dash_cft_crop
        WHERE partner_id = ${partnerId}
          AND district_id IN (${groupAccess})
          AND country_id = $1 AND crop_type = $2 AND survey_yr = $3
      `;
    }

    return `
      WITH detail AS (
        SELECT * FROM dash_cft_crop
        WHERE partner_id = ${partnerId}
          AND district_id IN (${groupAccess})
          AND country_id = $1 AND crop_type = $2 AND survey_yr = $3
      ),
      total AS (
        SELECT emission_source, SUM(co2e) AS co2e FROM detail GROUP BY emission_source
      ),
      pembagi AS (
        SELECT SUM(${divisorColumn}) AS total
        FROM (SELECT DISTINCT province_id, district_id, ${divisorColumn} FROM detail) xx
      ),
      summ AS (
        SELECT a.emission_source,
          CASE WHEN SUM(b.total) = 0 THEN 0 
               ELSE ROUND(SUM(a.co2e)/SUM(b.total), 2) 
          END AS totalemission
        FROM total a LEFT JOIN pembagi b ON 1=1
        GROUP BY a.emission_source
      )
      SELECT SUM(totalemission) AS totalemission FROM summ
    `;
  }

  // Similar pattern for buildChartEmissionQuery, buildCalculationFilterWhere, etc.
  private buildChartEmissionQuery(calc: CalculationType, partnerId: number, groupAccess: string): string {
    // Same CTE pattern as buildTotalEmissionQuery but returns per-source breakdown
    // omitted for brevity — mirror the PHP GetQueryTotalEmissionChart() logic
    return '';
  }

  private buildCalculationFilterWhere(filters: Record<string, string>, year: number): string {
    if (!filters || Object.keys(filters).length === 0) return '';
    
    const conditions = [
      `(emission_source = 'Seed production' AND calculation = '${filters.Seed ?? 'ORIGINAL'}')`,
      `(emission_source = 'Residue management' AND calculation = '${filters.Residue ?? 'ORIGINAL'}')`,
      `(emission_source = 'Fertiliser production' AND calculation = '${filters.Fertiliser ?? 'ORIGINAL'}')`,
      `(emission_source = 'Soil / fertiliser' AND calculation = '${filters.Soil ?? 'ORIGINAL'}')`,
      `(emission_source = 'Crop protection' AND calculation = '${filters.Crop ?? 'ORIGINAL'}')`,
      `(emission_source = 'Carbon stock changes' AND calculation = '${filters.Carbon ?? 'ORIGINAL'}')`,
      `(emission_source = 'Energy use (field)' AND calculation = '${filters.EnergyUseField ?? 'ORIGINAL'}')`,
      `(emission_source = 'Energy use (processing)' AND calculation = '${filters.EnergyUseProc ?? 'ORIGINAL'}')`,
      `(emission_source = 'Waste water' AND calculation = '${filters.WasteWater ?? 'ORIGINAL'}')`,
      `(emission_source = 'Off-farm transport' AND calculation = '${filters.OffFarm ?? 'ORIGINAL'}')`,
    ];
    
    return `AND survey_yr = ${year} AND (${conditions.join(' OR ')})`;
  }

  private getDivisorColumn(calc: CalculationType): string | null {
    return {
      'AVERAGE PER FARMER': 'total_farmer',
      'AVERAGE PER HECTARE': 'total_crop_ha',
      'AVERAGE PER TON CROP': 'total_fg_ton',
      'SUM OF ALL FARMERS': null,
    }[calc];
  }
}
```

### 11.3 Emission Components (Frontend)

#### EmissionFilterPanel.tsx

```tsx
// features/traceability-map/components/EmissionFilterPanel.tsx
import { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useEmissionYears, useEmissionCalculations, 
  useEmissionCountries, useEmissionCrops 
} from '../hooks/useEmissionData';
import type { EmissionFilter, CalculationType } from '../types/emission';

interface EmissionFilterPanelProps {
  partnerId: number;
  onSearch: (filter: EmissionFilter) => void;
  isLoading: boolean;
}

export function EmissionFilterPanel({ partnerId, onSearch, isLoading }: EmissionFilterPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [fyear, setFyear] = useState<number>(0);
  const [fcalculation, setFcalculation] = useState<CalculationType>('AVERAGE PER FARMER');
  const [fcountry, setFcountry] = useState('');
  const [fcrop, setFcrop] = useState('');

  const { data: years = [] } = useEmissionYears(partnerId);
  const { data: calculations = [] } = useEmissionCalculations();
  const { data: countries = [] } = useEmissionCountries(partnerId, fyear);
  const { data: crops = [] } = useEmissionCrops(partnerId, fyear);

  // Auto-select first year when loaded
  useEffect(() => {
    if (years.length > 0 && !fyear) {
      setFyear(years[0].id);
    }
  }, [years]);

  // Reload country & crop when year changes
  useEffect(() => {
    setFcountry('');
    setFcrop('');
  }, [fyear]);

  const handleSearch = () => {
    onSearch({ fyear, fcalculation, fcountry, fcrop });
  };

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 bg-[#2bbe72] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#25a563] transition-colors"
      >
        <Leaf className="w-4 h-4" />
        <span className="text-sm font-semibold">Carbon Emission</span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl p-4 w-[360px]"
          >
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#2bbe72]" />
              Emission Filter (CoolFarmTool)
            </h3>

            <div className="space-y-2">
              {/* Year */}
              <div>
                <label className="text-xs font-medium text-gray-600">Year of Reporting</label>
                <select value={fyear} onChange={(e) => setFyear(Number(e.target.value))}
                  className="w-full h-8 text-xs rounded-lg border px-2">
                  {years.map((y: any) => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </div>

              {/* Calculation */}
              <div>
                <label className="text-xs font-medium text-gray-600">Calculation</label>
                <select value={fcalculation} onChange={(e) => setFcalculation(e.target.value as CalculationType)}
                  className="w-full h-8 text-xs rounded-lg border px-2">
                  {calculations.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="text-xs font-medium text-gray-600">Country</label>
                <select value={fcountry} onChange={(e) => setFcountry(e.target.value)}
                  className="w-full h-8 text-xs rounded-lg border px-2">
                  <option value="">Select Country</option>
                  {countries.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Crop */}
              <div>
                <label className="text-xs font-medium text-gray-600">Crop</label>
                <select value={fcrop} onChange={(e) => setFcrop(e.target.value)}
                  className="w-full h-8 text-xs rounded-lg border px-2">
                  <option value="">Select Crop</option>
                  {crops.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading || !fcountry || !fcrop}
                className="w-full h-8 bg-[#2bbe72] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load Emission Data'}
              </button>

              <p className="text-[10px] text-gray-400 italic">
                Please choose 1 type of calculation, 1 country and 1 crop before exploring emission data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### EmissionPanel.tsx (Tab di ActorDetailPanel)

```tsx
// features/traceability-map/components/EmissionPanel.tsx
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         PieChart, Pie, Cell, Legend } from 'recharts';
import { useEntityEmission } from '../hooks/useEmissionData';
import { EMISSION_COLORS, getEmissionUnitLabel, EMISSION_SOURCE_ORDER } from '../types/emission';
import type { EmissionFilter } from '../types/emission';

interface EmissionPanelProps {
  entityId: number | null;
  emissionFilter: EmissionFilter | null;
}

export function EmissionPanel({ entityId, emissionFilter }: EmissionPanelProps) {
  const { data: emission, isLoading, error } = useEntityEmission(entityId, emissionFilter);

  const unitLabel = useMemo(
    () => emissionFilter ? getEmissionUnitLabel(emissionFilter.fcalculation) : 'kgCO2eq',
    [emissionFilter]
  );

  if (!emissionFilter) {
    return (
      <div className="text-center py-8 text-gray-400 text-xs">
        <p>Load emission data terlebih dahulu dari Emission Filter panel</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400 text-xs">Loading emission...</div>;
  }

  if (!emission?.success || !emission.chart_source?.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-xs">
        Tidak ada data emisi untuk entity ini
      </div>
    );
  }

  // Bar chart data
  const barData = emission.chart_source
    .sort((a, b) => (EMISSION_SOURCE_ORDER[a.source] ?? 99) - (EMISSION_SOURCE_ORDER[b.source] ?? 99))
    .map(s => ({
      name: s.source,
      value: s.value,
      fill: s.value > 0 ? EMISSION_COLORS.positive : EMISSION_COLORS.negative,
    }));

  // Total emission
  const totalEmission = barData.reduce((sum, s) => sum + s.value, 0);

  // GHG donut data
  const ghgColors = ['#ff6384', '#36a2eb', '#ffce56'];

  return (
    <div className="space-y-4">
      {/* Total Emission Badge */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-3 text-center">
        <div className="text-2xl font-bold">{totalEmission.toLocaleString('en', { maximumFractionDigits: 2 })}</div>
        <div className="text-xs opacity-80">{unitLabel}</div>
      </div>

      {/* Bar Chart: Emission by Source */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Emission by Source</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)} ${unitLabel}`, 'Emission']}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut: GHG Breakdown */}
      {emission.donat_ghg && emission.donat_ghg.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">GHG Breakdown</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={emission.donat_ghg}
                dataKey="value"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={60}
                innerRadius={30}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {emission.donat_ghg.map((_: any, i: number) => (
                  <Cell key={i} fill={ghgColors[i % ghgColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)} ${unitLabel}`, '']}
                contentStyle={{ fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

#### EmissionDashboardPanel.tsx (Bottom summary overlay)

```tsx
// features/traceability-map/components/EmissionDashboardPanel.tsx
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { ChevronUp, ChevronDown, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMISSION_COLORS, getEmissionUnitLabel, EMISSION_SOURCE_ORDER } from '../types/emission';
import type { EmissionSummary, EmissionFilter } from '../types/emission';

interface EmissionDashboardPanelProps {
  summary: EmissionSummary | null;
  filter: EmissionFilter | null;
  expanded: boolean;
  onToggle: () => void;
}

export function EmissionDashboardPanel({ 
  summary, filter, expanded, onToggle 
}: EmissionDashboardPanelProps) {
  if (!summary || !filter) return null;

  const unitLabel = getEmissionUnitLabel(filter.fcalculation);

  const chartData = useMemo(() => {
    return summary.chart_source
      .sort((a, b) => (EMISSION_SOURCE_ORDER[a.emissionsource] ?? 99) - (EMISSION_SOURCE_ORDER[b.emissionsource] ?? 99))
      .map(s => ({
        name: s.emissionsource,
        value: s.totalemission,
        fill: s.totalemission > 0 ? EMISSION_COLORS.positive : EMISSION_COLORS.negative,
      }));
  }, [summary]);

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-[80%] max-w-[900px]">
      {/* Toggle bar */}
      <button
        onClick={onToggle}
        className="mx-auto flex items-center gap-2 bg-white border shadow-sm px-4 py-1.5 rounded-t-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <Leaf className="w-3.5 h-3.5 text-[#2bbe72]" />
        Total Emission: <strong>{summary.totalemission.toLocaleString('en', { maximumFractionDigits: 2 })}</strong> {unitLabel}
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-t-xl shadow-xl overflow-hidden"
          >
            <div className="p-4 flex gap-4">
              {/* Total Emission Card */}
              <div className="w-48 bg-[#2bbe72] text-white rounded-xl p-4 flex flex-col justify-center text-center"
                style={{ backgroundImage: "url('/img/general/cft_crops/Emission_BG.svg')", backgroundSize: 'cover' }}>
                <div className="text-3xl font-bold">
                  {summary.totalemission.toLocaleString('en', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1 opacity-90">Total Emission ({unitLabel})</div>
                <div className="text-[10px] mt-3 opacity-70">
                  Last updated: {summary.updated_on_cft_crops}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">
                  Total Emission by Source ({unitLabel})
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} ${unitLabel}`, 'Emission']}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
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
  );
}
```

### 11.4 Emission Overlay pada MapView

Untuk menampilkan data emisi secara visual di peta, ditambahkan **heatmap layer** berdasarkan data per district dan **color-coded markers** berdasarkan tingkat emisi actor.

```tsx
// Tambahan di dalam MapView.tsx

// ─── Render Emission Heatmap Layer ────────
const renderEmissionHeatmap = useCallback((
  map: maplibregl.Map, 
  districtEmissions: DistrictEmission[],
  actorPoints: MapPoint[]
) => {
  // Buat GeoJSON points dari actor yang memiliki emission data
  const emissionPoints: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: actorPoints
      .filter(p => p.data.isShow === '1')
      .map(p => {
        // Cari emission data district terdekat
        const districtData = districtEmissions.find(
          d => d.districtId === p.data.DistrictId
        );
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.latLng[1], p.latLng[0]], // [lng, lat]
          },
          properties: {
            emission: districtData?.totalEmission ?? 0,
            emissionPerFarmer: districtData?.emissionPerFarmer ?? 0,
          },
        };
      }),
  };

  if (map.getSource('emission-heat')) {
    (map.getSource('emission-heat') as maplibregl.GeoJSONSource).setData(emissionPoints);
  } else {
    map.addSource('emission-heat', { type: 'geojson', data: emissionPoints });

    map.addLayer({
      id: 'emission-heatmap',
      type: 'heatmap',
      source: 'emission-heat',
      paint: {
        // Intensity berdasarkan emission value
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'emission'],
          0, 0,
          1000, 0.5,
          10000, 1,
        ],
        'heatmap-intensity': 1,
        'heatmap-radius': 30,
        'heatmap-opacity': 0.6,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(43,190,114,0)',       // transparent green
          0.2, 'rgb(43,190,114)',         // green (low)
          0.4, 'rgb(245,230,83)',         // yellow
          0.6, 'rgb(245,166,35)',         // orange
          0.8, 'rgb(208,2,27)',           // red (high)
          1, 'rgb(139,0,0)',              // dark red (very high)
        ],
      },
    });
  }
}, []);
```

### 11.5 Update ActorDetailPanel — Emission Tab

Tambahkan tab "Emission" pada `ActorDetailPanel` yang sudah ada:

```tsx
// Di dalam ActorDetailPanel.tsx, modifikasi tabs:

const [activeTab, setActiveTab] = useState<'profile' | 'transaction' | 'emission'>('profile');

// Tambah tab button
{[
  { key: 'profile', label: 'Profile' },
  { key: 'transaction', label: 'Transaction' },
  { key: 'emission', label: 'Emission', icon: <Leaf className="w-3 h-3" /> },
].map((tab) => (/* ... tab button ... */))}

// Tambah tab content
{activeTab === 'emission' && (
  <EmissionPanel
    entityId={context?.data?.SupplierID ? parseInt(context.data.SupplierID) : null}
    emissionFilter={emissionFilter}
  />
)}
```

### 11.6 Update TraceabilityMapPage — Emission Integration

```tsx
// Tambahan di TraceabilityMapPage.tsx

import { EmissionFilterPanel } from '@/features/traceability-map/components/EmissionFilterPanel';
import { EmissionDashboardPanel } from '@/features/traceability-map/components/EmissionDashboardPanel';
import { useEmissionSummary, useEmissionByDistrict } from '@/features/traceability-map/hooks/useEmissionData';
import type { EmissionFilter } from '@/features/traceability-map/types/emission';

export default function TraceabilityMapPage() {
  // ... existing state ...

  // Emission state
  const [emissionFilter, setEmissionFilter] = useState<EmissionFilter | null>(null);
  const [emissionDashExpanded, setEmissionDashExpanded] = useState(false);

  // Emission hooks
  const { data: emissionSummary } = useEmissionSummary(emissionFilter);
  const { data: emissionByDistrict } = useEmissionByDistrict(emissionFilter);

  // Handle emission search
  const handleEmissionSearch = useCallback((filter: EmissionFilter) => {
    setEmissionFilter(filter);
    setEmissionDashExpanded(true);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MapView
        key={renderKey}
        traceData={traceData}
        onMarkerClick={handleMarkerClick}
        visibleLayers={visibleLayers}
        emissionByDistrict={emissionByDistrict?.data ?? []}  // ← emission overlay
      />

      <FilterPanel ... />

      <EmissionFilterPanel
        partnerId={partnerId}
        onSearch={handleEmissionSearch}
        isLoading={false}
      />

      <LegendPanel ... />

      <ActorDetailPanel
        ...
        emissionFilter={emissionFilter}  // ← pass to EmissionTab
      />

      <EmissionDashboardPanel
        summary={emissionSummary ?? null}
        filter={emissionFilter}
        expanded={emissionDashExpanded}
        onToggle={() => setEmissionDashExpanded(!emissionDashExpanded)}
      />
    </div>
  );
}
```

### 11.7 Data Flow Diagram — Traceability + Emission

```
                    ┌──────────────────────────────────────────────────────────────┐
                    │                    TraceabilityMapPage                       │
                    │                                                              │
                    │  ┌─────────────────┐       ┌──────────────────────┐          │
User filter ────────┼─>│ FilterPanel      │       │ EmissionFilterPanel  │<─────────│── User emission filter
                    │  │ (traceability)   │       │ (year/calc/country/  │          │
                    │  └────────┬─────────┘       │  crop)               │          │
                    │           │                  └──────────┬───────────┘          │
                    │           v                             v                     │
                    │  ┌────────────────┐          ┌────────────────────┐           │
                    │  │ useTraceData() │          │ useEmissionSummary │           │
                    │  └────────┬───────┘          │ useEmissionByDist  │           │
                    │           │                   │ useEntityEmission  │           │
                    │           │                   └────────┬───────────┘           │
                    │           v                            v                      │
                    │  ┌───────────────────────────────────────────┐                │
                    │  │         MapView (MapLibre GL)              │                │
                    │  │                                           │                │
                    │  │  ┌─────────┐ ┌─────────┐ ┌────────────┐  │                │
                    │  │  │ Markers │ │Polylines│ │Emission    │  │                │
                    │  │  │ (actors)│ │ (trans) │ │Heatmap     │  │                │
                    │  │  └────┬────┘ └─────────┘ └────────────┘  │                │
                    │  │       │                                    │                │
                    │  │       v (click)                            │                │
                    │  └───────┼───────────────────────────────────┘                │
                    │          │                                                     │
                    │          v                                                     │
                    │  ┌────────────────────────────────────┐                       │
                    │  │     ActorDetailPanel                │                       │
                    │  │  Tab: Profile | Transaction | Emission                    │
                    │  │                              │                             │
                    │  │                     ┌────────v──────┐                      │
                    │  │                     │ EmissionPanel │                      │
                    │  │                     │ - Bar Chart   │                      │
                    │  │                     │ - GHG Donut   │                      │
                    │  │                     │ - Detail Grid │                      │
                    │  │                     └───────────────┘                      │
                    │  └────────────────────────────────────┘                       │
                    │                                                               │
                    │  ┌────────────────────────────────────┐                       │
                    │  │  EmissionDashboardPanel (bottom)    │                       │
                    │  │  Total Emission + Bar Chart Summary │                       │
                    │  └────────────────────────────────────┘                       │
                    └──────────────────────────────────────────────────────────────┘
```

### 11.8 Mapping Tabel Original — Target Emission

| Tabel Original (MySQL) | Tabel Target (PostgreSQL) | Kolom Penting |
|---|---|---|
| `dash_cft_crop` | `dash_cft_crop` | `partner_id`, `district_id`, `country_id`, `crop_type`, `survey_yr`, `emission_source`, `co2`, `n2o`, `ch4`, `co2e`, `total_farmer`, `total_crop_ha`, `total_fg_ton` |
| `dash_cft_crop_ent` | `dash_cft_crop_ent` | `entity_id`, `type_of_calculation`, `emission_source`, `calculation` (ORIGINAL/SCENARIO), `total_co2eq` |
| `crop_product_dash3_ent` | `crop_product_dash3_ent` | `entity_id`, `emission_source`, `value`, `percentage` |
| `crop_product_dash4_ent` | `crop_product_dash4_ent` | `entity_id`, `category` (CO2/N2O/CH4), `value` |

### 11.9 API Bridging: Cara Menghubungkan Emission ke Chain Actor

**Skenario 1: Emission per District (Regional Overlay)**
```
1. Load traceability data → actor markers tampil di peta
2. Load emission by district → GET /api/emission/by-district
3. Untuk setiap actor di peta, lookup district_id dari view_org
4. Assign warna marker berdasarkan total_emission di district tsb
5. Tampilkan heatmap layer dari data emission per district
```

**Skenario 2: Emission per Entity (Click Detail)**
```
1. User klik marker actor (misal trader supplychain_id = 456)
2. Load actor detail → POST /api/traceability/details/456
3. Load entity emission → GET /api/emission/by-entity/456
4. Tampilkan di tab "Emission":
   - Bar chart: 10 emission sources breakdown
   - Donut: GHG gas composition (CO2/N2O/CH4)
   - Total CO2eq badge
```

**Skenario 3: Emission per Supply Chain Path**
```
1. Setelah traceability data loaded, ambil semua unique supply chain paths
2. Untuk setiap path (producer → trader → warehouse):
   - Aggregate emission dari semua entity di path tsb
   - Polyline color = berdasarkan accumulated emission
3. Legend menampilkan gradient emission scale
```

### 11.10 Additional Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.x",
    // ... (sudah termasuk di 10.5, pastikan recharts ada)
  }
}
```

### 11.11 Quick Reference: Original → Target API Mapping

| Original Endpoint | Target Endpoint | Method |
|---|---|---|
| `/dboard/cft_crop/combo_year` | `/api/emission/combo/year` | GET |
| `/dboard/cft_crop/combo_calculation` | `/api/emission/combo/calculation` | GET |
| `/dboard/cft_crop/combo_country` | `/api/emission/combo/country` | GET |
| `/dboard/cft_crop/combo_crop` | `/api/emission/combo/crop` | GET |
| `/dboard/cft_crop/display_dash` | `/api/emission/summary` | GET |
| `/dboard/cft_crop/display_dash_entity` | `/api/emission/by-entity/:entityId` | GET |
| `/dboard/cft_crop/detail_emission_grid` | `/api/emission/detail-grid` | GET |
| *(baru)* | `/api/emission/by-district` | GET |
