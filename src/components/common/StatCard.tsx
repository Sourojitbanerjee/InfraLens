import React, { ReactNode, useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: ReactNode;
  accentColor?: 'rose' | 'amber' | 'cyan' | 'emerald' | 'slate';
  onClick?: () => void;
  active?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  accentColor = 'slate',
  onClick,
  active = false,
}) => {
  // Animated numerical transition (Rule 2)
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    // If value is numeric or formatted number with suffix (e.g. 76.4% or 28h or 14,200)
    const rawStr = String(value);
    const numMatch = rawStr.match(/^([\d,]+(\.\d+)?)(.*)$/);
    if (!numMatch) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(numMatch[1].replace(/,/g, ''));
    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    const suffix = numMatch[3] || '';
    const isFloat = numMatch[1].includes('.');
    const duration = 600; // ms
    const startTime = performance.now();

    let animFrame: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * ease;

      const formatted = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();
      setDisplayValue(`${formatted}${suffix}`);

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [value]);

  const accentGlow = {
    rose: 'border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-[#0A0E17]',
    amber: 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-[#0A0E17]',
    cyan: 'border-cyan-500/30 hover:border-cyan-500/60 bg-gradient-to-b from-cyan-950/20 to-[#0A0E17]',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-emerald-950/20 to-[#0A0E17]',
    slate: 'border-slate-800 hover:border-slate-700 bg-gradient-to-b from-[#111726]/80 to-[#0A0E17]',
  }[accentColor];

  const valueColor = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    slate: 'text-slate-100',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-3 sm:p-4 transition-all duration-200 ${accentGlow} ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${active ? 'ring-1 ring-cyan-400/50 border-cyan-400/70 shadow-lg shadow-cyan-950/30' : ''}`}
    >
      <div className="flex items-center justify-between text-slate-400 mb-1.5">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 truncate">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accentColor === 'rose' ? 'bg-rose-500 animate-pulse' : accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
          <span className="truncate">{label}</span>
        </span>
        {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
          <span className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-mono ${valueColor}`}>
            {displayValue}
          </span>
          {subValue && (
            <span className="text-[10px] sm:text-xs text-slate-500 font-mono">
              {subValue}
            </span>
          )}
        </div>

        {trend && (
          <div
            className={`text-[9px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
              trend.isNeutral
                ? 'bg-slate-800 text-slate-400'
                : trend.isPositive
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-950/60 text-rose-400 border border-rose-500/20'
            }`}
          >
            <span>{trend.isPositive ? '↑' : trend.isNeutral ? '→' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
