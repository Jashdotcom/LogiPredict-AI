import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Section Heading for module partitions and card grids.
 */
export function SectionHeading({
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-slate-800',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="p-1.5 rounded-md bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeading;
