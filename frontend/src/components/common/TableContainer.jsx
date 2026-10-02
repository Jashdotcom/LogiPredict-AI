import React from 'react';
import { cn } from '../../utils/cn';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

/**
 * Enterprise Table Container with responsive scrolling, loading, and empty states.
 */
export function TableContainer({
  children,
  title,
  subtitle,
  action,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available in this view',
  emptyAction,
  pagination,
  className = '',
  tableClassName = '',
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Optional Table Header */}
      {(title || subtitle || action) && (
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Table Content Area */}
      <div className="overflow-x-auto w-full flex-1">
        {isLoading ? (
          <div className="py-12">
            <LoadingState message="Loading records..." />
          </div>
        ) : isEmpty ? (
          <div className="py-10">
            <EmptyState
              title="No records found"
              description={emptyMessage}
              action={emptyAction}
            />
          </div>
        ) : (
          <table className={cn('w-full text-left text-xs sm:text-sm text-slate-600', tableClassName)}>
            {children}
          </table>
        )}
      </div>

      {/* Optional Pagination Footer */}
      {pagination && (
        <div className="px-4 py-3 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {pagination}
        </div>
      )}
    </div>
  );
}

export default TableContainer;
