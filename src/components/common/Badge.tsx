import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'success' | 'indigo' | 'cyan';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    secondary: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    outline: 'bg-transparent text-slate-400 border-slate-700',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-400/40',
    emergency: 'bg-purple-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse',
  }[variant];

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.2',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
