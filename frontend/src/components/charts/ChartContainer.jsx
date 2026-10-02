import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '../common/Card';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { cn } from '../../utils/cn';

/**
 * Reusable Chart Container wrapping Recharts ResponsiveContainer with standard headers, badges & loading fallbacks.
 */
export function ChartContainer({
  title,
  subtitle,
  badge,
  action,
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
      {(title || subtitle || badge || action) && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          action={action || badge}
        />
      )}

      <div className="w-full flex-1" style={{ height: `${height}px`, minHeight: minHeight ? `${minHeight}px` : undefined }}>
        {isLoading ? (
          <LoadingState message="Calculating predictive curves..." fullHeight />
        ) : isEmpty ? (
          <EmptyState description={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>

      {footer && (
        <div className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </Card>
  );
}

export default ChartContainer;
