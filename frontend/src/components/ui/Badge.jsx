import React from 'react';
import { cn } from '../../utils/cn';

/**
 * LogiPredict AI — Enterprise Status Badge Component
 * Supports neutral, brand, success, warning, critical, danger, info (information), and purple variants
 * with dot indicators, pulse animation, custom icons, and size scales.
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  dotPulse = false,
  pill = true,
  icon: Icon,
  className = '',
  ...props
}) {
  const variants = {
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200/80',
      dot: 'bg-slate-500',
    },
    brand: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-600',
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    danger: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    info: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    information: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1 gap-2 font-semibold',
  };

  const currentVariant = variants[variant] || variants.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center border tracking-wide select-none',
        pill ? 'rounded-full' : 'rounded-md',
        currentVariant.bg,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {dotPulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                currentVariant.dot
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', currentVariant.dot)}
          />
        </span>
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
