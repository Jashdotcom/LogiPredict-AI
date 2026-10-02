import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Empty State component for lists, tables, and search results.
 */
export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There is currently no data matching your query or filter criteria.',
  action,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-semibold text-slate-900">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 leading-relaxed">{description}</p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
