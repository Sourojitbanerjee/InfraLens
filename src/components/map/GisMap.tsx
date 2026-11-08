import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Issue, Severity, RoadSegment } from '../../types/infrastructure';
import { METRO_ROADS, METRO_WARDS } from '../../services/gisEngine';
import { useInfra } from '../../context/InfraContext';
import { 
  Layers, 
  Flame, 
  Crosshair, 
  Eye, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Route, 
  Satellite, 
  Map as MapIcon, 
  Check, 
  AlertCircle,
  Search,
  X,
  Copy,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface GisMapProps {
  issues?: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issue: Issue) => void;
  selectedRoadId?: string | null;
  onSelectRoad?: (road: RoadSegment) => void;
  showRoadSegments?: boolean;
  heightClass?: string;
  showControls?: boolean;
  onMapClickCoordinates?: (coords: { lat: number; lon: number }) => void;
}

// Controller component to smoothly pan/zoom when target changes
const MapEffectController: React.FC<{ 
  targetCoords: [number, number] | null;
  targetZoom?: number;
}> = ({ targetCoords, targetZoom = 15 }) => {
  const map = useMap();

  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, targetZoom, {
        duration: 1.1,
        easeLinearity: 0.25,
      });
    }
  }, [targetCoords, targetZoom, map]);

  return null;
};

// Map click listener for manual coordinate pinning
const MapClickHandler: React.FC<{ onCoordinatesPicked?: (coords: { lat: number; lon: number }) => void }> = ({
  onCoordinatesPicked,
}) => {
  useMapEvents({
    click(e) {
      if (onCoordinatesPicked) {
        onCoordinatesPicked({ lat: Number(e.latlng.lat.toFixed(5)), lon: Number(e.latlng.lng.toFixed(5)) });
      }
    },
  });
  return null;
};

// Automatic container resize observer to prevent grey tiles on viewport changes
const MapResizeHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const container = map.getContainer();
    if (!container) {
      return () => clearTimeout(timer);
    }

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
};

// Create custom leaflet divIcon for issues and clusters
const createCustomMarkerIcon = (issue: Issue, isSelected: boolean) => {
  const isEmergency = issue.priority === 'P0';
  const isCluster = (issue.clusterCount ?? 0) > 5;
  const count = issue.clusterCount ?? 1;
  const isResolved = issue.status === 'resolved' || issue.severity === 'healthy';
  const isUnverified = 
    issue.verificationStatus === 'UNVERIFIED_PROVISIONAL' || 
    issue.location?.locationVerificationStatus === 'UNVERIFIED_PROVISIONAL' ||
    issue.recordType === 'CITIZEN_REPORT';

  const colorMap: Record<Severity, { bg: string; border: string; glow: string; text: string }> = {
    critical: {
      bg: isEmergency ? 'bg-purple-600' : 'bg-rose-600',
      border: isEmergency ? 'border-rose-400' : 'border-rose-400',
      glow: isEmergency ? 'shadow-[0_0_22px_rgba(244,63,94,0.9)]' : 'shadow-[0_0_18px_rgba(239,68,68,0.8)]',
      text: 'text-white',
    },
    high: {
      bg: 'bg-orange-500',
      border: 'border-orange-300',
      glow: 'shadow-[0_0_14px_rgba(249,115,22,0.7)]',
      text: 'text-white',
    },
    moderate: {
      bg: 'bg-amber-500',
      border: 'border-amber-300',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
      text: 'text-slate-950',
    },
    healthy: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-300',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      text: 'text-white',
    },
  };

  const style = isResolved ? colorMap.healthy : (colorMap[issue.severity] || colorMap.moderate);

  let html = '';

  if (isUnverified) {
    html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <span class="absolute w-10 h-10 rounded-full border-2 border-dashed border-amber-400 opacity-80 animate-spin" style="animation-duration: 8s;"></span>
        <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-950/90 border-2 border-dashed border-amber-400 text-amber-300 font-mono font-bold text-[10px] shadow-lg ${
          isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : ''
        }">
          ?
        </div>
      </div>
    `;
  } else if (isEmergency) {
    html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <span class="absolute w-14 h-14 rounded-full bg-rose-600 opacity-40 animate-ping"></span>
        <span class="absolute w-10 h-10 rounded-full bg-purple-600 opacity-60 animate-pulse"></span>
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-rose-300 text-white font-mono font-extrabold text-[12px] shadow-2xl ${
          isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : ''
        }">
          ⚡
        </div>
      </div>
    `;
  } else if (isResolved) {
    html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <span class="absolute w-8 h-8 rounded-full bg-emerald-500/30"></span>
        <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 border-2 border-emerald-300 text-white font-bold text-[11px] shadow-lg ${
          isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : ''
        }">
          ✓
        </div>
      </div>
    `;
  } else if (isCluster) {
    html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <span class="absolute w-12 h-12 rounded-full ${style.bg} opacity-30 animate-ping"></span>
        <span class="absolute w-9 h-9 rounded-full ${style.bg} opacity-40 animate-pulse"></span>
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${style.bg} ${style.border} border-2 ${style.glow} ${style.text} font-mono font-extrabold text-[12px] shadow-2xl transition-transform group-hover:scale-110 ${
      isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-125 z-50' : ''
    }">
          ${count}
        </div>
      </div>
    `;
  } else {
    html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        ${
          isSelected
            ? '<span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>'
            : ''
        }
        <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${style.bg} ${style.border} border-2 ${style.glow} text-white shadow-xl transition-transform group-hover:scale-110 ${
      isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : ''
    }">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;
  }

  return L.divIcon({
    html,
    className: 'custom-gis-marker',
    iconSize: isCluster || isEmergency ? [36, 36] : [28, 28],
    iconAnchor: isCluster || isEmergency ? [18, 18] : [14, 14],
    popupAnchor: [0, -16],
  });
};

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || 'lTDrh4NrGeyVcOMBP4lt';

export type BasemapMode = 'maptiler-dark' | 'maptiler-satellite' | 'maptiler-streets' | 'carto-dark';

interface BasemapOption {
  id: BasemapMode;
  name: string;
  subtitle: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const BASEMAP_OPTIONS: Record<BasemapMode, BasemapOption> = {
  'maptiler-dark': {
    id: 'maptiler-dark',
    name: 'MapTiler Dark',
    subtitle: 'Tactical Dataviz Dark',
    url: `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
  'maptiler-satellite': {
    id: 'maptiler-satellite',
    name: 'MapTiler Satellite',
    subtitle: 'High-Res Aerial Orthophoto',
    url: `https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
  'maptiler-streets': {
    id: 'maptiler-streets',
    name: 'MapTiler Streets',
    subtitle: 'Detailed Civic Road Topology',
    url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
  'carto-dark': {
    id: 'carto-dark',
    name: 'Carto Dark Matter',
    subtitle: 'Standard Offline Fallback',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

export const GisMap: React.FC<GisMapProps> = ({
  issues: propIssues,
  selectedIssueId,
  onSelectIssue,
  selectedRoadId,
  onSelectRoad,
  showRoadSegments,
  heightClass = 'h-[500px]',
  showControls = true,
  onMapClickCoordinates,
}) => {
  const { 
    filteredIssues, 
    selectedIssue, 
    openDetailDrawer,
    clusters,
    authorities,
    addToast
  } = useInfra();

  const displayIssues = propIssues || filteredIssues;
  const activeSelected = selectedIssueId 
    ? displayIssues.find((i) => i.id === selectedIssueId) 
    : selectedIssue;

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoads, setShowRoads] = useState(showRoadSegments !== undefined ? showRoadSegments : true);
  const [mapFilter, setMapFilter] = useState<'all' | 'critical' | 'clusters' | 'unverified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);

  const [basemapStyle, setBasemapStyle] = useState<BasemapMode>('maptiler-dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  // Center coordinate defaults to New Delhi Municipal Council (NDMC) Central Delhi
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  const flyTargetCoords = useMemo<[number, number] | null>(() => {
    if (activeSelected) {
      return [activeSelected.location.latitude, activeSelected.location.longitude];
    }
    return null;
  }, [activeSelected]);

  // Comprehensive GIS filtering: search query + ward + department + quick filter
  const visibleIssues = useMemo(() => {
    return displayIssues.filter((i) => {
      // 1. Text Search (ID, title, address, road, ward)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = i.issueCode?.toLowerCase().includes(query) || i.id.toLowerCase().includes(query);
        const matchesTitle = i.title?.toLowerCase().includes(query);
        const matchesAddress = i.location?.address?.toLowerCase().includes(query);
        const matchesRoad = i.location?.roadName?.toLowerCase().includes(query);
        const matchesWard = i.location?.ward?.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesAddress && !matchesRoad && !matchesWard) {
          return false;
        }
      }

      // 2. Ward Filter
      if (selectedWard !== 'all') {
        const iWard = (i.location?.ward || '').toLowerCase();
        if (!iWard.includes(selectedWard.toLowerCase())) {
          return false;
        }
      }

      // 3. Department Filter
      if (selectedDept !== 'all') {
        if (i.authorityId !== selectedDept && i.authorityName !== selectedDept) {
          return false;
        }
      }

      // 4. Map Filter mode
      if (mapFilter === 'critical') return i.severity === 'critical' || i.priority === 'P0' || i.priority === 'P1';
      if (mapFilter === 'clusters') return (i.clusterCount ?? 0) > 3;
      if (mapFilter === 'unverified') {
        return (
          i.verificationStatus === 'UNVERIFIED_PROVISIONAL' || 
          i.location?.locationVerificationStatus === 'UNVERIFIED_PROVISIONAL' ||
          i.recordType === 'CITIZEN_REPORT'
        );
      }
      return true;
    });
  }, [displayIssues, searchQuery, selectedWard, selectedDept, mapFilter]);

  // Active basemap config
  const activeBasemapConfig = usingFallback
    ? BASEMAP_OPTIONS['carto-dark']
    : BASEMAP_OPTIONS[basemapStyle];

  const handleTileError = () => {
    setTileErrorCount((prev) => {
      const next = prev + 1;
      if (next >= 4 && !usingFallback && basemapStyle.startsWith('maptiler')) {
        setUsingFallback(true);
      }
      return next;
    });
  };

  const handleSelectBasemap = (style: BasemapMode) => {
    setBasemapStyle(style);
    setUsingFallback(false);
    setTileErrorCount(0);
    setShowLayerMenu(false);
  };

  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetCenter = () => {
    mapInstanceRef.current?.flyTo(defaultCenter, 13, { duration: 1.0 });
  };

  const copyCoordinates = (issue: Issue) => {
    const text = `${issue.location.latitude.toFixed(6)}, ${issue.location.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoordId(issue.id);
    addToast(`Coordinates copied: ${text}`, 'info');
    setTimeout(() => setCopiedCoordId(null), 2500);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#07090E] ${heightClass}`}>
      {/* Map Control Bar Overlay */}
      {showControls && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[1000] flex flex-col gap-2 max-w-[calc(100%-60px)]">
          {/* Top Row: Search + Quick Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Real-time Search Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incident, road, ward..."
                className="w-44 sm:w-56 pl-7 pr-6 py-1 rounded-lg bg-[#0E1524]/95 border border-slate-700/80 text-[11px] sm:text-xs font-mono text-slate-100 placeholder-slate-500 backdrop-blur-md shadow-xl focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Filter Pill Group */}
            <div className="flex items-center shrink-0 rounded-lg bg-[#0E1524]/90 border border-slate-800 p-0.5 sm:p-1 backdrop-blur-md shadow-xl text-[11px] sm:text-xs font-mono">
              <button
                onClick={() => setMapFilter('all')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-colors ${
                  mapFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({displayIssues.length})
              </button>
              <button
                onClick={() => setMapFilter('critical')}
                className={`px-2 sm:px-2.5 py-1 rounded-md flex items-center gap-1 sm:gap-1.5 transition-colors ${
                  mapFilter === 'critical'
                    ? 'bg-rose-950 text-rose-300 font-semibold border border-rose-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse" />
                Critical
              </button>
              <button
                onClick={() => setMapFilter('unverified')}
                className={`px-2 sm:px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                  mapFilter === 'unverified'
                    ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Provisional</span>
              </button>
              <button
                onClick={() => setMapFilter('clusters')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-colors ${
                  mapFilter === 'clusters'
                    ? 'bg-orange-950 text-orange-300 font-semibold border border-orange-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hubs
              </button>
            </div>

            {/* Corridors Toggle */}
            <button
              onClick={() => setShowRoads(!showRoads)}
              className={`flex items-center shrink-0 gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono backdrop-blur-md transition-colors ${
                showRoads
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#0E1524]/90 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Corridors</span> {showRoads ? 'ON' : 'OFF'}
            </button>

            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center shrink-0 gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono backdrop-blur-md transition-colors ${
                showHeatmap
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-[#0E1524]/90 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Heatmap</span> {showHeatmap ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Sub Row: Ward Filter & Department Filter Dropdowns */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Ward Selector */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-[#0E1524]/95 border border-slate-800 text-slate-300 text-[11px] font-mono rounded-lg px-2 py-1 backdrop-blur-md focus:outline-none focus:border-cyan-500 shadow-md"
            >
              <option value="all">All NDMC Wards</option>
              {METRO_WARDS.map((w) => (
                <option key={w.id} value={w.name.split('—')[0].trim()}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Department Selector */}
            {authorities && authorities.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-[#0E1524]/95 border border-slate-800 text-slate-300 text-[11px] font-mono rounded-lg px-2 py-1 backdrop-blur-md focus:outline-none focus:border-cyan-500 shadow-md hidden sm:inline-block"
              >
                <option value="all">All Departments</option>
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}

            {/* Match Counter Badge */}
            <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-cyan-400 shrink-0">
              {visibleIssues.length} points
            </span>
          </div>
        </div>
      )}

      {/* Floating Tactical Controls (Right-top) */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-[1000] flex flex-col gap-1.5 sm:gap-2">
        <div className="flex flex-col rounded-lg bg-[#0E1524]/90 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors border-b border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <button
          onClick={handleResetCenter}
          className="p-1.5 sm:p-2 rounded-lg bg-[#0E1524]/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors backdrop-blur-md shadow-xl"
          title="Reset to New Delhi NDMC Center"
        >
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Basemap Layer Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`p-1.5 sm:p-2 rounded-lg border text-xs font-mono transition-colors backdrop-blur-md shadow-xl flex items-center gap-1 ${
              showLayerMenu
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-cyan-950/50'
                : 'bg-[#0E1524]/90 border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60'
            }`}
            title="Select Basemap Layer"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-60 sm:w-68 rounded-xl bg-[#090D18]/95 border border-slate-800 shadow-2xl p-2 z-[1100] backdrop-blur-xl font-mono text-xs animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Basemap Engine</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                  MapTiler Cloud
                </span>
              </div>
              <div className="space-y-1">
                {(Object.keys(BASEMAP_OPTIONS) as BasemapMode[]).map((key) => {
                  const opt = BASEMAP_OPTIONS[key];
                  const isSelected = basemapStyle === key && !usingFallback;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectBasemap(key)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {key === 'maptiler-satellite' ? (
                          <Satellite className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : key === 'maptiler-streets' ? (
                          <MapIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-[11px]">{opt.name}</div>
                          <div className="text-[9px] text-slate-500">{opt.subtitle}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {usingFallback && (
                <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Domain Restriction Fallback</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                    Add your domain to MapTiler Key Settings to activate MapTiler tiles.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#080D18]/90 border border-slate-800/80 backdrop-blur-md text-[10px] font-mono text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span>P0 Emergency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Resolved</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-slate-700/80 pl-2 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-amber-400" />
          <span>Provisional</span>
        </div>
      </div>

      {/* Accuracy & Deployment Jurisdiction Badge (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#080D18]/90 border border-slate-800/90 backdrop-blur-md text-[10px] font-mono text-slate-300 shadow-xl">
        <span
          className={`w-2 h-2 rounded-full ${
            usingFallback ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <span className="font-semibold text-slate-200">
          NDMC Central Delhi (RTK GPS ±3.2m)
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500 text-[9px]">
          {usingFallback ? 'Carto Fallback' : activeBasemapConfig.name}
        </span>
      </div>

      {/* Actual React-Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
        ref={mapInstanceRef}
      >
        <TileLayer
          key={`${activeBasemapConfig.id}-${usingFallback ? 'fallback' : 'primary'}`}
          attribution={activeBasemapConfig.attribution}
          url={activeBasemapConfig.url}
          maxZoom={activeBasemapConfig.maxZoom}
          eventHandlers={{
            tileerror: handleTileError,
          }}
        />

        <MapResizeHandler />
        <MapEffectController targetCoords={flyTargetCoords} />
        <MapClickHandler onCoordinatesPicked={onMapClickCoordinates} />

        {/* Heatmap Overlay */}
        {showHeatmap &&
          visibleIssues.map((issue) => (
            <Circle
              key={`heat-${issue.id}`}
              center={[issue.location.latitude, issue.location.longitude]}
              radius={(issue.clusterRadiusMeters || 300) * 1.5}
              pathOptions={{
                color: issue.priority === 'P0' ? '#c084fc' : issue.severity === 'critical' ? '#ef4444' : '#f97316',
                fillColor: issue.priority === 'P0' ? '#9333ea' : issue.severity === 'critical' ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.25,
                weight: 1,
              }}
            />
          ))}

        {/* City-Wide Road Infrastructure Health Network */}
        {showRoads &&
          METRO_ROADS.map((road) => {
            const isRoadSelected = selectedRoadId === road.id;
            const roadColor =
              road.health === 'critical'
                ? '#EF4444'
                : road.health === 'high-risk'
                ? '#F97316'
                : road.health === 'moderate'
                ? '#F59E0B'
                : '#10B981';

            return (
              <Polyline
                key={`road-${road.id}`}
                positions={road.coordinates}
                pathOptions={{
                  color: roadColor,
                  weight: isRoadSelected ? 6 : 4,
                  opacity: isRoadSelected ? 0.95 : 0.75,
                  dashArray: road.health === 'critical' ? '8 4' : undefined,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectRoad) onSelectRoad(road);
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-1.5 max-w-[240px] font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
                      <span className="font-bold text-white text-[11px]">{road.name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          road.health === 'critical'
                            ? 'bg-rose-950 text-rose-300'
                            : road.health === 'high-risk'
                            ? 'bg-orange-950 text-orange-300'
                            : road.health === 'moderate'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {road.health}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Health Rating:</span>
                      <strong className={road.health === 'critical' ? 'text-rose-400' : 'text-emerald-400'}>
                        {road.healthScore}/100
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Daily Traffic:</span>
                      <span className="text-slate-200">~{road.dailyTraffic.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Active Defects:</span>
                      <span className="text-amber-400 font-bold">{road.activeDefects} reports</span>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* DBSCAN Dynamic Cluster Radius Rings */}
        {clusters.map((cluster) => (
          <Circle
            key={`cluster-ring-${cluster.clusterId}`}
            center={[cluster.center.latitude, cluster.center.longitude]}
            radius={cluster.radiusMeters || 400}
            pathOptions={{
              color: cluster.severityScore > 80 ? '#f43f5e' : '#fb923c',
              fillColor: cluster.severityScore > 80 ? '#f43f5e' : '#fb923c',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '5 5',
            }}
          />
        ))}

        {/* Incident Markers with 15-Field Production Telemetry Popup */}
        {visibleIssues.map((issue) => {
          const isSelected = activeSelected?.id === issue.id;
          const markerIcon = createCustomMarkerIcon(issue, isSelected);
          const isCopied = copiedCoordId === issue.id;

          return (
            <Marker
              key={issue.id}
              position={[issue.location.latitude, issue.location.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  if (onSelectIssue) onSelectIssue(issue);
                  else openDetailDrawer(issue);
                },
              }}
            >
              <Popup className="custom-popup" maxWidth={320}>
                <div className="p-1 space-y-2 max-w-[300px] text-xs font-sans">
                  {/* Field 1: Incident ID & Priority & Severity Header */}
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-cyan-400 font-extrabold">
                        {issue.issueCode || issue.id}
                      </span>
                      {issue.recordType && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-slate-300">
                          {issue.recordType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          issue.priority === 'P0'
                            ? 'bg-purple-950 text-rose-300'
                            : issue.severity === 'critical'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {issue.priority}
                      </span>
                      <span className="uppercase text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                        {issue.severity}
                      </span>
                    </div>
                  </div>

                  {/* Field 2 & 3: Category Label & Defect Title */}
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                      {issue.categoryLabel || issue.category?.replace(/_/g, ' ')}
                    </div>
                    <div className="font-bold text-slate-100 text-xs leading-snug mt-0.5">
                      {issue.title}
                    </div>
                  </div>

                  {/* Field 4 & 5: Coordinates with Copy Button */}
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{issue.location.latitude.toFixed(5)}, {issue.location.longitude.toFixed(5)}</span>
                    </div>
                    <button
                      onClick={() => copyCoordinates(issue)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                      title="Copy GPS coordinates"
                    >
                      {isCopied ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Field 6 & 7: Address, Ward & Pincode */}
                  <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                    <div className="truncate text-slate-200">{issue.location.address}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{issue.location.ward || 'Ward 1 — Connaught Place'}</span>
                      {issue.location.pincode && <span>PIN: {issue.location.pincode}</span>}
                    </div>
                  </div>

                  {/* Field 8, 9, 10, 11, 12, 13: Operational Grid */}
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] pt-1 border-t border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 uppercase">Assigned Authority</span>
                      <div className="text-slate-200 font-semibold truncate">
                        {issue.authorityName || 'NDMC Civil Roads'}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 uppercase">GPS Accuracy</span>
                      <div className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>±{issue.location.accuracyMeters || 3.2}m (RTK)</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 uppercase">Verification</span>
                      <div className="text-cyan-300 font-semibold">
                        {issue.location.locationVerificationStatus || 'VERIFIED_FIELD'}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 uppercase">SLA Target</span>
                      <div className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{issue.impact?.slaDeadlineHours || 24}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Field 14: Assigned Officer / Team */}
                  {issue.assignedOfficerOrTeam && (
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 pt-0.5">
                      <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>Assigned: <strong className="text-slate-200">{issue.assignedOfficerOrTeam}</strong></span>
                    </div>
                  )}

                  {/* Field 15: AI Reason Snippet & Drawer Action Button */}
                  {issue.priorityExplainability?.reasons?.[0] && (
                    <div className="bg-slate-900 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 font-mono">
                      Reason: {issue.priorityExplainability.reasons[0]}
                    </div>
                  )}

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => openDetailDrawer(issue)}
                      className="w-full py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-md shadow-cyan-900/40"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Telemetry & Full History</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
