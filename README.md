# InfraLens — Urban Infrastructure Intelligence Platform

> **"See the city. Understand the damage. Fix what matters."**
> 
> *A premium AI-powered urban infrastructure intelligence platform combining computer vision, geospatial intelligence, and impact analysis to transform street-level problems into prioritized civic actions.*

---

## 🏛️ Platform Overview

**InfraLens** is designed to bridge the gap between street-level computer vision defect detection and metropolitan public works operations. Rather than acting as a generic image classification demo, InfraLens functions as a **City Command Center & Geospatial Tactical OS** that tells cities **what needs to be fixed first, why it matters, and who should fix it**.

### Visual & Tactical Philosophy
- **Aesthetic:** Futuristic + Civic + Intelligent + Premium + Restrained
- **DNA:** Bloomberg Terminal × Modern Google Maps × Palantir Operations Dashboard × Apple Interaction Polish
- **Semantic Severity Classification:**
  - 🟢 **Healthy** (`#10B981`, 0–30) — Repaired & Nominal
  - 🟡 **Moderate** (`#F59E0B`, 31–60) — Low-velocity degradation
  - 🟠 **High** (`#F97316`, 61–80) — Accelerated wear / high commuter exposure
  - 🔴 **Critical** (`#EF4444`, 81–100) — Immediate life-safety & structural hazard

---

## ⚡ The Core Pipeline

$$\text{IMAGE} \longrightarrow \text{COMPUTER VISION} \longrightarrow \text{DETECTION} \longrightarrow \text{SEVERITY} \longrightarrow \text{GPS} \longrightarrow \text{GIS} \longrightarrow \text{CLUSTERING} \longrightarrow \text{IMPACT ANALYSIS} \longrightarrow \text{PRIORITY} \longrightarrow \text{AUTHORITY} \longrightarrow \text{ACTION}$$

Every stage is modularized with clean service boundaries:
1. **AI Vision & Detection Service (`DetectionService`):** Pluggable architecture separating `MockDetectionService` from `RealDetectionService` (YOLO / ONNX / TensorRT ready).
2. **Severity Engine (`SeverityEngine`):** Computes $f(\text{damage extent}, \text{confidence}, \text{road coverage}, \text{issue type})$ returning score $0\text{--}100$.
3. **GIS & Clustering Engine (`GisEngine`):** PostGIS-ready spatial math with Haversine distance, radius querying, and DBSCAN density clustering ($\epsilon = 400\text{m}$, $\text{minReports} = 3$).
4. **Impact Engine (`ImpactEngine`):** Cross-references nearby schools, hospitals, transit hubs, and commuter counts.
5. **Priority & Explainability Engine (`PriorityEngine`):** Transparent civic weighting model with human-readable rationale:
   - Severity: **30%**
   - Complaint Density: **20%**
   - Population Impact: **15%**
   - Traffic Importance: **15%**
   - Sensitive Locations (Schools, Hospitals): **10%**
   - Time Unresolved: **10%**
6. **Authority Resolver (`AuthorityResolver`):** Geocodes and routes issues to responsible municipal departments.

---

## 🚀 Key Modules & Capabilities

### 1. City Command Center Dashboard
- **Municipal Operations Metrics:** Real-time animated counters for:
  - **ACTIVE ISSUES**
  - **CRITICAL INCIDENTS**
  - **ACTIVE CLUSTERS**
  - **AFFECTED POPULATION**
  - **AVG RESOLUTION TIME**
  - **CITY HEALTH INDEX**
- **Centerpiece Health Map:** Dark CartoDB basemap with arterial road segment health polylines (healthy, moderate, high-risk, critical) and animated cluster beacons.
- **Before / After Resolution Spotlight:** Side-by-side split comparison demonstrating severity drop ($87 \rightarrow 12$) in $4.2$ days.
- **Meaningful Empty States:** *"No critical infrastructure issues. That's good news."*

### 2. Infrastructure Health Map with 5-Tier Drilldown
- Visual hierarchy: **City $\longrightarrow$ Ward $\longrightarrow$ Road $\longrightarrow$ Cluster $\longrightarrow$ Issue**.
- **Cluster Intelligence Panel (`CL-027`):**
  - 37 reports across 400m radius
  - **Why this matters:** High damage severity, high report density, school nearby, major traffic corridor
  - **Impact:** ~2,000 daily users (School 180m, Bus Stop 90m, Market 310m)
  - **Recommended Action:** URGENT ROAD REPAIR
  - **Responsible Authority:** Municipal Roads Department with one-click `[ASSIGN]` and `[VIEW LOCATION]`.
- Arterial road polylines reflecting live road quality across Market Street, Mission Corridor, Van Ness, 3rd Street, Geary Blvd, and Embarcadero.

### 3. 8-Stage AI Analysis Experience
A realistic, progressive inspection sequence:
$$\text{UPLOAD} \longrightarrow \text{IMAGE PROCESSING} \longrightarrow \text{AI SCANNING} \longrightarrow \text{OBJECT DETECTION} \longrightarrow \text{SEVERITY ANALYSIS} \longrightarrow \text{GEOLOCATION} \longrightarrow \text{IMPACT ANALYSIS} \longrightarrow \text{PRIORITY GENERATED}$$
- Bounding box rendering with confidence scores and dimensions.
- Expandable diagnostics and one-click incident creation.

### 4. Interactive Before / After Comparison Slider
- Interactive drag handle comparing pre-repair critical defects with post-repair nominal surfaces.
- Quantified civic metrics: Severity Score Drop ($87 \rightarrow 12$), Resolution Duration ($4.2$ days), Daily Commuters Protected ($14,200$).

### 5. Smart Search & Command Palette (`⌘K`)
- Intent-based natural query parsing:
  - `"potholes near schools"` $\rightarrow$ category: pothole, filters schools
  - `"critical incidents"` $\rightarrow$ severity: critical, priority: P0/P1
  - `"ward 17"` / `"ward 6"` $\rightarrow$ targets specific ward
  - `"broken streetlights"` $\rightarrow$ category: broken streetlight
  - `"CL-027"` $\rightarrow$ directly opens Cluster CL-027 Intelligence Panel

### 6. Tactical Priority Queue & FilterBar
- Comprehensive filter controls: Category, Severity, Priority, Ward, Authority, Status, Date.
- Active filters rendered as removable chips with individual remove buttons and a one-click reset.
- Explainability column with expandable reason list for every work order.
- CSV report generation for municipal coordination.

### 7. Interactive Judge Demo Tour HUD
- 13-step guided interactive walkthrough designed for competitions and live presentations.
- Auto-navigates across all views with keyboard shortcuts (`←`, `→`, `ESC`).

### 8. Mobile Bottom Navigation
- Responsive mobile dock enabling quick switching between **Capture**, **AI Scan**, **Map**, **Queue**, and **Demo Tour**.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘ + K` / `Ctrl + K` | Open Tactical Command Palette & Smart Search |
| `1` | Landing Portal Overview |
| `2` | City Command Center |
| `3` | AI Street Analysis |
| `4` | Fullscreen GIS Health Map |
| `5` | Tactical Priority Work Queue |
| `6` | Infrastructure Analytics |
| `7` | Municipal Authorities Matrix |
| `8` | Activity & Incident Timeline |
| `ESC` | Close Drawer / Modal / Palette / Tour |

---

## 🛠️ Technology Stack

- **Framework:** React 18, TypeScript 5
- **Build Tool:** Vite 5 with Rollup chunk splitting
- **Styling:** Tailwind CSS, JetBrains Mono & Inter typography
- **GIS Mapping:** Leaflet & React-Leaflet with CartoDB Dark Matter tiles
- **Data Visualizations:** Recharts
- **Icons:** Lucide React
- **Architecture:** Decoupled service layer ready for Supabase / PostGIS integration

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Production Build & Typecheck
```bash
npm run build
```

### 4. Run Linter
```bash
npm run lint
```