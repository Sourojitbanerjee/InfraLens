import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Issue, Severity, Priority, RoadSegment } from '../../types/infrastructure';
import { METRO_ROADS } from '../../services/gisEngine';
import { useInfra } from '../../context/InfraContext';
import { 
  Layers, 
  Flame, 
  Crosshair, 
  Eye, 
  MapPin, 
  ZoomIn,
  ZoomOut,
  Route
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
    // Initial size invalidation
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

  const style = colorMap[issue.severity] || colorMap.moderate;

  let html = '';

  if (isEmergency) {
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
    clusters 
  } = useInfra();

  const displayIssues = propIssues || filteredIssues;
  const activeSelected = selectedIssueId 
    ? displayIssues.find((i) => i.id === selectedIssueId) 
    : selectedIssue;

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoads, setShowRoads] = useState(showRoadSegments !== undefined ? showRoadSegments : true);
  const [mapFilter, setMapFilter] = useState<'all' | 'critical' | 'clusters'>('all');
  const [basemapStyle, setBasemapStyle] = useState<'dark' | 'contrast'>('dark');

  // Center coordinate defaults to Metro Central (San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  const flyTargetCoords = useMemo<[number, number] | null>(() => {
    if (activeSelected) {
      return [activeSelected.location.latitude, activeSelected.location.longitude];
    }
    return null;
  }, [activeSelected]);

  // Filter markers based on local map quick filter
  const visibleIssues = useMemo(() => {
    return displayIssues.filter((i) => {
      if (mapFilter === 'critical') return i.severity === 'critical' || i.priority === 'P0' || i.priority === 'P1';
      if (mapFilter === 'clusters') return (i.clusterCount ?? 0) > 3;
      return true;
    });
  }, [displayIssues, mapFilter]);

  // Basemap tile URL: CartoDB Dark Matter
  const tileUrl =
    basemapStyle === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

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

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#07090E] ${heightClass}`}>
      {/* Map Control Bar Overlay */}
      {showControls && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[1000] flex items-center gap-1.5 sm:gap-2 max-w-[calc(100%-54px)] overflow-x-auto no-scrollbar py-0.5">
          {/* Quick Filters */}
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
              Critical / P0
            </button>
            <button
              onClick={() => setMapFilter('clusters')}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-colors ${
                mapFilter === 'clusters'
                  ? 'bg-orange-950 text-orange-300 font-semibold border border-orange-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DBSCAN Hubs
            </button>
          </div>

          {/* Road Network Toggle (Rule 3) */}
          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`flex items-center shrink-0 gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-mono backdrop-blur-md transition-colors ${
              showRoads
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                : 'bg-[#0E1524]/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>Corridors {showRoads ? 'ON' : 'OFF'}</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center shrink-0 gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-mono backdrop-blur-md transition-colors ${
              showHeatmap
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-950/40'
                : 'bg-[#0E1524]/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>
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
          title="Reset to Metro Center"
        >
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => setBasemapStyle(basemapStyle === 'dark' ? 'contrast' : 'dark')}
          className="p-1.5 sm:p-2 rounded-lg bg-[#0E1524]/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors backdrop-blur-md shadow-xl"
          title="Toggle Basemap Style"
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-4 px-3 py-2 rounded-lg bg-[#080D18]/90 border border-slate-800/80 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span>P0 Emergency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>P1 Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>P2 High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Resolved</span>
        </div>
        <div className="border-l border-slate-700 pl-3 flex items-center gap-1.5 text-cyan-400 font-semibold">
          <span>🔴 37 = DBSCAN Hub</span>
        </div>
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
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url={tileUrl}
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

        {/* City-Wide Road Infrastructure Health Network (Rule 3) */}
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

        {/* Markers */}
        {visibleIssues.map((issue) => {
          const isSelected = activeSelected?.id === issue.id;
          const markerIcon = createCustomMarkerIcon(issue, isSelected);

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
              <Popup className="custom-popup">
                <div className="p-1 space-y-2 max-w-[260px] text-xs font-sans">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">
                      {issue.issueCode}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        issue.priority === 'P0'
                          ? 'bg-purple-950 text-rose-300'
                          : issue.severity === 'critical'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {issue.priority} {issue.severity}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-100 text-xs leading-snug">
                    {issue.title}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{issue.location.address}</span>
                  </div>

                  {issue.priorityExplainability?.reasons?.[0] && (
                    <div className="bg-slate-900 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 font-mono">
                      Reason: {issue.priorityExplainability.reasons[0]}
                    </div>
                  )}

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => openDetailDrawer(issue)}
                      className="w-full py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Telemetry</span>
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
