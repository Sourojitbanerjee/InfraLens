import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FlipHorizontal,
  Sparkles,
  Upload
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Field Infrastructure Evidence',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMessage(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser. Use file upload fallback.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('[CameraCaptureModal] Camera initialization note:', err);
      setHasCameraPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser or use the file upload fallback.'
          : err.message || 'Unable to access live camera stream. You can capture or browse using device camera below.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front facing camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCapture(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl bg-[#090D18] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono text-slate-100"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#0E1524] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Camera className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <span className="text-[10px] text-slate-400">High-Resolution Sensor Capture</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="relative bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Defect"
                className="w-full h-full object-cover"
              />
            ) : hasCameraPermission !== false ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Viewfinder Overlay Targeting Reticle */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="text-center text-[11px] text-cyan-300 font-mono bg-black/50 px-2 py-0.5 rounded self-center backdrop-blur-sm border border-cyan-500/30">
                    ALIGN DEFECT IN RETICLE
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>
              </>
            ) : (
              /* Camera Unavailable / Denied Fallback UI */
              <div className="p-6 text-center space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Device Camera Direct Access</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {errorMessage || 'Tap below to launch your smartphone or tablet native camera app directly.'}
                  </p>
                </div>

                <button
                  onClick={() => fallbackInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 mx-auto shadow-lg shadow-emerald-500/20"
                >
                  <Camera className="w-4 h-4" />
                  Open Native Device Camera
                </button>
              </div>
            )}

            {/* Hidden fallback file input that activates camera on mobile */}
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFallbackFile}
              className="hidden"
            />
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-[#0E1524] border-t border-slate-800 flex items-center justify-between gap-3">
            {capturedImage ? (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Photo
                </button>

                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use Captured Photo
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  title="Switch Front / Rear Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>

                {hasCameraPermission !== false && (
                  <button
                    onClick={handleSnap}
                    className="relative group p-1.5 rounded-full border-4 border-white/40 hover:border-white transition-all active:scale-95"
                    title="Capture Photo"
                  >
                    <div className="w-12 h-12 rounded-full bg-white group-hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
                  </button>
                )}

                <button
                  onClick={() => fallbackInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  title="Upload from Device"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Upload File</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
