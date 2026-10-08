import React, { useState, useRef } from 'react';
import { useInfra } from '../../context/InfraContext';
import { SAMPLE_STREET_IMAGES, SampleStreetPreset } from '../../data/sampleStreetImages';
import { AiVisionService, AnalysisStage, AiInferenceResult } from '../../services/aiVisionService';
import { DetectionServiceFactory, MockDetectionService, RealDetectionService } from '../../services/detectionService';
import { SeverityIndicator } from '../common/SeverityIndicator';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { 
  Camera, 
  UploadCloud, 
  Scan, 
  Send, 
  RotateCcw, 
  MapPin, 
  Users, 
  Sparkles, 
  Layers, 
  FileImage,
  Cpu,
  ShieldCheck,
  Building2,
  Crosshair,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export const AnalyzeView: React.FC = () => {
  const { createNewIssue, openDetailDrawer, setCurrentView, authorities } = useInfra();

  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_STREET_IMAGES[0].imageUrl);
  const [activePresetId, setActivePresetId] = useState<string>(SAMPLE_STREET_IMAGES[0].id);
  const [inferenceResult, setInferenceResult] = useState<AiInferenceResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customImageLocation, setCustomImageLocation] = useState('4th Street & Bryant Blvd Corridor');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({ lat: 37.7792, lon: -122.4191 });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activeEngineType, setActiveEngineType] = useState<'mock' | 'real'>('mock');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSwitchEngine = (type: 'mock' | 'real') => {
    setActiveEngineType(type);
    if (type === 'mock') {
      DetectionServiceFactory.setService(new MockDetectionService());
    } else {
      DetectionServiceFactory.setService(new RealDetectionService());
    }
    // Re-run analysis if image is loaded
    if (selectedImage) {
      startAnalysis(selectedImage, activePresetId);
    }
  };

  const startAnalysis = async (imgUrl: string, presetId?: string, overrideCoords?: { lat: number; lon: number }) => {
    setSelectedImage(imgUrl);
    setInferenceResult(null);
    setStage('upload');
    setProgressPercent(12);

    const coords = overrideCoords || coordinates;

    try {
      const result = await AiVisionService.analyzeStreetImage(
        imgUrl,
        presetId,
        (currStage, pct) => {
          setStage(currStage);
          setProgressPercent(pct);
        },
        { latitude: coords.lat, longitude: coords.lon }
      );
      setInferenceResult(result);
    } catch (err) {
      console.error(err);
      setStage('error');
    }
  };

  const handleSelectPreset = (preset: SampleStreetPreset) => {
    setActivePresetId(preset.id);
    setCustomImageLocation(preset.location);
    startAnalysis(preset.imageUrl, preset.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setActivePresetId('');
        startAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setActivePresetId('');
        startAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDispatchToCommandCenter = async () => {
    if (!inferenceResult) return;
    setIsSubmitting(true);

    try {
      const matchedAuth =
        authorities.find((a) => a.id === inferenceResult.suggestedAuthorityId) || authorities[0];

      const created = await createNewIssue({
        title: `AI Detected: ${inferenceResult.detections[0]?.label || 'Infrastructure Defect'}`,
        category: inferenceResult.dominantCategory,
        categoryLabel: inferenceResult.dominantCategory.replace('_', ' ').toUpperCase(),
        severity: inferenceResult.dominantSeverity,
        severityScore: inferenceResult.severityScore,
        priority: inferenceResult.priorityExplainability.priority,
        confidence: inferenceResult.confidence,
        location: {
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          address: customImageLocation,
          ward: 'Ward 6 — Mission & SOMA',
          zone: 'Transit & Pedestrian Arterial',
          timestamp: new Date().toISOString(),
        },
        imageUrl: inferenceResult.imageUrl,
        status: 'detected',
        authorityId: matchedAuth.id,
        authorityName: matchedAuth.name,
        departmentName: inferenceResult.departmentName,
        impact: inferenceResult.impact,
        detections: inferenceResult.detections,
        reportedBy: 'AI_SURVEILLANCE',
        notes: `Analyzed via ${inferenceResult.modelEngineName}. Prioritized as ${inferenceResult.priorityExplainability.priority}.`,
      });

      setCurrentView('dashboard');
      openDetailDrawer(created);
    } catch (err) {
      console.error('Failed to dispatch:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Engine Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
              AI STREET ANALYSIS
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              STREET-LENS v3.4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Full Pipeline: IMAGE → COMPUTER VISION → SEVERITY → GPS → GIS → CLUSTERING → IMPACT → PRIORITY → DISPATCH
          </p>
        </div>

        {/* Model Inference Engine Switcher (Rule 2 & 3 requirement) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl bg-[#0E1524] border border-slate-800 p-1 text-xs font-mono">
            <span className="text-slate-500 px-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Engine:
            </span>
            <button
              onClick={() => handleSwitchEngine('mock')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeEngineType === 'mock'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mock Edge Sim (Deterministic)
            </button>
            <button
              onClick={() => handleSwitchEngine('real')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeEngineType === 'real'
                  ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Real YOLOv11 ONNX Adapter
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline 8-Stage Progress Ribbon (Rule 5) */}
      <div className="hidden md:grid grid-cols-8 gap-1.5 p-2.5 rounded-xl bg-[#0A0E18] border border-slate-800 text-[10px] font-mono text-center">
        {[
          { key: 'upload', label: '1. UPLOAD' },
          { key: 'processing', label: '2. PROCESSING' },
          { key: 'scanning', label: '3. AI SCAN' },
          { key: 'object_detection', label: '4. DETECTION' },
          { key: 'severity_analysis', label: '5. SEVERITY' },
          { key: 'geolocation', label: '6. GEOLOCATION' },
          { key: 'impact_analysis', label: '7. IMPACT' },
          { key: 'priority_generated', label: '8. PRIORITY' },
        ].map((s, idx) => {
          const isPassed =
            stage === 'completed' ||
            (stage === 'priority_generated' && idx <= 7) ||
            (stage === 'impact_analysis' && idx <= 6) ||
            (stage === 'geolocation' && idx <= 5) ||
            (stage === 'severity_analysis' && idx <= 4) ||
            (stage === 'object_detection' && idx <= 3) ||
            (stage === 'scanning' && idx <= 2) ||
            (stage === 'processing' && idx <= 1) ||
            (stage === 'upload' && idx === 0);

          const isCurrent = stage === s.key;

          return (
            <div
              key={s.key}
              className={`py-1 px-1 rounded transition-colors ${
                isCurrent
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 animate-pulse'
                  : isPassed
                  ? 'bg-emerald-950/40 text-emerald-400 font-medium'
                  : 'text-slate-600 bg-slate-900/40'
              }`}
            >
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Main Analysis Layout: Left Stage & Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Upload & Visualization Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset Selector Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">Preset Scenarios:</span>
            {SAMPLE_STREET_IMAGES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  activePresetId === preset.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-400/80 font-bold shadow-md shadow-cyan-950/30'
                    : 'bg-[#0E1524] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Visualizer Area */}
          <div className="relative rounded-2xl bg-[#090D17] border border-slate-800 overflow-hidden shadow-2xl">
            {/* Stage Telemetry Bar */}
            <div className="px-4 py-2.5 bg-[#0D1322] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 uppercase">Status:</span>
                <span
                  className={`font-bold uppercase ${
                    stage === 'completed'
                      ? 'text-emerald-400'
                      : stage === 'scanning'
                      ? 'text-cyan-400 animate-pulse'
                      : 'text-amber-400'
                  }`}
                >
                  {stage === 'idle'
                    ? 'READY FOR INGEST'
                    : stage === 'upload'
                    ? '1. UPLOADING IMAGE'
                    : stage === 'processing'
                    ? '2. PREPROCESSING & TENSORS'
                    : stage === 'scanning'
                    ? '3. AI SCANNING'
                    : stage === 'object_detection'
                    ? '4. OBJECT DETECTION'
                    : stage === 'severity_analysis'
                    ? '5. SEVERITY COMPUTATION'
                    : stage === 'geolocation'
                    ? '6. GIS GEOCODING'
                    : stage === 'impact_analysis'
                    ? '7. CIVIC IMPACT ASSESSMENT'
                    : stage === 'priority_generated'
                    ? '8. PRIORITY GENERATED'
                    : stage === 'error'
                    ? 'INGEST FAILED'
                    : 'PIPELINE COMPLETE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {DetectionServiceFactory.getService().isSimulated ? 'SIMULATED' : 'LIVE ONNX'}
                </span>
                <span className="text-cyan-400 font-bold">{progressPercent}%</span>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative aspect-[16/10] w-full bg-slate-950 flex items-center justify-center overflow-hidden"
            >
              {stage === 'error' ? (
                <div className="text-center p-8 space-y-4 max-w-md mx-auto z-30">
                  <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-mono text-base font-bold text-white">InfraLens couldn&apos;t process this image.</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Image metadata or compression format could not be verified for tensor normalization.
                    </p>
                  </div>
                  <button
                    onClick={() => startAnalysis(selectedImage || SAMPLE_STREET_IMAGES[0].imageUrl)}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-cyan-600/30 inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>TRY AGAIN</span>
                  </button>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-300 underline"
                    >
                      {showErrorDetails ? 'Hide technical diagnostics' : 'Technical details'}
                    </button>
                    {showErrorDetails && (
                      <div className="mt-2 text-left p-3 rounded-lg bg-black/90 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                        <div>ENGINE: ONNX Runtime WASM v1.17.0</div>
                        <div>STATUS: ERR_IMAGE_DECODE_STREAM_TIMEOUT</div>
                        <div>IMAGE_URI: {selectedImage.substring(0, 48)}...</div>
                        <div>RECOVERY: Fallback to simulated heuristic inference available.</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Analyzed Street"
                    className="w-full h-full object-cover"
                  />

                  {/* Neural Grid Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #06B6D4 1px, transparent 1px), linear-gradient(to bottom, #06B6D4 1px, transparent 1px)',
                      backgroundSize: '36px 36px',
                    }}
                  />

                  {/* Laser Scanning Beam */}
                  {stage === 'scanning' && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06B6D4] animate-scanbeam pointer-events-none z-20">
                      <div className="absolute top-1 right-8 text-[10px] font-mono text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/40">
                        {DetectionServiceFactory.getService().name}
                      </div>
                    </div>
                  )}

                  {/* Bounding Box Overlays */}
                  {inferenceResult &&
                    inferenceResult.detections.map((det) => (
                      <div
                        key={det.id}
                        className="absolute border-2 border-rose-500 bg-rose-500/20 transition-all duration-300 animate-in fade-in"
                        style={{
                          left: `${det.x}%`,
                          top: `${det.y}%`,
                          width: `${det.width}%`,
                          height: `${det.height}%`,
                        }}
                      >
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />

                        <div className="absolute -top-7 left-0 bg-slate-950/95 border border-rose-500 rounded px-1.5 py-0.5 shadow-lg whitespace-nowrap">
                          <span className="font-mono text-[10px] font-bold text-white">
                            {det.label}
                          </span>
                          <span className="font-mono text-[9px] text-cyan-400 ml-1.5 font-bold">
                            {det.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <UploadCloud className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-mono text-slate-400">
                    Drag and drop high-resolution street photo here or click browse
                  </p>
                </div>
              )}
            </div>

            {/* Upload & Location Controls Bar */}
            <div className="p-4 bg-[#0B0F19] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#141C2E] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
                >
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Browse Image</span>
                </button>

                <button
                  onClick={() => startAnalysis(selectedImage, activePresetId)}
                  className="px-3 py-1.5 rounded-lg bg-[#141C2E] hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-scan</span>
                </button>

                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#161326] hover:bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Set Manual GPS Pin</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>{coordinates.lat.toFixed(4)}° N, {coordinates.lon.toFixed(4)}° W</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Priority Engine & Dispatch Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                AI Inference Telemetry
              </h2>
              {inferenceResult && (
                <span
                  className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded ${
                    inferenceResult.priorityExplainability.priority === 'P0'
                      ? 'bg-purple-950 text-rose-300 border border-rose-500 animate-pulse'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {inferenceResult.priorityExplainability.priority} {inferenceResult.priorityExplainability.priorityLabel}
                </span>
              )}
            </div>

            {!inferenceResult ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 mx-auto flex items-center justify-center animate-pulse">
                  <Scan className="w-4 h-4 text-cyan-400" />
                </div>
                <div>Awaiting neural analysis completion...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Detected Issues List */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    Classified Detections ({inferenceResult.detections.length})
                  </div>
                  {inferenceResult.detections.map((det) => (
                    <div
                      key={det.id}
                      className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-100 font-mono">
                          {det.label.split('(')[0].trim()}
                        </span>
                        <SeverityIndicator severity={det.severity} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Confidence: <strong className="text-cyan-400">{det.confidence}%</strong></span>
                        <span>Severity: <strong className="text-rose-400">{inferenceResult.severityScore}/100</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Priority Explainability Breakdown (Rule 9) */}
                <div className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-cyan-500/30 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Priority Ranking Explainability
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {inferenceResult.priorityExplainability.score} / 100
                    </span>
                  </div>

                  <ul className="space-y-1 text-[11px] pl-1">
                    {inferenceResult.priorityExplainability.reasons.map((reason, i) => (
                      <li key={i} className="text-slate-300 flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Commuter Exposure & Sensitive Assets */}
                <div className="p-3.5 rounded-xl bg-[#0B101D] border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">
                    Commuter & Urban Impact
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Daily Commuters:</span>
                    <span className="font-bold text-white">~{inferenceResult.impact.affectedUsersPerDay.toLocaleString()} / day</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Traffic Corridor:</span>
                    <span className="font-bold text-amber-400 uppercase">{inferenceResult.impact.trafficImportance}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                    <div className="text-[10px] text-slate-500">PROXIMATE ASSETS:</div>
                    {inferenceResult.impact.nearbyRisks.map((risk, i) => (
                      <div key={i} className="flex justify-between text-slate-300">
                        <span>{risk.name}</span>
                        <span className="text-rose-400 font-bold">{risk.distanceMeters}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authority Routing Banner */}
                <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Routed Authority & SLA
                    </span>
                    <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                      {inferenceResult.departmentName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                      Target SLA: Within {inferenceResult.impact.slaDeadlineHours} hours
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-cyan-400" />
                </div>

                {/* Dispatch Button */}
                <button
                  onClick={handleDispatchToCommandCenter}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>DISPATCH TO CITY COMMAND CENTER</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual GPS Pin Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Set Manual GPS Geolocation Pin"
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400">
            Override optical GPS coordinates when EXIF metadata is unavailable:
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1">Street Address / Corridor</label>
              <input
                type="text"
                value={customImageLocation}
                onChange={(e) => setCustomImageLocation(e.target.value)}
                className="w-full bg-[#0E1524] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates((c) => ({ ...c, lat: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#0E1524] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinates.lon}
                  onChange={(e) => setCoordinates((c) => ({ ...c, lon: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#0E1524] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsPinModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsPinModalOpen(false);
                if (selectedImage) {
                  startAnalysis(selectedImage, activePresetId, coordinates);
                }
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Apply Coordinates
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
