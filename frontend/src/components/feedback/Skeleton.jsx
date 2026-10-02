import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Primitive Skeleton Shimmer
 */
export function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  const variantStyles = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-800/60',
        variantStyles[variant] || variantStyles.rectangular,
        className
      )}
      {...props}
    />
  );
}

/**
 * Text Lines Skeleton Placeholder
 */
export function SkeletonText({ lines = 3, className = '', lineClassName = '' }) {
  return (
    <div className={cn('space-y-2.5 w-full', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="text"
          className={cn(
            'h-3.5',
            idx === lines - 1 ? 'w-3/5' : 'w-full',
            lineClassName
          )}
        />
      ))}
    </div>
  );
}

/**
 * KPI Metric Card Skeleton Loader
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={cn(
        'bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between h-36 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-7 w-36 rounded-md" />
        </div>
        <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton Loader with configurable rows and columns
 */
export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div
      className={cn(
        'w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      {/* Header bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-3.5 w-24 rounded" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-6 py-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn('h-4 rounded', cIdx === 0 ? 'w-32' : 'w-20')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart Skeleton Loader
 */
export function SkeletonChart({ height = 'h-72', className = '' }) {
  return (
    <div
      className={cn(
        'w-full bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col gap-4 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-8 w-44 rounded-lg" />
      </div>

      <div className={cn('w-full bg-slate-800/40 rounded-lg flex items-end gap-3 p-6', height)}>
        <Skeleton className="w-1/12 h-32 rounded-t" />
        <Skeleton className="w-1/12 h-48 rounded-t" />
        <Skeleton className="w-1/12 h-24 rounded-t" />
        <Skeleton className="w-1/12 h-56 rounded-t" />
        <Skeleton className="w-1/12 h-40 rounded-t" />
        <Skeleton className="w-1/12 h-64 rounded-t" />
        <Skeleton className="w-1/12 h-36 rounded-t" />
        <Skeleton className="w-1/12 h-52 rounded-t" />
        <Skeleton className="w-1/12 h-44 rounded-t" />
        <Skeleton className="w-1/12 h-60 rounded-t" />
        <Skeleton className="w-1/12 h-28 rounded-t" />
        <Skeleton className="w-1/12 h-48 rounded-t" />
      </div>
    </div>
  );
}

export default Skeleton;
