import React, { useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { GisMap } from '../map/GisMap';
import { SeverityIndicator } from '../common/SeverityIndicator';
import { DBSCANCluster, Issue, RoadSegment } from '../../types/infrastructure';
import { METRO_ROADS } from '../../services/gisEngine';
import { 
  Layers, 
  MapPin, 
  Crosshair, 
  ChevronRight, 
  Eye, 
  Flame, 
  ShieldCheck, 
  Compass, 
  Building,
  Route,
  AlertTriangle,
  Users,
  School,
  Bus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const FullMapView: React.FC = () => {
  const { 
    filteredIssues, 
    issues,
    selectedIssue, 
    setSelectedIssue, 
    openDetailDrawer,
    filters,
    setFilters,
    clusters,
    authorities,
    assignAuthority,
    addToast
  } = useInfra();

  const [activeTab, setActiveTab] = useState<'drilldown' | 'clusters' | 'inspector'>('drilldown');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>('CL-027');
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>('road-bryant');

  const activeCluster = clusters.find((c) => c.clusterId === selectedClusterId) || clusters[0];
  const clusterMemberIssues = activeCluster
    ? issues.filter((i) => activeCluster.issueIds.includes(i.id))
    : [];

  const activeRoad = METRO_ROADS.find((r) => r.id === selectedRoadId);

  const handleAssignCluster = async () => {
    if (!clusterMemberIssues.length) return;
    const roadsDept = authorities.find((a) => a.id === 'auth-roads') || authorities[0];
    for (const member of clusterMemberIssues) {
      await assignAuthority(member.id, roadsDept.id);
    }
    addToast(`Assigned all ${clusterMemberIssues.length} reports in ${activeCluster?.clusterId || 'Cluster'} to Municipal Roads Dept`, 'success');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#07090E]">
      {/* Hierarchical Drilldown Breadcrumb Strip (Rules 3 & 4: City → Ward → Road → Cluster → Issue) */}
      <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Level 1: City */}
          <button
            onClick={() => {
              setFilters((p) => ({ ...p, ward: 'all' }));
              setSelectedRoadId(null);
              setSelectedClusterId(null);
            }}
            className={`px-2.5 py-1 rounded transition-colors ${
              filters.ward === 'all' && !selectedRoadId && !selectedClusterId
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            City (Metro Core)
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          {/* Level 2: Ward */}
          <select
            value={filters.ward}
            onChange={(e) => {
              setFilters((p) => ({ ...p, ward: e.target.value }));
              setSelectedRoadId(null);
              setSelectedClusterId(null);
            }}
            className={`bg-[#0E1524] border border-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500 ${
              filters.ward !== 'all' ? 'text-cyan-300 font-bold border-cyan-500/30' : 'text-slate-400'
            }`}
          >
            <option value="all">All Wards</option>
            <option value="Ward 6">Ward 6 — Mission & SOMA</option>
            <option value="Ward 3">Ward 3 — Civic & Financial</option>
            <option value="Ward 9">Ward 9 — Mission District</option>
            <option value="Ward 5">Ward 5 — Western Addition</option>
          </select>

          {/* Level 3: Road Corridor */}
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <select
            value={selectedRoadId || ''}
            onChange={(e) => setSelectedRoadId(e.target.value || null)}
            className={`bg-[#0E1524] border border-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500 ${
              selectedRoadId ? 'text-emerald-300 font-bold border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <option value="">All Arterial Roads</option>
            {METRO_ROADS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.health.toUpperCase()})
              </option>
            ))}
          </select>

          {selectedClusterId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {/* Level 4: Cluster */}
              <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 font-bold border border-orange-500/40 flex items-center gap-1">
                <span>Cluster {selectedClusterId}</span>
              </span>
            </>
          )}

          {selectedIssue && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {/* Level 5: Issue */}
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                {selectedIssue.issueCode}
              </span>
            </>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
            className="bg-[#0E1524] border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="road_damage">Road Damage</option>
            <option value="electrical_hazard">Electrical Hazards</option>
            <option value="drainage_overflow">Drainage Overflow</option>
            <option value="lighting_failure">Lighting Failure</option>
            <option value="sidewalk_hazard">Sidewalk Hazards</option>
            <option value="waste_accumulation">Solid Waste</option>
          </select>

          <span className="text-slate-400 text-[11px] hidden sm:inline">
            {filteredIssues.length} Geocoded Points
          </span>
        </div>
      </div>

      {/* Main Map + Sidebar Split View */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Full Interactive Map */}
        <div className="flex-1 relative h-full">
          <GisMap
            heightClass="h-full rounded-none border-none"
            showControls={true}
            selectedRoadId={selectedRoadId}
            onSelectRoad={(road) => {
              setSelectedRoadId(road.id);
            }}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setActiveTab('inspector');
            }}
          />
        </div>

        {/* Tactical Hierarchy Side Panel */}
        <div className="w-full lg:w-[420px] bg-[#090D17] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-80 lg:h-full z-10 shrink-0">
          {/* Panel Tab Switcher */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-1 bg-[#0E1524]">
            <button
              onClick={() => setActiveTab('drilldown')}
              className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors ${
                activeTab === 'drilldown'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Intelligence
            </button>
            <button
              onClick={() => setActiveTab('clusters')}
              className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors ${
                activeTab === 'clusters'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DBSCAN Hubs ({clusters.length})
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors ${
                activeTab === 'inspector'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inspector
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {activeTab === 'drilldown' ? (
              /* Rich Cluster Intelligence Panel (Rule 4 exact specifications) */
              activeCluster ? (
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#1C140D] via-[#121826] to-[#0A0E17] border border-orange-500/50 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-orange-400 tracking-wider">
                        CLUSTER {activeCluster.clusterId}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-sm">
                        P1 CRITICAL
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white font-sans uppercase tracking-wide">
                      {activeCluster.name}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800">
                      <span className="text-amber-300 font-bold">
                        {activeCluster.reportCount || 37} reports
                      </span>
                      <span className="text-slate-400">
                        {activeCluster.radiusMeters || 400}m radius
                      </span>
                    </div>
                  </div>

                  {/* WHY THIS MATTERS */}
                  <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      WHY THIS MATTERS
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>High damage severity (87 / 100)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span>High report density ({activeCluster.reportCount || 37} proximate incidents)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Lincoln High School 180m away</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>Major freight & transit corridor</span>
                      </li>
                    </ul>
                  </div>

                  {/* IMPACT */}
                  <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        CIVIC DEMOGRAPHIC IMPACT
                      </span>
                      <span className="text-cyan-300 font-bold">~2,000 daily users</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                        <School className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                        <div className="text-slate-400 text-[10px]">School</div>
                        <div className="text-white font-bold">180m</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                        <Bus className="w-3.5 h-3.5 text-cyan-400 mx-auto" />
                        <div className="text-slate-400 text-[10px]">Bus Stop</div>
                        <div className="text-white font-bold">90m</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        <div className="text-slate-400 text-[10px]">Market</div>
                        <div className="text-white font-bold">310m</div>
                      </div>
                    </div>
                  </div>

                  {/* RECOMMENDED ACTION */}
                  <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      RECOMMENDED ACTION
                    </div>
                    <div className="text-xs font-extrabold text-rose-400 uppercase tracking-wide">
                      URGENT ROAD REPAIR & SURFACE MILLING
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standard SLA: 24h • Accelerated School Zone Window: 6h
                    </div>
                  </div>

                  {/* RESPONSIBLE AUTHORITY */}
                  <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      RESPONSIBLE AUTHORITY
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      Municipal Roads Department
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Pavement Maintenance & Highway Infrastructure Div.
                    </div>
                  </div>

                  {/* Action Buttons: [ASSIGN], [VIEW LOCATION] */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleAssignCluster}
                      className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ASSIGN DEPT</span>
                    </button>

                    <button
                      onClick={() => {
                        if (clusterMemberIssues[0]) {
                          setSelectedIssue(clusterMemberIssues[0]);
                          setActiveTab('inspector');
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#141C2E] hover:bg-[#1A2640] border border-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>VIEW LOCATION</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">
                  Select a cluster or road on the map to inspect intelligence.
                </div>
              )
            ) : activeTab === 'clusters' ? (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">
                  Active DBSCAN Clusters (r=400m, min=3)
                </div>

                {clusters.map((cluster) => (
                  <div
                    key={cluster.clusterId}
                    onClick={() => {
                      setSelectedClusterId(cluster.clusterId);
                      setActiveTab('drilldown');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedClusterId === cluster.clusterId
                        ? 'bg-orange-950/40 border-orange-400 text-white'
                        : 'bg-[#0E1524] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 font-bold text-orange-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        {cluster.clusterId} • {cluster.reportCount} Reports
                      </span>
                      <SeverityIndicator severity={cluster.dominantSeverity} size="sm" />
                    </div>

                    <div className="text-xs font-semibold text-slate-100 truncate font-sans">
                      {cluster.name}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Radius: {cluster.radiusMeters}m</span>
                      <span className="text-rose-400 font-bold">Severity: {cluster.severityScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedIssue ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{selectedIssue.issueCode}</span>
                    <SeverityIndicator severity={selectedIssue.severity} size="sm" />
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    {selectedIssue.title}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {selectedIssue.location.address}
                  </div>
                </div>

                {/* Priority Explainability snippet */}
                {selectedIssue.priorityExplainability && (
                  <div className="p-3 rounded-xl bg-[#0F1829] border border-cyan-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-cyan-400 font-bold text-[11px]">
                      <span>{selectedIssue.priority} {selectedIssue.priorityExplainability.priorityLabel}</span>
                      <span>Score: {selectedIssue.priorityExplainability.score}/100</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      {selectedIssue.priorityExplainability.reasons[0]}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                    <span className="text-[10px] text-slate-500">COMMUTERS</span>
                    <div className="text-sm font-bold text-slate-100">
                      ~{selectedIssue.impact.affectedUsersPerDay.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                    <span className="text-[10px] text-slate-500">SLA TARGET</span>
                    <div className="text-sm font-bold text-amber-400">
                      {selectedIssue.impact.slaDeadlineHours} hours
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openDetailDrawer(selectedIssue)}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Incident Drawer</span>
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">
                Click any marker or cluster on the map to inspect telemetry data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
