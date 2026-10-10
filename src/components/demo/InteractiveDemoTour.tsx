import React, { useState, useEffect } from 'react';
import { useInfra } from '../../context/InfraContext';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface InteractiveDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveDemoTour: React.FC<InteractiveDemoTourProps> = ({ isOpen, onClose }) => {
  const { 
    setCurrentView, 
    setSelectedCluster, 
    setSelectedIssue, 
    openDetailDrawer, 
    closeDetailDrawer,
    issues, 
    clusters, 
    authorities, 
    assignAuthority, 
    updateIssueStatus,
    addToast 
  } = useInfra();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 13;

  const targetIssue = issues.find((i) => i.issueCode === 'INF-2026-891') || issues[0];
  const cl027 = clusters.find((c) => c.clusterId === 'CL-027') || clusters[0];
  const resolvedIssue = issues.find((i) => i.status === 'resolved' && i.resolutionComparison) || issues[issues.length - 1];

  const executeStep = async (step: number) => {
    switch (step) {
      case 1:
        // 1. Open City Command Center
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 1: Open City Command Center telemetry hub', 'info');
        break;

      case 2:
        // 2. Show city health score
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 2: Aggregate City Infrastructure Health Index (76.4%)', 'info');
        break;

      case 3:
        // 3. Click a red infrastructure cluster
        closeDetailDrawer();
        setCurrentView('map');
        if (cl027) setSelectedCluster(cl027);
        addToast('Step 3: Selected Red DBSCAN Cluster CL-027 (400m radius)', 'warning');
        break;

      case 4:
        // 4. Show 37 related reports
        setCurrentView('map');
        if (cl027) setSelectedCluster(cl027);
        addToast('Step 4: Inspected 37 aggregated reports in Cluster CL-027', 'info');
        break;

      case 5:
        // 5. Show school / population / traffic impact
        setCurrentView('map');
        addToast('Step 5: Impact analysis: Lincoln High School 180m, ~2,000 users/day', 'info');
        break;

      case 6:
        // 6. Show P1 priority reasoning
        if (targetIssue) {
          openDetailDrawer(targetIssue);
        }
        addToast('Step 6: P1 Priority explainability breakdown & demographic weights', 'info');
        break;

      case 7:
        // 7. Open original street image
        closeDetailDrawer();
        setCurrentView('analyze');
        addToast('Step 7: Opened original street-level visual capture', 'info');
        break;

      case 8:
        // 8. Show AI detections
        setCurrentView('analyze');
        addToast('Step 8: YOLOv11 tensor scan: Pothole detected (94.8% confidence, Severity 87)', 'info');
        break;

      case 9:
        // 9. Assign authority
        if (targetIssue) {
          const roads = authorities.find((a) => a.id === 'auth-roads') || authorities[0];
          await assignAuthority(targetIssue.id, roads.id);
          addToast(`Step 9: Assigned to ${roads.name}`, 'success');
        }
        break;

      case 10:
        // 10. Change status to IN_PROGRESS
        if (targetIssue) {
          await updateIssueStatus(targetIssue.id, 'in_progress', 'Field repair unit en route');
          addToast('Step 10: Status transitioned to IN_PROGRESS', 'warning');
        }
        break;

      case 11:
        // 11. Show updated dashboard
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 11: Dashboard reactive telemetry updated automatically', 'info');
        break;

      case 12:
        // 12. Mark resolved
        if (targetIssue) {
          await updateIssueStatus(targetIssue.id, 'resolved', 'Pavement milled and polymer seal cured');
          addToast('Step 12: Mark defect fully RESOLVED', 'success');
        }
        break;

      case 13:
        // 13. Show before/after improvement
        setCurrentView('dashboard');
        addToast('Step 13: Before / After Audit: Severity 87 → 12 in 4.2 days', 'success');
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeStep(currentStep);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const stepMeta = [
    {
      step: 1,
      title: 'City Command Center',
      tag: 'OPS CENTER',
      desc: 'InfraLens aggregates raw urban imagery into a unified, live civic operations command center.',
    },
    {
      step: 2,
      title: 'City Health Score (76.4%)',
      tag: 'CIVIC HEALTH',
      desc: 'Composite metric tracking road degradation, worst-performing ward, and mean-time-to-repair.',
    },
    {
      step: 3,
      title: 'DBSCAN Cluster CL-027',
      tag: 'GIS INTELLIGENCE',
      desc: 'Automatic spatial clustering (radius 400m) groups 37 reports into 1 actionable repair hub.',
    },
    {
      step: 4,
      title: '37 Related Defect Reports',
      tag: 'HOTSPOT SYNTHESIS',
      desc: 'Eliminates redundant citizen tickets by presenting an aggregated geographic damage incident.',
    },
    {
      step: 5,
      title: 'Civic Impact: ~2,000 Daily Users',
      tag: 'DEMOGRAPHIC RISK',
      desc: 'Cross-references POIs: Lincoln High School (180m) + bus stop (90m) + high traffic corridor.',
    },
    {
      step: 6,
      title: 'P1 Priority Reasoning',
      tag: 'EXPLAINABILITY',
      desc: 'Always explains WHY an issue was prioritized: 30% severity, 20% density, 15% pop, 10% school.',
    },
    {
      step: 7,
      title: 'Street-Level Visual Capture',
      tag: 'AI SCANNER',
      desc: 'Seamless ingestion of patrol camera, UAV scan, and citizen mobile imagery.',
    },
    {
      step: 8,
      title: 'Neural Object Detection',
      tag: 'COMPUTER VISION',
      desc: 'Multi-class bounding box inference with confidence metrics and structural damage depth estimates.',
    },
    {
      step: 9,
      title: 'Authority Routing: Roads Dept',
      tag: 'AUTONOMOUS ROUTING',
      desc: 'Defect category + ward location automatically resolves to Municipal Roads Department.',
    },
    {
      step: 10,
      title: 'Status: IN_PROGRESS',
      tag: 'FIELD DISPATCH',
      desc: 'Dispatch unit mobilized; cryptographic audit log records duration since initial detection.',
    },
    {
      step: 11,
      title: 'Live Telemetry Synchronization',
      tag: 'REACTIVE SYSTEM',
      desc: 'State updates synchronize across GIS map, priority queue, and analytics without page refresh.',
    },
    {
      step: 12,
      title: 'Work Order Closure: RESOLVED',
      tag: 'RESOLVED',
      desc: 'Inspector signs off on polymer compaction; SLA compliance verified.',
    },
    {
      step: 13,
      title: 'Before / After Impact Verification',
      tag: 'MEASURE IMPACT',
      desc: 'Severity drops from 87 → 12. Resolution time: 4.2 days. 3,500 daily commuters protected.',
    },
  ];

  const currentMeta = stepMeta[currentStep - 1] || stepMeta[0];

  return (
    <div className="fixed bottom-20 lg:bottom-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[2000] max-w-2xl w-auto sm:w-full">
      <div className="rounded-2xl bg-[#090D18]/95 border-2 border-cyan-500/70 shadow-[0_0_35px_rgba(6,182,212,0.35)] backdrop-blur-xl p-3.5 sm:p-5 text-slate-100 font-mono space-y-2.5 sm:space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white truncate">
              JUDGE DEMO TOUR
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 whitespace-nowrap shrink-0">
              {currentStep}/{totalSteps}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Exit Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {currentMeta.tag}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white">
              {currentMeta.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {currentMeta.desc}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              title="Restart Tour"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1.5 active:scale-95"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish Demo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
