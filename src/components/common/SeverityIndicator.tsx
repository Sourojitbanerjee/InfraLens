import React from 'react';
import { Severity } from '../../types/infrastructure';

interface SeverityIndicatorProps {
  severity: Severity;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({
  severity,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const configs: Record<Severity, { bg: string; text: string; dot: string; label: string; border: string }> = {
    healthy: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/30',
      label: 'Healthy',
    },
    moderate: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-500/30',
      label: 'Moderate',
    },
    high: {
      bg: 'bg-orange-950/40',
      text: 'text-orange-400',
      dot: 'bg-orange-400',
      border: 'border-orange-500/30',
      label: 'High',
    },
    critical: {
      bg: 'bg-rose-950/50',
      text: 'text-rose-400',
      dot: 'bg-rose-500',
      border: 'border-rose-500/40',
      label: 'Critical',
    },
  };

  const config = configs[severity] || configs.moderate;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`rounded-full ${config.dot} ${severity === 'critical' ? 'animate-ping inline-flex absolute opacity-75' : ''} ${dotSize}`} />
      <span className={`rounded-full ${config.dot} relative inline-flex ${dotSize}`} />
      {showLabel && <span className="tracking-wide uppercase text-[10px]">{config.label}</span>}
    </span>
  );
};
