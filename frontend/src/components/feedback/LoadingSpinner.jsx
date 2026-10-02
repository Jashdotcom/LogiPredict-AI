import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Universal Loading Spinner Indicator
 */
export function LoadingSpinner({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text,
  fullPage = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn('animate-spin text-indigo-400', sizeClasses[size] || sizeClasses.md)}
      />
      {text && (
        <span className="text-xs sm:text-sm font-medium text-slate-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div className="bg-[#131b2e] p-6 rounded-2xl shadow-xl border border-slate-800">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
