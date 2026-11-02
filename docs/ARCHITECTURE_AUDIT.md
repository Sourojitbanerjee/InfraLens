# InfraLens Architecture Audit

**Date of Audit**: November 2026  
**Auditor**: Senior Full-Stack Software Architect, AI Engineer, GIS Engineer & Platform Architect  
**Platform**: InfraLens — AI-Powered Civic Infrastructure Intelligence & Municipal Operations Platform  

---

## Executive Summary

InfraLens has a functioning frontend prototype and computer-vision verification engine. It possesses a 46-scenario CV evaluation suite (100% pass on negative, positive, and difficult edge cases) and a Leaflet-based GIS visualization with MapTiler support. 

However, prior to this transformation, the platform operated primarily as a single-tenant front-of-house demonstration. It lacked:
1. True multi-tenant municipal & panchayat data isolation.
2. A dual-portal experience (Citizen Portal vs. Government Operations Portal vs. Super Admin Portal).
3. A formal Role-Based Access Control (RBAC) hierarchy.
4. Institutional onboarding and document-verification workflows for Urban Local Bodies (ULBs) and Rural Panchayati Raj Institutions (PRIs).
5. A persistent database schema (PostgreSQL + PostGIS) to back live work orders and citizen complaints.
6. A clean separation between citizen complaint reports and institutional work orders.
7. Multilingual support across Indian regional languages.

---

## Detailed Component Audit Matrix

| Area | Component / Service | Implementation Status | Technical Details |
| :--- | :--- | :--- | :--- |
| **1. Application Architecture** | `src/App.tsx`, `src/context/InfraContext.tsx` | **Partially Implemented** | React 18 + TypeScript + Vite. State was managed via a single monolithic `InfraContext` holding in-memory arrays. Needed role-based views, portal switching, and tenant scoping. |
| **2. Frontend Routing** | `src/types/navigation.ts`, View Switcher in `App.tsx` | **Partially Implemented** | State-based view switcher (`landing`, `dashboard`, `analyze`, `map`, `queue`, `analytics`, `authorities`, `activity`). Missing Citizen Portal routes (`citizen-home`, `citizen-report`, `citizen-nearby`, `citizen-track`), Institution Onboarding (`register-institution`, `verify-institution`), and Role-Specific Dashboards. |
| **3. AI Inference Pipeline** | `src/services/aiVisionService.ts`, `src/services/detectionService.ts`, `server/ml_inference_service.py` | **Already Implemented & Operational** | Dual-mode inference: in-browser Canvas-based edge computer vision and Python FastAPI/REST service (`server/ml_inference_service.py`) supporting Ultralytics YOLOv8n (`yolov8n.pt`, `yolov8n-seg.pt`). High accuracy and zero fabricated measurements. |
| **4. Image Processing & Validation** | `src/services/cv/*` (`imageValidationPipeline.ts`, `infrastructureCvEngine.ts`, `imageDecoder.ts`, `defectCropVerifier.ts`) | **Already Implemented & Operational** | 100% pass across 31 unit tests and 46 rigorous test scenarios. Robust rejection of white pages, dark noise, indoor artifacts, and vehicle parts. Pure pixel-area estimation without fabricated depth. |
| **5. GIS Functionality** | `src/components/map/GisMap.tsx`, `src/services/gisEngine.ts` | **Partially Implemented** | Leaflet + MapTiler API integrated with Dataviz Dark, Satellite Aerial, and Streets v2 with CartoDB fallback. Road segments and POI proximity working. Missing: dynamic GeoJSON jurisdiction boundary ingestion, citizen privacy radius masks (500m-10km), and PostGIS spatial queries. |
| **6. Authority Resolution** | `src/services/authorityResolver.ts` | **Mock / Partially Implemented** | Static switch statement mapping categories to San Francisco mock authorities (`auth-roads`, `auth-drainage`). Missing: real hierarchical jurisdiction resolution (State -> District -> ULB/Panchayat -> Ward/Village -> Department), handling of state highway/discom agencies, and `AUTHORITY_REVIEW_REQUIRED` state. |
| **7. Severity & Priority Calculation** | `src/services/severityEngine.ts`, `src/services/priorityEngine.ts`, `src/services/impactEngine.ts` | **Already Implemented & Sound** | Multi-factor explainable priority score ($30\%$ Severity, $20\%$ Density, $15\%$ Population, $15\%$ Traffic, $10\%$ Sensitive POI, $10\%$ Time Unresolved). Decoupled from raw confidence. |
| **8. Data Persistence** | `src/data/*` (`mockIssues.ts`, `mockAuthorities.ts`, `mockAnalytics.ts`) | **Mock Implementation** | Hardcoded mock data arrays in memory. Edits, assignments, and status updates did not persist across browser reloads or provide multi-institution isolation. |
| **9. Backend Endpoints** | `server/index.ts` | **Partially Implemented** | Node.js HTTP server on port 3001 provided `/api/v1/health`, `/api/v1/categories`, `/api/v1/validate`, and `/api/v1/detect`. Missing REST API endpoints for Auth, Institutions, Citizen Reports, Work Orders, and PostGIS queries. |
| **10. Environment Configuration** | `.env`, `.env.example`, `vite.config.ts` | **Partially Implemented** | Configured `VITE_MAPTILER_API_KEY`. Missing PostgreSQL, Supabase/Auth, Storage, and Notification provider variables. |

---

## Detailed Gap Analysis

### 1. User Roles & Access Management (RBAC)
- **Current State**: Single operator identity (`Cmdr. S. Vance`) shown in header dropdown as a cosmetic role selector.
- **Required State**: True RBAC with 7 distinct roles:
  1. `CITIZEN` (Public portal user, mobile OTP/email auth, privacy radius)
  2. `INFRALENS_SUPER_ADMIN` (Platform administrator, institutional approval, subscription management)
  3. `MUNICIPAL_ADMIN` / `PANCHAYAT_ADMIN` (Institution admin, department and ward configuration)
  4. `DIRECTOR_OF_OPERATIONS` (Command center executive, SLA compliance, city health monitoring)
  5. `CHIEF_FIELD_INSPECTOR` (Inspection team manager, assignment dispatch, evidence review)
  6. `DEPARTMENT_SUPERVISOR` (Departmental work order creation, field crew monitoring)
  7. `FIELD_INSPECTOR` (Mobile-first verification, GPS navigation, before/after evidence capture)

### 2. Institutional Registration & Verification Engine
- **Current State**: Hardcoded mock authorities representing a single city setup.
- **Required State**: Configurable onboarding supporting:
  - **Urban Local Bodies (ULBs)**: Municipal Corporations, Municipal Councils, Municipal Boards.
  - **Rural Local Bodies (PRIs)**: Gram Panchayats, Panchayat Samitis, Zilla Parishads.
  - Verification lifecycle: `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `DOCUMENT_REVIEW` $\rightarrow$ `ADDITIONAL_INFO_REQUIRED` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` (with `REJECTED`, `SUSPENDED`, `EXPIRED`).
  - Document upload checklist (Establishment order, address proof, authorization letter).

### 3. Institution Size Classification Engine
- **Current State**: Non-existent.
- **Required State**: Configurable operational classification engine evaluating ward count, population, departments, and inspector count:
  - `SMALL`: $\le 10$ wards, localized coverage, small team.
  - `MEDIUM`: $11-30$ wards, multiple departments and inspection teams.
  - `LARGE`: $> 30$ wards, high report volume, complex structure.
  - Fully decoupled from commercial subscription tiers (`SMALL`, `MEDIUM`, `ENTERPRISE`).

### 4. Citizen Experience & Public Transparency
- **Current State**: No citizen-facing portal; all views assumed an authenticated municipal operator.
- **Required State**: Dedicated clean citizen portal:
  - 10-step report submission wizard with AI feedback.
  - Nearby issues list and interactive map with configurable radius ($500\text{m}$, $1\text{km}$, $3\text{km}$, $5\text{km}$, $10\text{km}$).
  - "Confirm / Support Existing Issue" to prevent redundant tickets.
  - Citizen report tracking with status timeline.
  - Privacy guarantee: Citizen home coordinates and contact info are NEVER publicly exposed.

### 5. Work Order Management vs. Citizen Complaints
- **Current State**: Issue entity blended citizen report with work order fields.
- **Required State**: Explicit entity decoupling:
  - `CitizenReport` (public submission, photo evidence, AI analysis, citizen confirmation count).
  - `WorkOrder` (institutional execution unit, budget, assigned crew, SLA deadline, before/after photos, sign-off).

### 6. Internationalization (i18n)
- **Current State**: Hardcoded English strings.
- **Required State**: Full localization dictionary supporting English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).
