import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Issue, ResolutionStatus } from '../../types/infrastructure';

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

  // Snapshot issue states on demo open so we can restore them on close/restart
  const snapshotRef = useRef<Map<string, ResolutionStatus>>(new Map());

  // Correct issue lookup: issueCode is INF-2026-0891 (5 digit suffix)
  const targetIssue = issues.find((i) => i.issueCode === 'INF-2026-0891' || i.id === 'iss-001') || issues[0];
  // Clusters are synthesized from pre-assigned CL-027, CL-002..CL-005 in mockIssues
  const cl027 = clusters.find((c) => c.clusterId === 'CL-027' || c.clusterId === 'CL-001') || clusters[0];
  const resolvedIssue = issues.find((i) => i.status === 'resolved' && i.resolutionComparison) || issues[issues.length - 1];

  // Snapshot on open
  useEffect(() => {
    if (isOpen) {
      const snap = new Map<string, ResolutionStatus>();
      issues.forEach((issue) => snap.set(issue.id, issue.status));
      snapshotRef.current = snap;
    }
  }, [isOpen]);

  // Restore issue states on close / restart
  const restoreIssueStates = async () => {
    const snap = snapshotRef.current;
    if (!snap || snap.size === 0) return;
    for (const [id, status] of snap) {
      const current = issues.find((i) => i.id === id);
      if (current && current.status !== status) {
        try {
          await updateIssueStatus(id, status, 'Demo tour state restored');
        } catch (_) {
          // best-effort
        }
      }
    }
  };

  const handleClose = async () => {
    await restoreIssueStates();
    closeDetailDrawer();
    onClose();
  };

  const handleRestart = async () => {
    await restoreIssueStates();
    setCurrentStep(1);
  };

  const executeStep = async (step: number) => {
    switch (step) {
      case 1:
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 1: City Command Center — live urban telemetry hub', 'info');
        break;

      case 2:
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 2: Aggregate City Infrastructure Health Index (76.4%)', 'info');
        break;

      case 3:
        closeDetailDrawer();
        setCurrentView('map');
        if (cl027) setSelectedCluster(cl027);
        addToast('Step 3: DBSCAN Cluster selected — 400m radius hotspot', 'warning');
        break;

      case 4:
        setCurrentView('map');
        if (cl027) setSelectedCluster(cl027);
        addToast('Step 4: 37 aggregated defect reports in cluster area', 'info');
        break;

      case 5:
        setCurrentView('map');
        addToast('Step 5: Impact: Lincoln High School 180m away — ~2,000 daily users', 'info');
        break;

      case 6:
        if (targetIssue) {
          openDetailDrawer(targetIssue);
        }
        addToast('Step 6: P1 Priority explainability breakdown & demographic weights', 'info');
        break;

      case 7:
        closeDetailDrawer();
        setCurrentView('analyze');
        addToast('Step 7: Street-level visual capture opened for AI inspection', 'info');
        break;

      case 8:
        setCurrentView('analyze');
        addToast('Step 8: Neural scan: Pothole detected at 94.8% confidence, Severity 87', 'info');
        break;

      case 9:
        if (targetIssue) {
          const roads = authorities.find((a) => a.id === 'auth-roads') || authorities[0];
          if (roads) {
            await assignAuthority(targetIssue.id, roads.id);
            addToast(`Step 9: Assigned to ${roads.name}`, 'success');
          }
        }
        break;

      case 10:
        if (targetIssue) {
          await updateIssueStatus(targetIssue.id, 'in_progress', 'Field repair unit en route');
          addToast('Step 10: Status → IN_PROGRESS — field crew dispatched', 'warning');
        }
        break;

      case 11:
        closeDetailDrawer();
        setCurrentView('dashboard');
        addToast('Step 11: Dashboard reactive telemetry updated automatically', 'info');
        break;

      case 12:
        if (targetIssue) {
          await updateIssueStatus(targetIssue.id, 'resolved', 'Pavement milled and polymer seal cured');
          addToast('Step 12: Work order CLOSED — defect marked resolved', 'success');
        }
        break;

      case 13:
        setCurrentView('dashboard');
        addToast('Step 13: Before/After audit — Severity 87 → 12 in 4.2 days', 'success');
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
      icon: Layers,
    },
    {
      step: 2,
      title: 'City Health Score (76.4%)',
      tag: 'CIVIC HEALTH',
      desc: 'Composite metric tracking road degradation, worst-performing ward, and mean-time-to-repair.',
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: 'DBSCAN Spatial Cluster',
      tag: 'GIS INTELLIGENCE',
      desc: 'Automatic spatial clustering (radius 400m) groups 37 reports into 1 actionable repair hub.',
      icon: MapPin,
    },
    {
      step: 4,
      title: '37 Related Defect Reports',
      tag: 'HOTSPOT SYNTHESIS',
      desc: 'Eliminates redundant citizen tickets by presenting an aggregated geographic damage incident.',
      icon: Layers,
    },
    {
      step: 5,
      title: 'Civic Impact: ~2,000 Daily Users',
      tag: 'DEMOGRAPHIC RISK',
      desc: 'Cross-references POIs: Lincoln High School (180m) + bus stop (90m) + high traffic corridor.',
      icon: ShieldCheck,
    },
    {
      step: 6,
      title: 'P1 Priority Reasoning',
      tag: 'EXPLAINABILITY',
      desc: 'Always explains WHY an issue was prioritized: severity, density, population, location, SLA.',
      icon: Layers,
    },
    {
      step: 7,
      title: 'Street-Level Visual Capture',
      tag: 'AI SCANNER',
      desc: 'Seamless ingestion of patrol camera, UAV scan, and citizen mobile imagery.',
      icon: Camera,
    },
    {
      step: 8,
      title: 'Neural Object Detection',
      tag: 'COMPUTER VISION',
      desc: 'Multi-class bounding box inference with confidence metrics and damage severity scoring.',
      icon: Camera,
    },
    {
      step: 9,
      title: 'Authority Routing: Roads Dept',
      tag: 'AUTONOMOUS ROUTING',
      desc: 'Defect category + ward location automatically resolves to Municipal Roads Department.',
      icon: ArrowRight,
    },
    {
      step: 10,
      title: 'Status: IN_PROGRESS',
      tag: 'FIELD DISPATCH',
      desc: 'Dispatch unit mobilized; cryptographic audit log records duration since initial detection.',
      icon: Clock,
    },
    {
      step: 11,
      title: 'Live Telemetry Synchronization',
      tag: 'REACTIVE SYSTEM',
      desc: 'State updates synchronize across GIS map, priority queue, and analytics without page refresh.',
      icon: Layers,
    },
    {
      step: 12,
      title: 'Work Order Closure: RESOLVED',
      tag: 'RESOLVED',
      desc: 'Inspector signs off on polymer compaction; SLA compliance verified.',
      icon: CheckCircle2,
    },
    {
      step: 13,
      title: 'Before / After Impact Verification',
      tag: 'MEASURE IMPACT',
      desc: 'Severity drops 87 → 12. Resolution: 4.2 days. 2,000+ daily commuters protected.',
      icon: CheckCircle2,
    },
  ];

  const currentMeta = stepMeta[currentStep - 1] || stepMeta[0];
  const StepIcon = currentMeta.icon;

  return (
    <div className="fixed bottom-20 lg:bottom-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[2000] max-w-2xl w-auto sm:w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key="tour-shell"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="rounded-2xl bg-[#090D18]/95 border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-xl p-3.5 sm:p-5 text-slate-100 font-mono space-y-2.5 sm:space-y-3"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/80 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              </span>
              <span className="text-[11px] sm:text-xs font-black tracking-widest text-white truncate uppercase">
                Product Demo Tour
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 whitespace-nowrap shrink-0 font-mono">
                {currentStep}/{totalSteps}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Exit Demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Content with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 tracking-wider shrink-0">
                  {currentMeta.tag}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white font-display tracking-tight">
                  {currentMeta.title}
                </h4>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {currentMeta.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step Progress Bar */}
          <div className="w-full bg-slate-900/80 rounded-full h-1 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full"
              initial={false}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleRestart}
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
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish Demo</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
