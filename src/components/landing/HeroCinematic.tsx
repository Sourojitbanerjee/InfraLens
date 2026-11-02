import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfra } from '../../context/InfraContext';
import { SAMPLE_STREET_IMAGES, SampleStreetPreset } from '../../data/sampleStreetImages';
import {
  Play,
  RotateCcw,
  Scan,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Activity,
  Sparkles,
  Layers,
  ChevronRight,
  Eye
} from 'lucide-react';

export const HeroCinematic: React.FC = () => {
  const { setCurrentView } = useInfra();
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [animationStep, setAnimationStep] = useState<number>(4);
  const [isScanning, setIsScanning] = useState(false);

  const preset: SampleStreetPreset = SAMPLE_STREET_IMAGES[activePresetIndex];

  const triggerCinematicSequence = () => {
    setIsScanning(true);
    setAnimationStep(0);
    setTimeout(() => setAnimationStep(1), 400);
    setTimeout(() => setAnimationStep(2), 1100);
    setTimeout(() => setAnimationStep(3), 1700);
    setTimeout(() => {
      setAnimationStep(4);
      setIsScanning(false);
    }, 2300);
  };

  useEffect(() => {
    triggerCinematicSequence();
  }, [activePresetIndex]);

  const stepsLabel = ['Image', 'Scan', 'BBoxes', 'Classify', 'Impact'];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[600px] max-w-[90vw] h-[250px] sm:h-[350px] bg-cyan-500/8 blur-[90px] sm:blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Hero Headline */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="text-center max-w-3xl mx-auto mb-10 lg:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AUTONOMOUS URBAN SENSING PLATFORM</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] break-words font-display">
          From street-level evidence{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            to city-level action.
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-sans">
          AI-powered infrastructure intelligence for faster, smarter, and more accountable cities.
        </p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4"
        >
          <button
            onClick={() => setCurrentView('analyze')}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-display text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-2 sm:gap-2.5 active:scale-95"
          >
            <Scan className="w-4 h-4" />
            <span>Analyze Street Image</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentView('map')}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#0E1524] hover:bg-[#141E33] border border-slate-700 hover:border-cyan-500/50 text-slate-200 font-sans text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Explore City Map</span>
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-3 sm:py-3.5 rounded-xl text-slate-400 hover:text-white font-sans text-xs transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>
        </motion.div>
      </motion.div>

      {/* HERO HUD */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
        className="relative rounded-2xl bg-[#080B13] border border-cyan-500/25 shadow-2xl overflow-hidden shadow-cyan-950/40"
      >
        {/* HUD Top Bar */}
        <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-[#0B101D] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
              <span className="font-bold text-[10px] sm:text-xs">
                <span className="hidden sm:inline">INFRALENS </span>VISION KERNEL 3.4
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="text-slate-400 hidden sm:flex items-center gap-1.5">
              <span>TARGET:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{preset.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 overflow-x-auto no-scrollbar max-w-[220px] sm:max-w-none">
              {SAMPLE_STREET_IMAGES.slice(0, 4).map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActivePresetIndex(idx)}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] rounded transition-colors whitespace-nowrap ${
                    activePresetIndex === idx
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">S{idx + 1}</span>
                  <span className="hidden sm:inline">Scenario {idx + 1}</span>
                </button>
              ))}
            </div>

            <button
              onClick={triggerCinematicSequence}
              disabled={isScanning}
              className="p-1.5 rounded-lg bg-[#141C2E] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
              title="Re-run Cinematic Sequence"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[580px] w-full bg-slate-950 overflow-hidden select-none">
          <AnimatePresence mode="wait">
            <motion.img
              key={preset.id}
              src={preset.imageUrl}
              alt={preset.title}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, #06B6D4 1px, transparent 1px), linear-gradient(to bottom, #06B6D4 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Stage 1: Scan Beam */}
          {animationStep >= 1 && animationStep < 3 && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06B6D4] animate-scanbeam pointer-events-none z-20">
              <div className="absolute top-0 right-4 sm:right-10 text-[9px] sm:text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded">
                NEURAL CONVOLUTION IN PROGRESS...
              </div>
            </div>
          )}

          {/* Stage 2+3: Bounding Boxes */}
          {animationStep >= 2 &&
            preset.detections.map((det) => (
              <motion.div
                key={det.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="absolute border-2 border-rose-500 bg-rose-500/12"
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

                {animationStep >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-9 sm:-top-10 left-0 bg-slate-950/90 border border-rose-500/80 rounded-md p-1 sm:p-1.5 shadow-xl backdrop-blur-md min-w-[150px] sm:min-w-[190px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] sm:text-[10px] font-extrabold text-white truncate">
                        {det.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 font-mono text-[8px] sm:text-[9px]">
                      <span className="text-cyan-400 font-bold">{det.confidence}% conf</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-rose-400 uppercase font-bold">{det.severity}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

          {/* Stage 4: HUD Overlays */}
          <AnimatePresence>
            {animationStep >= 4 && (
              <>
                {/* Geospatial Pin HUD (Desktop) */}
                <motion.div
                  key="pin-hud"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block absolute top-6 left-6 z-20 max-w-sm rounded-xl bg-[#090D17]/95 border border-cyan-500/40 p-4 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                      GEOSPATIAL PIN CONFIRMED
                    </span>
                    <span className="text-slate-400">WARD 6 SOMA</span>
                  </div>

                  <div className="text-xs font-semibold text-slate-100">{preset.location}</div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Nearby Risk Factors:</div>
                    {preset.nearbyRisks.map((risk, i) => (
                      <div key={i} className="flex justify-between text-slate-300">
                        <span>{risk.name}</span>
                        <span className="text-rose-400 font-bold">{risk.distanceMeters}m</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Impact HUD (Desktop) */}
                <motion.div
                  key="impact-hud"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block absolute bottom-6 right-6 z-20 max-w-xs rounded-xl bg-[#090D17]/95 border border-amber-500/40 p-4 shadow-2xl backdrop-blur-md"
                >
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Impact Prioritization
                  </div>

                  <div className="text-2xl font-extrabold font-mono text-slate-100">
                    ~{preset.affectedDailyCommuters.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">users / day</span>
                  </div>

                  <div className="mt-2 text-[11px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 p-2 rounded-lg">
                    {preset.recommendedAction}
                  </div>

                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect in Command Center</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Pipeline step bar */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/85 border border-slate-800 backdrop-blur-md text-[10px] sm:text-[11px] font-mono text-slate-400 overflow-x-auto max-w-[95%] no-scrollbar whitespace-nowrap">
            {stepsLabel.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span>→</span>}
                <span className={animationStep >= i ? 'text-cyan-400 font-bold' : ''}>{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Mobile adaptive grid */}
        <AnimatePresence>
          {animationStep >= 4 && (
            <motion.div
              key="mobile-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden p-4 bg-[#090D18] border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs"
            >
              {/* Mobile Pin Card */}
              <div className="p-3.5 rounded-xl bg-[#0E1524] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                    GEOSPATIAL PIN CONFIRMED
                  </span>
                  <span className="text-[10px] text-slate-400">WARD 6 SOMA</span>
                </div>
                <div className="text-xs font-semibold text-slate-100">{preset.location}</div>
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Nearby Risk Factors:</div>
                  {preset.nearbyRisks.map((risk, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>{risk.name}</span>
                      <span className="text-rose-400 font-bold">{risk.distanceMeters}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Impact Card */}
              <div className="p-3.5 rounded-xl bg-[#0E1524] border border-amber-500/30 space-y-2">
                <div className="text-[10px] uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Impact Prioritization
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
                  ~{preset.affectedDailyCommuters.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-1">users / day</span>
                </div>
                <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/30 p-2 rounded-lg">
                  {preset.recommendedAction}
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect in Command Center</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
