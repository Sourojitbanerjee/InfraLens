-- ============================================================
-- InfraLens Database Schema
-- PostgreSQL + PostGIS via Supabase
-- Run this in your Supabase SQL Editor to initialize the schema.
-- ============================================================

-- Enable PostGIS extension for geospatial support
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'CITIZEN'
                  CHECK (role IN ('CITIZEN','FIELD_INSPECTOR','DEPARTMENT_SUPERVISOR',
                                  'MUNICIPAL_OFFICER','PANCHAYAT_OFFICER',
                                  'DISTRICT_ADMINISTRATOR','DIRECTOR_OF_OPERATIONS',
                                  'CHIEF_FIELD_INSPECTOR','MUNICIPAL_ADMIN',
                                  'INFRALENS_SUPER_ADMIN')),
  department_id   TEXT,
  jurisdiction_code TEXT,
  state           TEXT DEFAULT 'Delhi',
  district        TEXT DEFAULT 'New Delhi',
  city_or_village TEXT DEFAULT 'New Delhi',
  locality        TEXT,
  pincode         TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_reports   INTEGER DEFAULT 0,
  total_resolved  INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES public.user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INFRASTRUCTURE INCIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_code      TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
  category_label  TEXT,
  detection_type  TEXT,
  severity        TEXT NOT NULL CHECK (severity IN ('healthy','moderate','high','critical')),
  severity_score  INTEGER NOT NULL DEFAULT 0 CHECK (severity_score BETWEEN 0 AND 100),
  priority        TEXT NOT NULL CHECK (priority IN ('P0','P1','P2','P3','P4')),
  confidence      INTEGER DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  status          TEXT NOT NULL DEFAULT 'DETECTED'
                  CHECK (status IN (
                    'DETECTED','SUBMITTED','UNDER_VERIFICATION','VERIFIED',
                    'FORWARDED_TO_AUTHORITY','ACKNOWLEDGED','ASSIGNED_TO_FIELD_TEAM',
                    'INSPECTION_IN_PROGRESS','REPAIR_IN_PROGRESS','RESOLVED',
                    'CLOSED','REJECTED','DUPLICATE','REOPENED'
                  )),
  
  -- Geography
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  geom            GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
                    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                  ) STORED,
  address         TEXT,
  ward            TEXT,
  zone            TEXT,
  city            TEXT DEFAULT 'New Delhi',
  district        TEXT DEFAULT 'New Delhi',
  state           TEXT DEFAULT 'Delhi',
  pincode         TEXT,
  road_name       TEXT,
  accuracy_meters DOUBLE PRECISION,
  gps_source      TEXT DEFAULT 'CITIZEN_MOBILE',
  location_verification_status TEXT DEFAULT 'UNVERIFIED_PROVISIONAL',

  -- Media
  image_url       TEXT,
  supporting_images TEXT[] DEFAULT '{}',

  -- Reporter
  reporter_id     UUID REFERENCES public.user_profiles(id),
  reporter_name   TEXT,
  is_anonymous    BOOLEAN DEFAULT FALSE,
  landmark_notes  TEXT,

  -- Authority routing
  authority_id    TEXT,
  authority_name  TEXT,
  department_name TEXT,
  jurisdiction_code TEXT,
  local_body_type TEXT,
  local_body_name TEXT,
  
  -- Assignment
  assigned_officer TEXT,
  work_order_id   TEXT,
  resolution_deadline TIMESTAMPTZ,

  -- AI metadata
  record_type     TEXT DEFAULT 'CITIZEN_REPORT',
  verification_status TEXT DEFAULT 'UNVERIFIED_PROVISIONAL',
  ai_model_name   TEXT,

  -- Community
  community_confirmations_count INTEGER DEFAULT 0,
  is_duplicate    BOOLEAN DEFAULT FALSE,
  duplicate_of    UUID REFERENCES public.incidents(id),

  -- Scoring
  hazard_score    INTEGER DEFAULT 0,
  affected_users_per_day INTEGER DEFAULT 0,
  sla_deadline_hours INTEGER DEFAULT 48,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS incidents_geom_idx ON public.incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON public.incidents (status);
CREATE INDEX IF NOT EXISTS incidents_category_idx ON public.incidents (category);
CREATE INDEX IF NOT EXISTS incidents_ward_idx ON public.incidents (ward);
CREATE INDEX IF NOT EXISTS incidents_reporter_idx ON public.incidents (reporter_id);
CREATE INDEX IF NOT EXISTS incidents_created_idx ON public.incidents (created_at DESC);

-- ============================================================
-- DETECTIONS (AI output per incident)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.detections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  detection_class TEXT NOT NULL,
  type_label      TEXT,
  confidence      INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  severity        TEXT NOT NULL,
  severity_score  INTEGER NOT NULL,
  bbox_x          DOUBLE PRECISION,
  bbox_y          DOUBLE PRECISION,
  bbox_width      DOUBLE PRECISION,
  bbox_height     DOUBLE PRECISION,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS detections_incident_idx ON public.detections (incident_id);

-- ============================================================
-- INCIDENT LIFECYCLE (status history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incident_lifecycle (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  from_status           TEXT,
  to_status             TEXT NOT NULL,
  actor_id              UUID REFERENCES public.user_profiles(id),
  actor_name            TEXT,
  actor_role            TEXT,
  notes                 TEXT,
  supporting_image_url  TEXT,
  duration_hours        DOUBLE PRECISION,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifecycle_incident_idx ON public.incident_lifecycle (incident_id);
CREATE INDEX IF NOT EXISTS lifecycle_created_idx ON public.incident_lifecycle (created_at DESC);

-- ============================================================
-- WORK ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  assigned_to_id  UUID REFERENCES public.user_profiles(id),
  assigned_to_name TEXT,
  department      TEXT,
  status          TEXT NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED','OVERDUE')),
  deadline        TIMESTAMPTZ,
  priority        TEXT,
  notes           TEXT,
  resolution_image_url TEXT,
  created_by      UUID REFERENCES public.user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS work_orders_incident_idx ON public.work_orders (incident_id);
CREATE INDEX IF NOT EXISTS work_orders_assigned_idx ON public.work_orders (assigned_to_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  incident_id     UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('critical','info','success','warning')),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications (created_at DESC);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  incident_code   TEXT,
  action          TEXT NOT NULL,
  actor_id        UUID REFERENCES public.user_profiles(id),
  actor_name      TEXT,
  actor_role      TEXT,
  details         TEXT,
  metadata        JSONB,
  severity        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_incident_idx ON public.audit_log (incident_id);
CREATE INDEX IF NOT EXISTS audit_created_idx ON public.audit_log (created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ---- USER PROFILES ----
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('INFRALENS_SUPER_ADMIN','MUNICIPAL_ADMIN','DIRECTOR_OF_OPERATIONS','DISTRICT_ADMINISTRATOR')
    )
  );

-- ---- INCIDENTS ----
-- Citizens: read all (public data), write own
CREATE POLICY "Anyone can read incidents" ON public.incidents
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create incidents" ON public.incidents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Reporters can update own incidents (status)" ON public.incidents
  FOR UPDATE USING (reporter_id = auth.uid());

CREATE POLICY "Officials can update any incident" ON public.incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role NOT IN ('CITIZEN')
    )
  );

-- ---- DETECTIONS ----
CREATE POLICY "Anyone can read detections" ON public.detections
  FOR SELECT USING (TRUE);

CREATE POLICY "System can insert detections" ON public.detections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---- LIFECYCLE ----
CREATE POLICY "Anyone can read lifecycle" ON public.incident_lifecycle
  FOR SELECT USING (TRUE);

CREATE POLICY "Officials can insert lifecycle events" ON public.incident_lifecycle
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---- WORK ORDERS ----
CREATE POLICY "Officials can read work orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role NOT IN ('CITIZEN')
    )
  );

CREATE POLICY "Supervisors can manage work orders" ON public.work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('DEPARTMENT_SUPERVISOR','MUNICIPAL_OFFICER','MUNICIPAL_ADMIN',
                      'DIRECTOR_OF_OPERATIONS','INFRALENS_SUPER_ADMIN')
    )
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ---- AUDIT LOG ----
CREATE POLICY "Officials can read audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role NOT IN ('CITIZEN')
    )
  );

CREATE POLICY "System can insert audit events" ON public.audit_log
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FUNCTION: auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'CITIZEN')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: incident statistics view (for analytics)
-- ============================================================
CREATE OR REPLACE VIEW public.incident_stats AS
SELECT
  COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED','CLOSED','REJECTED')) AS active_count,
  COUNT(*) FILTER (WHERE priority = 'P0' AND status NOT IN ('RESOLVED','CLOSED')) AS p0_emergency,
  COUNT(*) FILTER (WHERE priority IN ('P0','P1') AND status NOT IN ('RESOLVED','CLOSED')) AS critical_count,
  COUNT(*) FILTER (WHERE status IN ('RESOLVED','CLOSED')) AS resolved_count,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS reported_today,
  COUNT(*) FILTER (WHERE category = 'road_damage') AS road_damage_count,
  COUNT(*) FILTER (WHERE category = 'drainage_overflow') AS drainage_count,
  COUNT(*) FILTER (WHERE category = 'waste_accumulation') AS waste_count,
  COUNT(*) FILTER (WHERE category = 'electrical_hazard') AS electrical_count,
  COUNT(*) FILTER (WHERE category = 'lighting_failure') AS lighting_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)
    FILTER (WHERE status IN ('RESOLVED','CLOSED')) AS avg_resolution_hours,
  COUNT(*) AS total_all_time
FROM public.incidents;

-- Ward-level breakdown
CREATE OR REPLACE VIEW public.ward_stats AS
SELECT
  ward,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED','CLOSED','REJECTED')) AS active_incidents,
  COUNT(*) FILTER (WHERE status IN ('RESOLVED','CLOSED')) AS resolved_incidents,
  COUNT(*) FILTER (WHERE priority IN ('P0','P1')) AS critical_incidents,
  ROUND(AVG(severity_score)::numeric, 1) AS avg_severity_score
FROM public.incidents
WHERE ward IS NOT NULL
GROUP BY ward
ORDER BY active_incidents DESC;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_lifecycle;
