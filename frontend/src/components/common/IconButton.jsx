import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Icon Button for toolbar actions, notifications, and compact triggers.
 */
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  badge,
  badgeVariant = 'danger',
  className = '',
  title = '',
  disabled = false,
  type = 'button',
  children,
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    ghost:
      'text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-indigo-500',
    outline:
      'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs focus-visible:ring-indigo-500',
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs focus-visible:ring-indigo-500',
    secondary:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
    subtle:
      'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 focus-visible:ring-indigo-400',
  };

  const sizes = {
    xs: 'w-7 h-7 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-10 h-10 p-2.5',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(baseStyles, variants[variant] || variants.ghost, sizes[size] || sizes.md, className)}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size] || 'w-5 h-5'} />}
      {children}
      {badge !== undefined && badge !== null && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white rounded-full ring-2 ring-white',
            badgeVariant === 'danger' ? 'bg-rose-600' : 'bg-indigo-600'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default IconButton;
