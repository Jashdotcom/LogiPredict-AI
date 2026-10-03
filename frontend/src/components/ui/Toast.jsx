import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Reusable Individual Toast Item
 */
export function Toast({
  id,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  description,
  onDismiss,
  className = '',
}) {
  const displayMessage = message || description;

  const typeConfigs = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-700/60',
      bg: 'bg-white',
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      titleColor: 'text-slate-900',
    },
    error: {
      icon: AlertOctagon,
      border: 'border-rose-700/60',
      bg: 'bg-white',
      iconColor: 'text-rose-700 bg-rose-50 border-rose-200',
      titleColor: 'text-slate-900',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-700/60',
      bg: 'bg-white',
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      titleColor: 'text-slate-900',
    },
    info: {
      icon: Info,
      border: 'border-indigo-700/60',
      bg: 'bg-white',
      iconColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      titleColor: 'text-slate-900',
    },
  };

  const config = typeConfigs[type] || typeConfigs.info;
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full sm:max-w-sm rounded-xl shadow-lg border p-4 transition-all duration-200 select-none flex items-start gap-3',
        'animate-in fade-in slide-in-from-top-3',
        config.bg,
        config.border,
        className
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
          config.iconColor
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5 pr-1">
        {title && (
          <h4 className={cn('text-xs sm:text-sm font-bold tracking-tight', config.titleColor)}>
            {title}
          </h4>
        )}
        {displayMessage && (
          <p className="text-xs text-slate-600 leading-snug">
            {displayMessage}
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-slate-500 hover:text-slate-700 p-1 rounded-md cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default Toast;
