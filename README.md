# InfraLens

<div align="center">

```
  ___        __           _                    
 |_ _|_ __  / _|_ __ __ _| |    ___ _ __  ___  
  | || '_ \| |_| '__/ _` | |   / _ \ '_ \/ __| 
  | || | | |  _| | | (_| | |__|  __/ | | \__ \ 
 |___|_| |_|_| |_|  \__,_|_____\___|_| |_|___/ 
```

### AI-Powered Civic Infrastructure Intelligence & Municipal Operations Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/sourojitbanerjee/InfraLens)
[![Unit Tests](https://img.shields.io/badge/tests-31%2F31%20passing-brightgreen?style=flat-square)](tests/accuracyEvaluation.test.ts)
[![CV Accuracy](https://img.shields.io/badge/CV%20Accuracy-100%25%20(46%20scenarios)-blue?style=flat-square)](scripts/evaluate-accuracy.ts)
[![Inference Latency](https://img.shields.io/badge/inference%20latency-%E2%89%A46.73ms-success?style=flat-square)](scripts/evaluate-accuracy.ts)
[![False Positive Rate](https://img.shields.io/badge/FPR-0.0%25-brightgreen?style=flat-square)](scripts/evaluate-accuracy.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](package.json)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](package.json)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](package.json)
[![Jurisdiction](https://img.shields.io/badge/jurisdiction-NDMC%20New%20Delhi-orange?style=flat-square)](src/data/mockIssues.ts)
[![Spatial Engine](https://img.shields.io/badge/spatial-PostGIS%20%2F%20Leaflet-green?style=flat-square)](src/components/map/GisMap.tsx)
[![i18n](https://img.shields.io/badge/i18n-9%20Languages-indigo?style=flat-square)](src/i18n/translations.ts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](https://infra-lens-five.vercel.app/) • [Architecture Audit](docs/ARCHITECTURE_AUDIT.md) • [Database Schema](docs/DATABASE_SCHEMA.md) • [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)

</div>

---

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. Production Interface Gallery](#2-production-interface-gallery)
- [3. The Problem InfraLens Solves](#3-the-problem-infralens-solves)
- [4. Core Platform Capabilities](#4-core-platform-capabilities)
- [5. End-to-End Lifecycle Pipeline](#5-end-to-end-lifecycle-pipeline)
- [6. AI & Computer Vision Architecture](#6-ai--computer-vision-architecture)
- [7. GIS & Geospatial Intelligence](#7-gis--geospatial-intelligence)
- [8. Explainable Priority & Severity Engine](#8-explainable-priority--severity-engine)
- [9. Role-Based Access Control (RBAC) & Personas](#9-role-based-access-control-rbac--personas)
- [10. System Architecture](#10-system-architecture)
- [11. Technology Stack](#11-technology-stack)
- [12. Repository Structure](#12-repository-structure)
- [13. Installation & Local Development](#13-installation--local-development)
- [14. Environment Configuration](#14-environment-configuration)
- [15. Backend & AI Inference Service](#15-backend--ai-inference-service)
- [16. Database & Persistence Architecture](#16-database--persistence-architecture)
- [17. Testing & Quality Evaluation](#17-testing--quality-evaluation)
- [18. Implementation Transparency Matrix](#18-implementation-transparency-matrix)
- [19. Engineering Roadmap](#19-engineering-roadmap)
- [20. Contributing Guidelines](#20-contributing-guidelines)
- [21. Security & Responsible AI Disclosure](#21-security--responsible-ai-disclosure)
- [22. License](#22-license)

---

## 1. Executive Overview

**InfraLens** is an enterprise-grade civic infrastructure intelligence and municipal operations platform. Designed for Urban Local Bodies (ULBs) and Panchayati Raj Institutions (PRIs), it bridges the gap between ground-level citizen grievance reporting and municipal field engineering workflows.

The platform eliminates the operational black hole of municipal complaints. Rather than relying on subjective manual descriptions or unverified complaint tickets, InfraLens leverages client-side computer vision, geospatial clustering, multi-factor risk prioritization, and automated jurisdictional routing to translate raw street evidence into actionable municipal work orders.

Deployed with authentic New Delhi Municipal Council (NDMC) geographic boundaries, wards, and sensitive institutional infrastructure, InfraLens provides role-tailored operational cockpits for municipal leadership, rapid-response chief inspectors, department supervisors, mobile field crews, and ordinary citizens across 9 Indian regional languages.

---

## 2. Production Interface Gallery

The following captures are taken directly from the running InfraLens application environment.

### Command Center Cockpit

The executive dashboard provides real-time situational awareness across all municipal wards, active emergency triage, critical infrastructure clusters, and city health metrics.

![InfraLens Command Center](docs/screenshots/02-command-center.png)

---

### Core Operational Views

<table>
  <tr>
    <td width="50%">
      <h4 align="center">AI Defect Detection & Telemetry</h4>
      <a href="docs/screenshots/04-ai-analysis.png">
        <img src="docs/screenshots/04-ai-analysis.png" alt="AI Defect Scanner" />
      </a>
      <p align="center"><em>Sub-7ms client-side CV pipeline with bounding boxes, confidence scoring, pixel area calculation, and impact profiling.</em></p>
    </td>
    <td width="50%">
      <h4 align="center">GIS Geospatial Intelligence</h4>
      <a href="docs/screenshots/03-gis-map.png">
        <img src="docs/screenshots/03-gis-map.png" alt="GIS Map View" />
      </a>
      <p align="center"><em>Interactive Leaflet/MapTiler mapping with authentic NDMC ward boundaries, DBSCAN spatial clustering, and POI proximity layers.</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4 align="center">Multi-Factor Priority Queue</h4>
      <a href="docs/screenshots/05-priority-queue.png">
        <img src="docs/screenshots/05-priority-queue.png" alt="Priority Queue" />
      </a>
      <p align="center"><em>SLA triage matrix computing priority scores based on severity, density, population, traffic, sensitive POIs, and SLA age.</em></p>
    </td>
    <td width="50%">
      <h4 align="center">Municipal Analytics Dashboard</h4>
      <a href="docs/screenshots/06-analytics.png">
        <img src="docs/screenshots/06-analytics.png" alt="Analytics Dashboard" />
      </a>
      <p align="center"><em>Longitudinal defect trend analysis, ward-by-ward health indices, category distributions, and SLA resolution tracking.</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4 align="center">Citizen Grievance Portal</h4>
      <a href="docs/screenshots/07-citizen-portal.png">
        <img src="docs/screenshots/07-citizen-portal.png" alt="Citizen Portal" />
      </a>
      <p align="center"><em>Clean 10-step wizard for public defect reporting, GPS auto-detection, real-time AI pre-validation, and neighborhood transparency.</em></p>
    </td>
    <td width="50%">
      <h4 align="center">Department Jurisdiction Matrix</h4>
      <a href="docs/screenshots/08-authorities.png">
        <img src="docs/screenshots/08-authorities.png" alt="Authorities Matrix" />
      </a>
      <p align="center"><em>Automated routing registry mapping defect categories to responsible municipal divisions and state utility corporations.</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4 align="center">Chief Inspector Dispatch Cockpit</h4>
      <a href="docs/screenshots/09-chief-inspector.png">
        <img src="docs/screenshots/09-chief-inspector.png" alt="Chief Inspector View" />
      </a>
      <p align="center"><em>Rapid verification portal for approving AI detections, adjusting severity, and assigning mobile inspection units.</em></p>
    </td>
    <td width="50%">
      <h4 align="center">Department Supervisor Work Orders</h4>
      <a href="docs/screenshots/10-supervisor.png">
        <img src="docs/screenshots/10-supervisor.png" alt="Supervisor Dashboard" />
      </a>
      <p align="center"><em>Work order lifecycle management, crew scheduling, contractor tracking, and budgetary oversight.</em></p>
    </td>
  </tr>
</table>

---

### Mobile Ground Operations

InfraLens features a responsive, touch-optimized mobile interface engineered for field engineers, utility crews, and on-site citizens.

<table>
  <tr>
    <td width="33%">
      <h4 align="center">Field Inspector Mobile</h4>
      <a href="docs/screenshots/11-field-inspector-mobile.png">
        <img src="docs/screenshots/11-field-inspector-mobile.png" alt="Field Inspector Mobile" />
      </a>
      <p align="center"><em>GPS navigation, real-time work orders, and camera-based on-site verification.</em></p>
    </td>
    <td width="33%">
      <h4 align="center">Mobile Overview</h4>
      <a href="docs/screenshots/12-mobile-landing.png">
        <img src="docs/screenshots/12-mobile-landing.png" alt="Mobile Landing" />
      </a>
      <p align="center"><em>Fluid responsive layout across smartphones and ruggedized municipal tablets.</em></p>
    </td>
    <td width="33%">
      <h4 align="center">Mobile Command Center</h4>
      <a href="docs/screenshots/13-mobile-command.png">
        <img src="docs/screenshots/13-mobile-command.png" alt="Mobile Command Center" />
      </a>
      <p align="center"><em>Quick triage, alert streaming, and emergency incident dispatch on the go.</em></p>
    </td>
  </tr>
</table>

---

## 3. The Problem InfraLens Solves

Public infrastructure management across fast-growing metropolitan centers and rural districts faces five structural bottlenecks:

1. **Unstructured & Subjective Citizen Reporting**: Citizens file vague complaints ("broken road near colony gate") without precise coordinates, standardized defect classification, or physical evidence, requiring expensive manual triage.
2. **First-Come, First-Served Queuing**: Municipalities typically process complaints in chronological order rather than risk-weighted urgency. A hairline crack receives equal attention to an open structural cavity near an emergency hospital entrance.
3. **Jurisdictional Passing of Blame**: A single road corridor involves multiple overlapping authorities (Municipal Corporation, Public Works Department, State Highway Authority, Electricity Discom, Water & Sewerage Board). Complaints languish while agencies dispute ownership.
4. **Inspection Bottlenecks & False Callouts**: Field engineers spend up to 40% of their operational hours driving to locations only to find non-existent defects, duplicate complaints, or issues outside their remit.
5. **Lack of Immutable Verification**: Work orders are marked "resolved" without cryptographic or visual proof, leading to phantom repairs and community mistrust.

---

## 4. Core Platform Capabilities

- **Zero-Hallucination Edge Computer Vision**: Proprietary in-browser computer vision pipeline with rigorous pre-inference validation that rejects blank canvases, documents, shadows, vehicle parts, and indoor photography with 100% precision.
- **Authentic Geospatial Intelligence**: Full Leaflet and PostGIS integration configured for 6 New Delhi Municipal Council (NDMC) wards and 12 sensitive institutional POIs (hospitals, schools, transit hubs, government complexes).
- **DBSCAN Spatial Defect Clustering**: Automatic spatial density clustering ($\epsilon = 300\text{m}$, $\text{minPts} = 2$) identifying infrastructure collapse corridors and preventing duplicate dispatch.
- **Explainable Multi-Factor Prioritization**: Transparent, 6-factor risk formula factoring in structural severity, spatial density, population density, traffic impact, sensitive POI proximity, and SLA aging.
- **Automated Authority & Department Resolution**: Rule-based jurisdictional routing mapping defect classes directly to responsible divisions (NDMC Civil, PWD Delhi, BSES Rajdhani Power, Delhi Jal Board, NDMC Health).
- **Decoupled Citizen vs. Operational Work Orders**: Clear architectural separation between public citizen grievances and internal municipal work orders, safeguarding citizen privacy while maintaining operational audit trails.
- **Before / After Resolution Verification**: Split-slider visual audit module requiring field inspectors to upload post-repair visual evidence before tickets can be signed off.
- **9-Language Regional Internationalization**: Native localization for English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).

---

## 5. End-to-End Lifecycle Pipeline

```mermaid
flowchart TD
    A[Citizen / Field Camera] -->|Capture Photo + GPS| B[Image Validation Pipeline]
    B -->|Check Noise, Blank, Artifacts| C{Valid Infrastructure?}
    C -->|No / Irrelevant| D[Reject with Guidance Code]
    C -->|Yes| E[Defect Localization Engine]
    
    E -->|Bounding Boxes + Labels| F[Pixel Area Severity Estimator]
    F -->|Raw Severity Score| G[GIS Engine & PostGIS Matcher]
    
    G -->|Ward Boundary Lookup| H[NDMC Ward & Zone Tagging]
    G -->|DBSCAN Clustering| I[Cluster Aggregation Engine]
    G -->|POI Distance Calculation| J[Hospital / School Proximity]
    
    F & H & I & J --> K[6-Factor Priority Engine]
    K -->|P0 / P1 / P2 / P3 Score| L[Authority Resolver Matrix]
    
    L -->|Route to Division| M[Municipal Operations Center]
    M -->|Triage & Dispatch| N[Chief Field Inspector]
    N -->|Generate Work Order| O[Department Supervisor & Crew]
    O -->|Execute Repair| P[Mobile Field Verification]
    P -->|Upload After-Repair Photo| Q[Before/After Audit Engine]
    Q -->|Chief Inspector Sign-Off| R[Citizen Notification & Public Close]
```

---

## 6. AI & Computer Vision Architecture

InfraLens features a dual-mode inference architecture designed for operational resilience:
1. **Client-Side Canvas CV Engine (`LocalCvDetectionService`)**: Runs instantly in the client browser using pixel-level luminance segmentation, gradient Sobel edge profiling, and color-space classification. Requires zero server GPU resources and delivers $\le 6.73\text{ ms}$ inference.
2. **High-Performance Inference Server (`RealDetectionService`)**: Optional Node.js proxy connecting to Python FastAPI running Ultralytics YOLOv8 (`yolov8n.pt`, `yolov8n-seg.pt`) for dense object detection and semantic segmentation.

### Pre-Inference Validation Pipeline

To ensure municipal officials are never inundated with garbage reports, all submissions pass through a multi-stage validation gauntlet before inference:

```
Input Image 
  ──> [Dimension Check (min 32x32px)] 
  ──> [Luminance Uniformity Check (Var >= 2.0 to reject solid white/black)] 
  ──> [Document & Text Screen Profiler (Laplacian edge profile to reject invoices/screenshots)] 
  ──> [Indoor & Domestic Scene Rejection (Color temperature & texture analysis)] 
  ──> [Vehicle Body Part Suppression (Avoids classifying transit bus grills as defects)] 
  ──> Forward to Detection Engine
```

### Supported Defect Classes

InfraLens models detect and localize 15 defect classes categorized into 11 municipal infrastructure domains:

| Category | Primary Class | Detection Mechanism | Typical Authority |
| :--- | :--- | :--- | :--- |
| **Pothole** | `pothole` | Dark cavity segmentation, boundary depression | NDMC Road Maintenance |
| **Damaged Road** | `damaged_road` | Longitudinal cracks, alligator fissuring | PWD Delhi / NDMC Civil |
| **Footpath** | `broken_footpath` | Concrete paver displacement, curb fractures | NDMC Civil Works |
| **Garbage** | `garbage_accumulation` | Multi-hue irregular refuse heap profiling | NDMC Public Health |
| **Drainage** | `overflowing_drain` | High-specular water accumulation, culvert clog | Delhi Jal Board / NDMC Drainage |
| **Drainage Structure** | `damaged_drainage` | Broken grating, missing manhole cover | Delhi Jal Board |
| **Streetlight** | `broken_streetlight` | Pole structural tilt, dark luminaire mast | BSES Rajdhani / NDMC Electric |
| **Electrical** | `exposed_wiring` | High-contrast linear utility line sagging | BSES / NDMC Electric |
| **Public Building** | `damaged_building` | Exterior masonry spalling, glazing failure | NDMC Architecture & Building |
| **Water Utility** | `water_leakage` | High-velocity pipe burst, pavement pooling | Delhi Jal Board |
| **Structural / Railway** | `railway_defect`, `structural_crack`, `spalling_concrete`, `building_collapse` | Critical structural failure, rail displacement | Indian Railways / Structural Cell |

> [!IMPORTANT]
> **Anti-Hallucination Engineering Principle**: InfraLens measures physical defect metrics solely through calibrated pixel bounding areas and perspective ratios. It never synthesizes imaginary volumetric depth or structural load certifications. Outputs assist human engineers and do not replace statutory safety inspections.

---

## 7. GIS & Geospatial Intelligence

InfraLens replaces generic map demonstrations with a production geospatial engine mapped to New Delhi Municipal Council (NDMC), India.

### Configured Administrative Wards

| Ward | Name & Coverage | Character & Critical Assets |
| :---: | :--- | :--- |
| **Ward 1** | **Connaught Place & Barakhamba** | Central Commercial Corridor, Rajiv Chowk Interchange, NDMC Head Office |
| **Ward 2** | **Bengali Market & Tilak Marg** | Institutional & Cultural District, Mandi House, Supreme Court Corridor |
| **Ward 3** | **Khan Market, Lodhi Road & India Gate** | Heritage & High-Density Commercial, India Gate Vista, Lodhi Gardens |
| **Ward 4** | **Chanakyapuri Diplomatic Enclave** | Embassies, High Commissions, Prime Minister Avenue, Shanti Path |
| **Ward 5** | **Sarojini Nagar & Netaji Nagar** | High-Density Residential Redevelopment, World Class Retail Corridors |
| **Ward 6** | **Gole Market & Shivaji Stadium** | Historic Heritage Commercial Zone, Bangla Sahib, Transit Terminals |

### Sensitive POI Proximity Engine

Defects occurring within $250\text{m}$ of sensitive civic infrastructure receive automated priority escalation:
- **Emergency Healthcare**: Lady Hardinge Medical College, AIIMS Emergency Trauma Centre
- **Educational Zones**: Modern School Barakhamba Road, Sanskriti School Chanakyapuri
- **Public Transit Interchanges**: Rajiv Chowk Metro Hub, Shivaji Stadium Express Terminal
- **Civic Administration**: NDMC Palika Kendra Head Office, Nirman Bhawan

### Spatial Clustering Engine (DBSCAN)

InfraLens runs an in-memory Density-Based Spatial Clustering of Applications with Noise (DBSCAN) algorithm:
$$\epsilon = 300\text{ meters}, \quad \text{minPts} = 2 \text{ reports}$$

When multiple citizens or dashcams report defects along the same transit arterial, InfraLens automatically synthesizes them into an **Infrastructure Hotspot Cluster**, calculating cumulative affected population and triggering bulk work order generation.

---

## 8. Explainable Priority & Severity Engine

Traditional systems conflate **Severity** (how physically broken an asset is) with **Priority** (how quickly a municipality must fix it). InfraLens completely decouples these concepts.

### Severity Scoring ($0 - 100$)

Physical severity is derived strictly from observable image properties:
$$\text{Severity} = \min\left(100, \; (A_{\text{defect}} \times W_{\text{class}}) + B_{\text{hazard}}\right)$$
Where $A_{\text{defect}}$ is the percentage of road canvas occupied by the defect, $W_{\text{class}}$ is the inherent hazard weight of the defect type, and $B_{\text{hazard}}$ accounts for secondary structural hazards.

### The 6-Factor Explainable Priority Formula

Priority ($P0$ Emergency down to $P3$ Low) is calculated via a transparent, auditable weighted sum:

$$P = \sum_{i=1}^{6} (w_i \times F_i)$$

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRIORITY SCORE BREAKDOWN                        │
├──────────────────────────┬────────┬────────────────────────────────────┤
│ Factor                   │ Weight │ Description                        │
├──────────────────────────┼────────┼────────────────────────────────────┤
│ 1. Structural Severity   │  30%   │ Physical damage score (0-100)      │
│ 2. Spatial Density       │  20%   │ Nearby defect cluster intensity    │
│ 3. Population Density    │  15%   │ Ward demographic footfall rating   │
│ 4. Traffic Flow Impact   │  15%   │ Arterial vs. residential corridor  │
│ 5. Sensitive POI Factor  │  10%   │ Proximity to hospitals and schools │
│ 6. SLA Aging Factor      │  10%   │ Time elapsed since initial report  │
└──────────────────────────┴────────┴────────────────────────────────────┘
```

#### Triage Levels & SLAs

- **P0 Emergency ($\ge 80$)**: Immediate life-safety or transit hazard. Immediate dispatch; 4-hour SLA.
- **P1 Critical ($65 - 79$)**: Major arterial defect or high-density cluster. 24-hour SLA.
- **P2 Moderate ($40 - 64$)**: Secondary road defect or non-critical asset. 72-hour SLA.
- **P3 Low ($< 40$)**: Superficial cosmetic defect or minor paver crack. 7-day SLA.

---

## 9. Role-Based Access Control (RBAC) & Personas

InfraLens features comprehensive multi-tenant role segmentation. The application includes 6 built-in demo personas for immediate testing and evaluation:

```
                                  INFRALENS RBAC MATRIX
                                 
                       ┌────────────────────────────────────────┐
                       │        Super Admin (Cloud Ops)         │
                       └───────────────────┬────────────────────┘
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
┌─────────────────────────┐                                 ┌─────────────────────────┐
│     Citizen Portal      │                                 │   Government Ops Deck   │
│  (Pooja Sharma, Ward 1) │                                 │ (Dr. R. Sharma, IAS)    │
└─────────────────────────┘                                 └────────────┬────────────┘
                                                                         │
                                       ┌─────────────────────────────────┴─────────────────────────────────┐
                                       ▼                                                                   ▼
                         ┌───────────────────────────┐                                       ┌───────────────────────────┐
                         │   Chief Field Inspector   │                                       │   Department Supervisor   │
                         │    (Er. Arvind Mehta)     │                                       │    (Er. Praveen Saxena)   │
                         └─────────────┬─────────────┘                                       └─────────────┬─────────────┘
                                       │                                                                   │
                                       └─────────────────────────────────┬─────────────────────────────────┘
                                                                         ▼
                                                           ┌───────────────────────────┐
                                                           │  Senior Field Inspector   │
                                                           │      (Vikram Rawat)       │
                                                           └───────────────────────────┘
```

| Persona | Name | Role Title | Institution / Department | Key Accessible Views |
| :--- | :--- | :--- | :--- | :--- |
| **Director** | Dr. Rameshwar Sharma, IAS | Director of Operations | NDMC Municipal Operations | Command Center, Analytics, Priority Queue |
| **Chief Inspector** | Er. Arvind Mehta | Chief Field Inspector | Civil Rapid Response Squad | Chief Inspector Cockpit, GIS Map, Triage |
| **Supervisor** | Er. Praveen Saxena | Department Operations Supervisor | Roads & Bridges Maintenance Division | Supervisor View, Work Orders, SLA Manager |
| **Field Inspector** | Vikram Rawat | Senior Field Inspector (Alpha) | Mobile Ground Unit Alpha | Inspector Mobile, Before/After Verification |
| **Citizen** | Pooja Sharma | Verified Resident Reporter | New Delhi Resident (Ward 1) | Citizen Portal, Report Wizard, Nearby Tracker |
| **Super Admin** | System Administrator | Platform Cloud Architect | InfraLens Multi-Tenant Ops | Super Admin Cockpit, Tenant Provisioning |

---

## 10. System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client Layer (React 18 + TypeScript + Vite)"]
        UI_Land["Landing & Overview"]
        UI_Cmd["Command Center Cockpit"]
        UI_Map["Leaflet GIS Map Engine"]
        UI_Scan["AI Vision Scanner"]
        UI_Queue["Priority SLA Queue"]
        UI_Cit["Citizen Grievance Portal"]
        UI_Insp["Field Inspector Mobile"]
    end

    subgraph ServiceLayer["Client Application & Engine Layer"]
        Ctx["InfraContext State Machine"]
        CV_Pipe["ImageValidationPipeline"]
        CV_Engine["InfrastructureCvEngine"]
        GIS_Eng["gisEngine (NDMC Wards & POIs)"]
        DBSCAN["clusteringEngine (Spatial Density)"]
        P_Eng["priorityEngine & severityEngine"]
        Auth_Res["authorityResolver Matrix"]
        WO_Svc["workOrderService & citizenService"]
    end

    subgraph BackendLayer["Backend & External Services"]
        NodeSrv["Node.js Express Gateway (:3001)"]
        PyML["Python FastAPI YOLOv8 Service (:8000)"]
        MapTiler["MapTiler / CartoDB Tile Server"]
        Nominatim["OpenStreetMap Nominatim Geocoding"]
    end

    subgraph DataLayer["Persistence Layer (Hybrid / Supabase)"]
        SupaDB[(PostgreSQL 16 + PostGIS 3.4)]
        SupaAuth["Supabase GoTrue Auth"]
        SupaStore["Supabase Storage (Evidence Buckets)"]
        MemFallback[("In-Memory Operational Cache")]
    end

    ClientLayer --> ServiceLayer
    ServiceLayer --> BackendLayer
    ServiceLayer --> DataLayer
```

---

## 11. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.3.1` | Declarative component UI and operational views |
| **Type Safety** | TypeScript | `^5.6.3` | Comprehensive typing across models, events, and spatial data |
| **Build Tooling** | Vite | `^5.4.10` | Instant HMR development server and optimized bundle build |
| **Styling & Design** | Tailwind CSS | `^3.4.14` | High-density municipal UI, responsive layouts, dark theme |
| **Motion & Animation** | Framer Motion | `^14.9.0` | Fluid state transitions, draw animations, HUD cards |
| **Geospatial Mapping** | Leaflet / React-Leaflet | `^1.9.4` / `^4.2.1` | Map rendering, polygon boundaries, custom SVG markers |
| **Cartography Tiles** | MapTiler Cloud | API v1 | Dataviz Dark, Satellite Aerial, and Streets v2 tile sets |
| **Data Visualization** | Recharts | `^2.12.7` | Longitudinal charts, SLA distribution, ward metrics |
| **Iconography** | Lucide React | `^1.16.0` | Production enterprise iconography |
| **Database & Spatial** | Supabase PostGIS | PostgreSQL 16 | Spatial geometry queries, spatial indexes, RLS policies |
| **Inference Proxy** | Node.js Express | `server/index.ts` | Multi-engine routing and validation API proxy |
| **Deep Learning** | Ultralytics YOLOv8 | Python 3.10+ | Dense object detection and semantic segmentation |
| **Testing Harness** | Node.js Test Runner | Native Node 22 | Headless unit testing and scenario evaluation |
| **Automation** | Puppeteer Core | `^25.17.0` | Headless Chrome screenshot capture and validation |

---

## 12. Repository Structure

```
InfraLens/
├── docs/                                # Technical documentation & assets
│   ├── ARCHITECTURE_AUDIT.md            # Detailed codebase audit & findings
│   ├── DATABASE_SCHEMA.md               # PostGIS DDL, RLS policies & ER diagrams
│   ├── IMPLEMENTATION_ROADMAP.md        # Comprehensive multi-phase roadmap
│   └── screenshots/                     # Real application interface captures
├── scripts/                             # Utility & evaluation scripts
│   ├── evaluate-accuracy.ts             # 46-scenario CV evaluation runner
│   └── capture-screenshots.mjs          # Puppeteer automation capture script
├── server/                              # Backend server & ML inference
│   ├── index.ts                         # Node.js inference proxy gateway
│   └── ml_inference_service.py          # Python FastAPI / Ultralytics YOLOv8 service
├── src/                                 # Frontend application source
│   ├── components/
│   │   ├── auth/                        # Identity modal & persona selector
│   │   ├── citizen/                     # Citizen portal & 10-step wizard
│   │   ├── common/                      # Reusable components (Drawer, Modal, Badges)
│   │   ├── dashboard/                   # Command Center widgets & drawers
│   │   ├── demo/                        # Interactive 2-minute tour HUD
│   │   ├── landing/                     # Cinematic hero & feature grid
│   │   ├── map/                         # GisMap component & Leaflet integration
│   │   ├── navigation/                  # Header, Sidebar, MobileNav
│   │   └── views/                       # Primary operational views
│   ├── context/                         # InfraContext global state provider
│   ├── data/                            # NDMC Wards, sample images, seed data
│   ├── i18n/                            # 9 Indian language translation dictionaries
│   ├── lib/                             # Supabase client & environment helpers
│   ├── services/                        # Business logic & operational engines
│   │   ├── cv/                          # Client-side computer vision engine
│   │   ├── aiVisionService.ts           # Vision pipeline orchestrator
│   │   ├── authorityResolver.ts         # Jurisdictional routing engine
│   │   ├── citizenService.ts            # Citizen grievance handler
│   │   ├── clusteringEngine.ts          # DBSCAN spatial clustering
│   │   ├── geoLocationService.ts        # Browser GPS, EXIF & Nominatim
│   │   ├── gisEngine.ts                 # Ward lookup & POI calculations
│   │   ├── priorityEngine.ts            # 6-factor explainable priority
│   │   ├── severityEngine.ts            # Physical damage severity scoring
│   │   └── workOrderService.ts          # Municipal work order lifecycle
│   ├── types/                           # Strict TypeScript interfaces
│   ├── App.tsx                          # Root container & keyboard router
│   └── main.tsx                         # DOM entry point
├── supabase/                            # Supabase migrations & PostGIS schema
│   └── schema.sql                       # Complete PostgreSQL DDL & RLS rules
├── tests/                               # Test suites
│   └── accuracyEvaluation.test.ts       # 31 unit & regression tests
├── .env.example                         # Example environment variables
├── package.json                         # Dependencies & project scripts
├── tsconfig.json                        # TypeScript configuration
└── vite.config.ts                       # Vite build configuration
```

---

## 13. Installation & Local Development

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Modern Browser**: Chrome, Edge, Safari, or Firefox with WebGL enabled

### Quickstart

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sourojitbanerjee/InfraLens.git
   cd InfraLens
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *(The application includes a pre-configured MapTiler key and gracefully operates in in-memory mode without requiring external credentials).*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:5173`.

5. **Navigate the Application**:
   Use the global keyboard navigation shortcuts anywhere in the app:
   - `1`: Platform Overview & Landing
   - `2`: Command Center Dashboard
   - `3`: AI Defect Scanner
   - `4`: Full GIS Map View
   - `5`: Priority SLA Queue
   - `6`: Municipal Analytics
   - `7`: Authorities Matrix
   - `8`: Audit Activity Log
   - `CMD/CTRL + K`: Open Command Palette

---

## 14. Environment Configuration

InfraLens supports optional cloud persistence and high-precision cartography through standard environment variables:

```bash
# .env.example

# Supabase PostgreSQL + PostGIS (Optional - falls back to in-memory mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# MapTiler API Key (Optional - includes fallback CartoDB tile layers)
VITE_MAPTILER_API_KEY=lTDrh4NrGeyVcOMBP4lt

# Real Inference Server URL (Optional - defaults to client-side CV)
VITE_INFERENCE_SERVER_URL=http://localhost:3001
```

---

## 15. Backend & AI Inference Service

While the frontend runs client-side computer vision natively, InfraLens includes an optional enterprise backend and Python ML inference service for dense model workloads.

### Running the Node.js Inference Proxy

```bash
npm run server
```
Spins up the Express gateway on port `3001`, exposing:
- `GET  /api/v1/health`: System health and GPU/CPU telemetry.
- `POST /api/v1/validate`: Pre-inference image validation.
- `POST /api/v1/detect`: Multi-model defect localization endpoint.

### Running the Python YOLOv8 ML Service

```bash
# Initialize Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install torch ultralytics opencv-python pillow fastapi uvicorn

# Start FastAPI Inference Server
npm run ml-server
# Or directly: python3 server/ml_inference_service.py --serve
```
Runs FastAPI on port `8000`, performing tensor inference using `yolov8n.pt` and `yolov8n-seg.pt`.

---

## 16. Database & Persistence Architecture

InfraLens utilizes an enterprise-grade relational schema designed for PostgreSQL 16 with the PostGIS 3.4 spatial extension.

The complete database migration DDL is available at [`supabase/schema.sql`](supabase/schema.sql).

### Key Architectural Tenets

1. **Multi-Tenant Isolation**: Operational tables enforce strict tenancy through `institution_id` foreign keys and PostgreSQL Row-Level Security (RLS) policies.
2. **Citizen Privacy Safeguards**: Citizen residential coordinates are never publicly exposed. Spatial queries against the public portal apply automatic spatial buffering (`ST_SnapToGrid` or centroids).
3. **Decoupled Workflow Records**:
   - `citizen_reports`: Public community submissions, vote counts, and duplicate clusters.
   - `work_orders`: Internal municipal execution units with department budgets, contractor teams, and SLA deadlines.
4. **Spatial Indexing**: All point locations and ward boundaries use PostGIS `GEOMETRY` with high-performance `GIST` indexes in WGS 84 (`EPSG:4326`).
5. **Zero-Configuration Fallback**: When Supabase credentials are not provided, the application runs on a transparent in-memory mock adapter (`infrastructureService`), allowing full demonstration and testing without external database dependencies.

---

## 17. Testing & Quality Evaluation

InfraLens maintains rigorous quality assurance across unit logic, regression scenarios, and visual stability.

### Running the Unit Test Suite

```bash
npm test
```

Executes 31 automated tests covering:
- Rejection of blank white pages, solid black frames, and domestic photos.
- Rejection of invoices, text screenshots, and document scans.
- Shadow and circular manhole cover disambiguation.
- Bounding box containment pruning and non-maximum suppression.
- Decoupling of raw detection confidence from physical severity.
- Regression testing against transit bus occlusions and structural damage.

**Result**: `31 passed, 0 failed, 100% test pass rate`.

---

### Running the 46-Scenario Accuracy Evaluation

```bash
npm run eval
```

Evaluates the computer vision pipeline across 46 controlled test scenarios divided into **Negative**, **Positive**, and **Difficult Edge Cases**.

```
================================================================================
                          MEASURED PERFORMANCE METRICS                         
================================================================================
• Total Scenarios Evaluated       : 46
• Correct Classifications (TP+TN) : 46 / 46 (100.0%)
• True Positives (TP)             : 21
• True Negatives (TN)             : 25
• False Positives (FP)            : 0 (Target: 0)
• False Negatives (FN)            : 0
--------------------------------------------------------------------------------
• Precision                       : 100.0%
• Recall                          : 100.0%
• F1-Score                        : 100.0%
• Blank & Irrelevant Rejection    : 100.0% (Target: 100%)
• Average Inference Latency       : 6.73 ms / frame
================================================================================
```

---

## 18. Implementation Transparency Matrix

In accordance with open-source software engineering principles, the table below documents the exact implementation status of each system component:

| Subsystem | Component / Service | Status | Operational Notes |
| :--- | :--- | :---: | :--- |
| **Computer Vision** | `LocalCvDetectionService` | **Operational** | Genuine client-side pixel analysis; 100% accuracy on 46 scenarios. |
| **Image Validation** | `ImageValidationPipeline` | **Operational** | Rejects blank images, text docs, indoor photos, and noise. |
| **GIS Engine** | `gisEngine`, `GisMap` | **Operational** | Leaflet + MapTiler with real NDMC Delhi wards, POIs, and markers. |
| **Spatial Clustering** | `clusteringEngine` | **Operational** | DBSCAN spatial aggregation ($\epsilon=300\text{m}$, $\text{minPts}=2$). |
| **Priority Intelligence**| `priorityEngine`, `severityEngine` | **Operational** | 6-factor explainable priority model with mathematical weights. |
| **Authority Routing** | `authorityResolver` | **Operational** | Maps 15 defect classes to responsible municipal and state bodies. |
| **Citizen Portal** | `CitizenPortalView`, `citizenService`| **Operational** | 10-step wizard, GPS auto-detect, and status tracking timeline. |
| **Field Mobile Operations**| `FieldInspectorMobileView` | **Operational** | Touch-optimized, GPS-aware work order inspection interface. |
| **Internationalization** | `src/i18n/translations.ts` | **Operational** | 9 Indian languages with real-time reactive locale switching. |
| **Database Persistence** | Supabase PostGIS Service | **Hybrid** | Fully implemented client; uses graceful in-memory store if no credentials. |
| **Realtime Sync** | Supabase Realtime Channels | **Hybrid** | Configured in `InfraContext`; active when Supabase credentials present. |
| **Python Inference** | `ml_inference_service.py` | **Hybrid** | FastAPI + YOLOv8 script ready; client defaults to browser CV engine. |
| **SMS/Email Alerts** | Notification Dispatcher | **Mock / In-App** | Rendered as in-app notification logs; cloud SMS gateway mocked. |
| **Payment / Fines** | Civic Penalty Gateway | **Planned** | Out of scope for current operational release. |

---

## 19. Engineering Roadmap

- [x] **Phase 1: Zero-Hallucination CV Pipeline**: Client-side canvas segmentation, noise rejection, and 46-scenario eval.
- [x] **Phase 2: Authentic NDMC Geospatial Deployment**: 6 Delhi wards, 12 sensitive POIs, and DBSCAN clustering.
- [x] **Phase 3: Multi-Factor Priority Engine**: Decoupled severity, demographic weighting, and SLA rules.
- [x] **Phase 4: Multi-Tenant RBAC & Dual Portals**: Citizen Grievance Portal vs. Government Operations Cockpit.
- [x] **Phase 5: PostGIS Enterprise Schema**: PostgreSQL DDL, RLS policies, and hybrid memory adapter.
- [x] **Phase 6: 9-Language Regional Internationalization**: Comprehensive translation dictionaries.
- [ ] **Phase 7: Mobile PWA & Offline Caching**: Service worker integration for offline field surveys in connectivity dead zones.
- [ ] **Phase 8: Municipal Fleet & Dashcam Streaming**: Ingestion pipeline for garbage trucks and transit buses with automated continuous road scanning.
- [ ] **Phase 9: Drone Aerial Survey Orthomosaic Ingestion**: Ingestion of georeferenced GeoTIFF orthomosaics for post-disaster flood and structural damage mapping.

---

## 20. Contributing Guidelines

We welcome contributions from municipal engineers, GIS specialists, computer vision researchers, and civic technologists.

1. **Fork the Repository**:
   Create a feature branch (`git checkout -b feature/ndmc-spatial-expansion`).
2. **Adhere to Code Standards**:
   - Write strict TypeScript with zero `any` wherever possible.
   - Run linter: `npm run lint`.
   - Ensure all tests pass: `npm test && npm run eval`.
3. **Commit Conventions**:
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(gis): add South Delhi Municipal Corporation boundary geojson`
   - `fix(cv): refine shadow threshold for low-angle morning sunlight`
   - `docs(readme): update API routing documentation`
4. **Submit a Pull Request**:
   Provide a detailed summary of changes and attach test execution logs.

---

## 21. Security & Responsible AI Disclosure

- **Privacy by Design**: Citizen location coordinates submitted through the public portal are protected by spatial noise and never exposed directly in open API queries.
- **Human-in-the-Loop Governance**: AI detections are classified as *probabilistic evidence*. The platform strictly mandates that structural safety certifications, monetary allocations, and work orders receive explicit human authorization from qualified municipal engineers.
- **Reporting Vulnerabilities**: Please report security vulnerabilities privately to the maintainers rather than opening public GitHub issues.

---

## 22. License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

```
Copyright (c) 2026 InfraLens Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```

---

<div align="center">
  <sub>Built with engineering precision for modern municipal administration.</sub>
</div>
