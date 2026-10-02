import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import { LoadingState } from '../feedback/LoadingState';
import { EmptyState } from '../feedback/EmptyState';
import { Skeleton } from '../feedback/Skeleton';
import { cn } from '../../utils/cn';

/**
 * Reusable Chart Container wrapping Recharts ResponsiveContainer.
 * Provides standard titles, subtitles, status badges, time-range selectors,
 * skeleton loading states, empty fallbacks, and footers.
 */
export function ChartContainer({
  title,
  subtitle,
  badge,
  action,
  timeRanges,
  selectedTimeRange,
  onTimeRangeChange,
  legend,
  height = 280,
  minHeight,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No chart telemetry available for the selected horizon',
  footer,
  children,
  className = '',
}) {
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Chart Header with optional Time-Range Selector and Action */}
      {(title || subtitle || badge || action || timeRanges) && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          action={
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {badge}
              {timeRanges && timeRanges.length > 0 && (
                <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
                  {timeRanges.map((tr) => (
                    <button
                      key={tr.value || tr}
                      type="button"
                      onClick={() => onTimeRangeChange && onTimeRangeChange(tr.value || tr)}
                      className={cn(
                        'px-2 py-0.5 rounded-md transition-all cursor-pointer text-[11px]',
                        selectedTimeRange === (tr.value || tr)
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'hover:text-slate-900'
                      )}
                    >
                      {tr.label || tr}
                    </button>
                  ))}
                </div>
              )}
              {action}
            </div>
          }
        />
      )}

      {/* Optional custom legend bar */}
      {legend && <div className="pb-2">{legend}</div>}

      {/* Chart Content Area */}
      <div
        className="w-full flex-1 relative"
        style={{
          height: `${height}px`,
          minHeight: minHeight ? `${minHeight}px` : undefined,
        }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-2xs rounded-lg">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState description={emptyMessage} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>

      {/* Optional Footer Bar */}
      {footer && (
        <div className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          {footer}
        </div>
      )}
    </Card>
  );
}

export default ChartContainer;
