import React from 'react';
import { PackageOpen, SearchX, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

/**
 * Enterprise Empty State Display
 */
export function EmptyState({
  title = 'No data available',
  description = 'There are no records to display at this time.',
  icon: CustomIcon,
  variant = 'default', // 'default' | 'search' | 'error'
  actionText,
  onAction,
  actionButton,
  className = '',
}) {
  const variantIcons = {
    default: PackageOpen,
    search: SearchX,
    error: AlertCircle,
  };

  const IconComponent = CustomIcon || variantIcons[variant] || PackageOpen;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-900 rounded-xl border border-slate-800 shadow-xs',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3.5 shadow-2xs">
        <IconComponent className="w-6 h-6" />
      </div>

      <h3 className="text-sm sm:text-base font-bold text-slate-200 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionButton ? (
        <div className="mt-5">{actionButton}</div>
      ) : actionText && onAction ? (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
