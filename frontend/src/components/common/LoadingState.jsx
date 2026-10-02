import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Loading State with customizable spinner and message.
 */
export function LoadingState({
  message = 'Loading telemetry & forecasts...',
  description,
  fullHeight = false,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        fullHeight ? 'min-h-[300px]' : '',
        className
      )}
    >
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}

export default LoadingState;
