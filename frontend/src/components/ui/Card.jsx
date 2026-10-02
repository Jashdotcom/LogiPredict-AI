import React from 'react';
import { cn } from '../../utils/cn';

/**
 * LogiPredict AI — Enterprise Card Component System
 * Standard cards, elevated panels, subtle backgrounds, and KPI containers.
 */
export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hoverable = false,
  ...props
}) {
  const variants = {
    default: 'bg-slate-900 border border-slate-800 shadow-2xs text-slate-100',
    flat: 'bg-slate-950/80 border border-slate-800 text-slate-100',
    elevated: 'bg-[#131b2e] border border-slate-800 shadow-md text-slate-100',
    subtle: 'bg-indigo-950/30 border border-indigo-900/40 text-slate-100',
    bordered: 'bg-slate-900 border-2 border-slate-700 text-slate-100',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        variants[variant] || variants.default,
        paddings[padding] || paddings.default,
        hoverable ? 'hover:shadow-md hover:border-slate-700' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  children,
  action,
  className = '',
  border = false,
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        border ? 'pb-4 mb-4 border-b border-slate-800' : 'mb-4',
        className
      )}
    >
      <div className="space-y-0.5 min-w-0 flex-1">
        {title && (
          <h3 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100 tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={cn('text-xs text-slate-400 mt-0.5', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function CardFooter({ children, className = '', border = true }) {
  return (
    <div
      className={cn(
        'mt-5 pt-4 flex items-center justify-between gap-3 text-xs text-slate-400',
        border ? 'border-t border-slate-800' : '',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
